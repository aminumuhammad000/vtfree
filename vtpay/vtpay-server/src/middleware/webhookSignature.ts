import { Request, Response, NextFunction } from 'express';
import { webhookService } from '../services';

/**
 * Middleware to verify Zainpay webhook signature
 */
export const verifyWebhookSignature = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const signature = req.headers['zainpay-signature'] as string;

        if (!signature) {
            console.warn('Webhook received without signature');
            res.status(401).json({
                success: false,
                message: 'No signature provided',
            });
            return;
        }

        // Get raw body as string for signature verification
        // Use rawBody if available (captured by express.json verify callback), otherwise fallback to JSON.stringify
        const payload = req.rawBody || JSON.stringify(req.body);

        const isValid = webhookService.verifySignature(payload, signature);

        if (!isValid) {
            console.warn('Invalid webhook signature');
            res.status(401).json({
                success: false,
                message: 'Invalid signature',
            });
            return;
        }

        console.log('Webhook signature verified successfully');
        next();
    } catch (error) {
        console.error('Webhook signature verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Signature verification error',
        });
    }
};

export default verifyWebhookSignature;
