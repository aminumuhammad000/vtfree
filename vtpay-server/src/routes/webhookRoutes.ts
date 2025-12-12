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
