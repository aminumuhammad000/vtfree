"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const services_1 = require("../services");
const router = (0, express_1.Router)();
/**
 * Zainpay Webhook Handler
 * POST /api/webhooks/zainpay
 */
router.post('/zainpay', middleware_1.verifyWebhookSignature, async (req, res) => {
    try {
        console.log('Received Zainpay webhook:', JSON.stringify(req.body, null, 2));
        const result = await services_1.webhookService.processWebhook(req.body);
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.message,
            });
        }
    }
    catch (error) {
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
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Webhook endpoint is active',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=webhookRoutes.js.map