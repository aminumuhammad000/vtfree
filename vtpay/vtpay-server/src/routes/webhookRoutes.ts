import { Router, Request, Response } from 'express';
import { verifyWebhookSignature } from '../middleware';
import { webhookService } from '../services';

const router = Router();

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
 * Payrant Webhook Handler
 * POST /api/webhooks/payrant
 */
router.post('/payrant', async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Received Payrant webhook:', JSON.stringify(req.body, null, 2));

        const { payoutService } = await import('../services/PayoutService');
        const { status, data } = req.body;

        if (status === 'success' && data?.transfer_id) {
            const { Payout } = await import('../models/Payout');
            const payout = await Payout.findOne({ externalRef: data.transfer_id });
            if (payout) {
                if (data.status === 'success') {
                    await payoutService.handlePayoutSuccess(payout, data.amount);
                } else if (data.status === 'failed') {
                    await payoutService.handlePayoutFailure(payout, data.message || 'Payrant reported failure');
                }
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
