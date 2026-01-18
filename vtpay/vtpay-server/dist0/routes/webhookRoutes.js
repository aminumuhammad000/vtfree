"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
 * Payrant Webhook Handler
 * POST /api/webhooks/payrant
 */
router.post('/payrant', async (req, res) => {
    try {
        console.log('Received Payrant webhook:', JSON.stringify(req.body, null, 2));
        const { payoutService } = await Promise.resolve().then(() => __importStar(require('../services/PayoutService')));
        const { status, data } = req.body;
        if (status === 'success' && data?.transfer_id) {
            const { Payout } = await Promise.resolve().then(() => __importStar(require('../models/Payout')));
            const payout = await Payout.findOne({ externalRef: data.transfer_id });
            if (payout) {
                if (data.status === 'success') {
                    await payoutService.handlePayoutSuccess(payout, data.amount);
                }
                else if (data.status === 'failed') {
                    await payoutService.handlePayoutFailure(payout, data.message || 'Payrant reported failure');
                }
            }
        }
        res.status(200).json({
            success: true,
            message: 'Webhook processed',
        });
    }
    catch (error) {
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
router.post('/zainpay/settlement', middleware_1.verifyWebhookSignature, async (req, res) => {
    try {
        console.log('Received Zainpay settlement webhook:', JSON.stringify(req.body, null, 2));
        const { settlementService } = await Promise.resolve().then(() => __importStar(require('../services/SettlementService')));
        await settlementService.handleSettlementWebhook(req.body);
        res.status(200).json({
            success: true,
            message: 'Settlement webhook processed',
        });
    }
    catch (error) {
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
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Webhook endpoint is active',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=webhookRoutes.js.map