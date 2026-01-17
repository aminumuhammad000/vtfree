"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const services_1 = require("../services");
const router = (0, express_1.Router)();
/**
 * Get list of banks
 * GET /api/banks
 */
router.get('/', async (req, res) => {
    try {
        console.log('GET /api/banks - Fetching bank list from Zainpay...');
        const response = await services_1.zainpayService.getBankList();
        if (response.code !== '00') {
            console.error('Zainpay Error in getBankList:', response);
            res.status(400).json({
                success: false,
                message: response.description || 'Failed to get bank list',
            });
            return;
        }
        console.log(`Successfully fetched ${response.data?.length || 0} banks`);
        res.json({
            success: true,
            data: response.data,
        });
    }
    catch (error) {
        console.error('Get bank list error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get bank list',
            error: error.message
        });
    }
});
/**
 * Validate bank account (Name Enquiry)
 * GET /api/banks/verify
 */
router.get('/verify', async (req, res) => {
    try {
        const { bankCode, accountNumber } = req.query;
        if (!bankCode || !accountNumber) {
            res.status(400).json({
                success: false,
                message: 'bankCode and accountNumber are required',
            });
            return;
        }
        const response = await services_1.zainpayService.nameEnquiry(bankCode, accountNumber);
        if (response.code !== '00') {
            res.status(400).json({
                success: false,
                message: response.description || 'Failed to verify account',
            });
            return;
        }
        res.json({
            success: true,
            data: response.data,
        });
    }
    catch (error) {
        console.error('Name enquiry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify account',
        });
    }
});
exports.default = router;
//# sourceMappingURL=bankRoutes.js.map