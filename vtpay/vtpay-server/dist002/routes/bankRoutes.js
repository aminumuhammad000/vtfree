"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PayrantService_1 = require("../services/PayrantService");
const router = (0, express_1.Router)();
/**
 * Get list of banks
 * GET /api/banks
 */
router.get('/', async (req, res) => {
    try {
        console.log('GET /api/banks - Fetching bank list from Payrant...');
        const banks = await PayrantService_1.payrantService.getBanksList();
        console.log(`Successfully fetched ${banks.length} banks`);
        // Transform to frontend expectation if needed, or send as is
        // Payrant returns { bankCode, bankName, bankUrl, bgUrl }
        // Frontend likely expects { code, name } or uses bankCode/bankName mapping
        // Let's map it to be safe for existing frontend if it used { code, name }
        // But checking Frontend code (Step 263), it uses:
        // banks.find(b => b.code === transferData.bankCode)
        // So it expects `code` and `name`.
        const mappedBanks = banks.map(b => ({
            code: b.bankCode,
            name: b.bankName,
            bankUrl: b.bankUrl,
            bgUrl: b.bgUrl
        }));
        res.json({
            success: true,
            data: mappedBanks,
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
        console.log(`Verifying account ${accountNumber} at bank ${bankCode}...`);
        const result = await PayrantService_1.payrantService.validateAccount(bankCode, accountNumber);
        res.json({
            success: true,
            data: {
                accountName: result.account_name,
                accountNumber: result.account_number,
                bankCode: result.bank_code,
                verified: result.verified
            },
        });
    }
    catch (error) {
        console.error('Name enquiry error:', error.message);
        const message = error.response?.data?.message || error.message || 'Failed to verify account';
        res.status(400).json({
            success: false,
            message: message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=bankRoutes.js.map