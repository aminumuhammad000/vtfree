"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = void 0;
const services_1 = require("../services");
/**
 * Middleware to verify Zainpay webhook signature
 */
const verifyWebhookSignature = (req, res, next) => {
    try {
        const signature = req.headers['zainpay-signature'];
        if (!signature) {
            console.warn('Webhook received without signature');
            res.status(401).json({
                success: false,
                message: 'No signature provided',
            });
            return;
        }
        // Get raw body as string for signature verification
        const payload = JSON.stringify(req.body);
        const isValid = services_1.webhookService.verifySignature(payload, signature);
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
    }
    catch (error) {
        console.error('Webhook signature verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Signature verification error',
        });
    }
};
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.default = exports.verifyWebhookSignature;
//# sourceMappingURL=webhookSignature.js.map