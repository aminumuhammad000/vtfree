"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const PayoutService_1 = require("../services/PayoutService");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(middleware_1.authenticate);
/**
 * Initiate Payout
 * POST /api/payout
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, // in kobo
        bankCode, accountNumber, accountName, saveAccount } = req.body;
        if (!amount || !bankCode || !accountNumber || !accountName) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
            return;
        }
        // 1. Initiate Payout via Service (handles locking funds)
        const payout = await PayoutService_1.payoutService.initiatePayout(userId, amount, {
            bankCode,
            accountNumber,
            accountName
        });
        // 2. Optionally save bank details for future use
        if (saveAccount) {
            await models_1.User.findByIdAndUpdate(userId, {
                savedBankDetails: {
                    bankCode,
                    accountNumber,
                    accountName,
                    bankName: req.body.bankName || 'Unknown Bank'
                }
            });
        }
        res.json({
            success: true,
            message: 'Payout initiated successfully and is being processed.',
            data: payout
        });
    }
    catch (error) {
        logger_1.logger.error('Payout initiation error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to initiate payout',
        });
    }
});
/**
 * Calculate Payout Fees
 * POST /api/payout/calculate-fees
 */
router.post('/calculate-fees', async (req, res) => {
    try {
        const { amount, accountNumber } = req.body;
        if (!amount) {
            res.status(400).json({
                success: false,
                message: 'Amount is required',
            });
            return;
        }
        const isInternal = await models_1.VirtualAccount.exists({ accountNumber });
        const fees = PayoutService_1.payoutService.calculateFees(amount, !!isInternal);
        res.json({
            success: true,
            data: {
                ...fees,
                isInternal: !!isInternal
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Calculate fees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate fees',
        });
    }
});
/**
 * Get Payout History
 * GET /api/payout/history
 */
router.get('/history', async (req, res) => {
    try {
        const userId = req.user.id;
        const payouts = await models_1.Payout.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({
            success: true,
            data: payouts
        });
    }
    catch (error) {
        logger_1.logger.error('Get payout history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payout history',
        });
    }
});
/**
 * Get Saved Bank Details
 * GET /api/payout/saved-account
 */
router.get('/saved-account', async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await models_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        res.json({
            success: true,
            data: user.savedBankDetails || null,
        });
    }
    catch (error) {
        logger_1.logger.error('Get saved account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get saved account',
        });
    }
});
/**
 * Save Bank Details
 * POST /api/payout/saved-account
 */
router.post('/saved-account', async (req, res) => {
    try {
        const userId = req.user.id;
        const { bankCode, bankName, accountNumber, accountName } = req.body;
        if (!bankCode || !bankName || !accountNumber || !accountName) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
            return;
        }
        const user = await models_1.User.findByIdAndUpdate(userId, {
            savedBankDetails: {
                bankCode,
                bankName,
                accountNumber,
                accountName,
            },
        }, { new: true });
        res.json({
            success: true,
            message: 'Bank details saved successfully',
            data: user?.savedBankDetails,
        });
    }
    catch (error) {
        logger_1.logger.error('Save bank details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save bank details',
        });
    }
});
exports.default = router;
//# sourceMappingURL=payoutRoutes.js.map