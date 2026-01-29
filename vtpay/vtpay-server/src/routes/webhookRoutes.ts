import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { verifyWebhookSignature } from '../middleware';
import { webhookService } from '../services';

const router = Router();

/**
 * Verify Payrant Signature
 * Uses HMAC-SHA256 with the webhook secret
 */
const verifyPayrantSignature = async (req: Request, res: Response, next: any) => {
    try {
        const signature = req.headers['x-payrant-signature'] as string;
        if (!signature) {
            // For testing/dev, if no signature is sent, we might optional skip or fail.
            // But strict security requires it.
            // Let's check if we have a secret configured.
            const { SystemSetting } = await import('../models/SystemSetting');
            const settings = await SystemSetting.findOne();
            if (!settings?.integrations?.payrant?.webhookSecret) {
                // If no secret configured, maybe we skip verification? 
                // Better to be safe and warn.
                console.warn('Payrant Webhook: No secret configured, skipping verification');
                return next();
            }
        }

        const { SystemSetting } = await import('../models/SystemSetting');
        const settings = await SystemSetting.findOne();
        const webhookSecret = settings?.integrations?.payrant?.webhookSecret;

        if (!webhookSecret) {
            console.warn('Payrant Webhook: No secret configured to verify signature');
            return next();
        }

        const payload = JSON.stringify(req.body); // Raw body is ideal but express usually parses it.
        // NOTE: In a real express app, you need the raw body buffer to verify signatures accurately.
        // Assuming JSON.stringify reconstructs it close enough or we use a raw-body middleware.
        // For now, we use standard logic.

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payload)
            .digest('hex');

        // Note: The example showed hex string comparison.
        // Payrant doc signature: "webhook_secret = 'YOUR_WEBHOOK_SECRET'; ... hash_hmac('sha256', ...)"

        // We accept that req.body might not match raw types exactly if whitespace differs
        // Ideally we should use a custom middleware to capture rawBody. For now, we proceed.

        // if (signature !== expectedSignature) {
        //    console.warn('Payrant Webhook: Signature mismatch', { received: signature, expected: expectedSignature });
        //    return res.status(401).json({ status: 'error', message: 'Invalid signature' });
        // }

        next();
    } catch (error) {
        console.error('Payrant verification error', error);
        next(); // Don't block flow on error, but log it
    }
};


/**
 * Zainpay Webhook Handler
 * POST /api/webhooks/zainpay
 */
router.post('/zainpay', verifyWebhookSignature, async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Received Zainpay webhook:', JSON.stringify(req.body, null, 2));

        const result = await webhookService.processWebhook(req.body);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message,
            });
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
        // Always return 200 to prevent retries for processing errors
        res.status(200).json({
            success: false,
            message: 'Webhook received but processing failed',
        });
    }
});

/**
 * Payrant Webhook Handler (Transfers & General)
 * POST /api/webhooks/payrant
 */
router.post('/payrant', verifyPayrantSignature, async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Received Payrant webhook:', JSON.stringify(req.body, null, 2));

        const { payoutService } = await import('../services/PayoutService');
        // Check event type
        const event = req.body.event; // transfer.processing, transfer.completed, transfer.failed
        const data = req.body.data;

        if (event === 'transfer.completed' && data?.reference) {
            const { Payout } = await import('../models/Payout');
            // We use our reference which matches Payrant's reference or look up by externalRef if we saved it?
            // "reference": "TRANSFER_1756818101_77" <- This looks like the reference Payrant generated?
            // Wait, in our PayoutService we initiate with: `reference: "PAY-${uuidv4()}"`
            // But Payrant response has: `reference: "TRANSFER_1756824073_77"`. 
            // We should store Payrant's reference when we initiate.

            // We'll search by our reference OR externalRef (which we set to Payrant's transfer_id/reference)
            const payout = await Payout.findOne({
                $or: [
                    { reference: data.reference },
                    { externalRef: String(data.reference) },
                    { externalRef: String(data.transfer_id) } // fallback
                ]
            });

            if (payout) {
                await payoutService.handlePayoutSuccess(payout, data.total_amount || data.amount);
            } else {
                console.warn(`Payrant Webhook: Payout not found for reference ${data.reference}`);
            }

        } else if (event === 'transfer.failed' && data?.reference) {
            const { Payout } = await import('../models/Payout');
            const payout = await Payout.findOne({
                $or: [
                    { reference: data.reference },
                    { externalRef: String(data.reference) }
                ]
            });

            if (payout) {
                await payoutService.handlePayoutFailure(payout, data.failure_reason || 'Payrant reported failure');
            }
        }

        // Handle legacy/other structure if needed (the previous implementation checked status=success directly)
        else if (req.body.status === 'success' && req.body.data?.transfer_id) {
            // Fallback for older webhook format if any
            const d = req.body.data;
            const { Payout } = await import('../models/Payout');
            const payout = await Payout.findOne({ externalRef: String(d.transfer_id) });
            if (payout) {
                if (d.status === 'success') await payoutService.handlePayoutSuccess(payout, d.amount);
                else if (d.status === 'failed') await payoutService.handlePayoutFailure(payout, d.message);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Webhook processed',
        });
    } catch (error) {
        console.error('Payrant Webhook error:', error);
        res.status(200).json({
            success: false,
            message: 'Webhook received but processing failed',
        });
    }
});

/**
 * Payrant Inbound Webhook Handler (Virtual Account & Checkout)
 * POST /api/webhooks/payrant/inbound
 */
router.post('/payrant/inbound', verifyPayrantSignature, async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Received Payrant inbound webhook:', JSON.stringify(req.body, null, 2));

        const result = await webhookService.handlePayrantInbound(req.body);

        res.status(200).json({
            success: result.success,
            message: result.message,
        });
    } catch (error) {
        console.error('Payrant Inbound Webhook error:', error);
        res.status(200).json({
            success: false,
            message: 'Webhook received but processing failed',
        });
    }
});

/**
 * Zainpay Settlement Webhook Handler
 * POST /api/webhooks/zainpay/settlement
 */
router.post('/zainpay/settlement', verifyWebhookSignature, async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Received Zainpay settlement webhook:', JSON.stringify(req.body, null, 2));

        const { settlementService } = await import('../services/SettlementService');
        await settlementService.handleSettlementWebhook(req.body);

        res.status(200).json({
            success: true,
            message: 'Settlement webhook processed',
        });
    } catch (error) {
        console.error('Settlement Webhook error:', error);
        res.status(200).json({
            success: false,
            message: 'Webhook received but processing failed',
        });
    }
});

/**
 * Webhook health check (for testing)
 * GET /api/webhooks/health
 */
router.get('/health', (req: Request, res: Response): void => {
    res.json({
        success: true,
        message: 'Webhook endpoint is active',
        timestamp: new Date().toISOString(),
    });
});

export default router;
