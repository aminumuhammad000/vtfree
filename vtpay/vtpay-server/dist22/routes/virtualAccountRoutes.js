"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const services_1 = require("../services");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(middleware_1.authenticate);
/**
 * Get list of supported banks for virtual account creation
 * GET /api/virtual-accounts/supported-banks
 */
router.get('/supported-banks', async (req, res) => {
    try {
        const banksResponse = await services_1.zainpayService.getBankList();
        if (banksResponse.code !== '00') {
            res.status(400).json({
                success: false,
                message: banksResponse.description || 'Failed to fetch supported banks',
            });
            return;
        }
        res.json({
            success: true,
            data: banksResponse.data || [],
        });
    }
    catch (error) {
        console.error('Get supported banks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supported banks',
        });
    }
});
/**
 * Create a virtual account for the user
 * POST /api/virtual-accounts
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { bankType, accountName, reference, 
        // Customer details (optional, for B2B2C)
        firstName, lastName, email, phone, dob, gender, address, state, bvn, zainboxCode // Now required or inferred
         } = req.body;
        if (!bankType) {
            res.status(400).json({
                success: false,
                message: 'bankType is required',
            });
            return;
        }
        // Get user details for virtual account creation
        const user = await models_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        // Check KYC Level
        if (user.kycLevel < 3) {
            res.status(403).json({
                success: false,
                message: 'Account verification required. Please complete KYC to create virtual accounts.',
            });
            return;
        }
        // Determine Zainbox to use
        let targetZainboxCode = zainboxCode;
        if (!targetZainboxCode) {
            // Try to find a Zainbox for the user
            const userZainbox = await models_1.Zainbox.findOne({ userId });
            if (userZainbox) {
                targetZainboxCode = userZainbox.zainboxCode;
            }
            else {
                res.status(400).json({
                    success: false,
                    message: 'No Zainbox found for user. Please create a Zainbox first or provide zainboxCode.',
                });
                return;
            }
        }
        else {
            // Verify ownership
            const ownedZainbox = await models_1.Zainbox.findOne({ userId, zainboxCode: targetZainboxCode });
            if (!ownedZainbox) {
                res.status(403).json({
                    success: false,
                    message: 'Invalid Zainbox code or you do not own this Zainbox.',
                });
                return;
            }
        }
        // Allow multiple accounts, so we removed the existingAccount check
        // Create virtual account via Zainpay
        // Use provided customer details OR fallback to logged-in user details
        const zainpayResponse = await services_1.zainpayService.createVirtualAccount({
            bankType,
            firstName: firstName || user.firstName,
            surname: lastName || user.lastName,
            email: email || user.email,
            mobileNumber: phone || user.phone,
            dob: dob || '01-01-1990', // Default if not provided
            gender: gender || 'M',
            address: address || 'Nigeria',
            title: req.body.title || 'Mr',
            state: state || 'Lagos',
            bvn: bvn || user.bvn || '',
            zainboxCode: targetZainboxCode,
        });
        if (zainpayResponse.code !== '00') {
            res.status(400).json({
                success: false,
                message: zainpayResponse.description || 'Failed to create virtual account',
            });
            return;
        }
        const accountData = zainpayResponse.data;
        // Save virtual account to database
        const virtualAccount = new models_1.VirtualAccount({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            accountNumber: accountData.accountNumber,
            accountName: accountData.accountName,
            bankName: accountData.bankName,
            bankType,
            zainboxCode: targetZainboxCode,
            email: email || user.email, // Use customer email if provided
            alias: accountName, // Save the custom name
            reference, // Save the reference ID
            status: 'active',
        });
        await virtualAccount.save();
        res.status(201).json({
            success: true,
            message: 'Virtual account created successfully',
            data: {
                id: virtualAccount._id,
                accountNumber: virtualAccount.accountNumber,
                accountName: virtualAccount.accountName,
                alias: virtualAccount.alias, // Return the custom name
                reference: virtualAccount.reference,
                bankName: virtualAccount.bankName,
                bankType: virtualAccount.bankType,
                status: virtualAccount.status,
            },
        });
    }
    catch (error) {
        console.error('Create virtual account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create virtual account',
        });
    }
});
/**
 * Get all virtual accounts for the user
 * GET /api/virtual-accounts
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        // 1. Get User's Zainbox
        const userZainbox = await models_1.Zainbox.findOne({ userId });
        if (userZainbox) {
            try {
                // 2. Fetch accounts from Zainpay
                const zainpayAccounts = await services_1.zainpayService.getZainboxAccounts(userZainbox.zainboxCode);
                // 3. Sync with local DB
                if (Array.isArray(zainpayAccounts)) {
                    for (const zAccount of zainpayAccounts) {
                        const exists = await models_1.VirtualAccount.findOne({ accountNumber: zAccount.bankAccount });
                        if (!exists) {
                            // Create new local record
                            await models_1.VirtualAccount.create({
                                userId: new mongoose_1.default.Types.ObjectId(userId),
                                accountNumber: zAccount.bankAccount,
                                accountName: zAccount.name,
                                bankName: zAccount.bankName,
                                bankType: 'gtBank', // Default or infer from bankName if possible
                                zainboxCode: userZainbox.zainboxCode,
                                email: req.user.email,
                                status: 'active',
                                reference: `imported_${Date.now()}_${Math.random().toString(36).substring(7)}`
                            });
                        }
                    }
                }
            }
            catch (syncError) {
                console.error('Error syncing with Zainpay:', syncError);
                // Continue to return local accounts even if sync fails
            }
        }
        // 4. Return all accounts from DB
        const accounts = await models_1.VirtualAccount.find({
            userId: new mongoose_1.default.Types.ObjectId(userId),
        }).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: accounts.map((account) => ({
                id: account._id,
                accountNumber: account.accountNumber,
                accountName: account.accountName,
                alias: account.alias,
                reference: account.reference,
                bankName: account.bankName,
                bankType: account.bankType,
                status: account.status,
                createdAt: account.createdAt,
            })),
        });
    }
    catch (error) {
        console.error('Get virtual accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get virtual accounts',
        });
    }
});
/**
 * Get virtual account balance
 * GET /api/virtual-accounts/:accountNumber/balance
 */
router.get('/:accountNumber/balance', async (req, res) => {
    try {
        const userId = req.user.id;
        const { accountNumber } = req.params;
        // Verify account belongs to user
        const account = await models_1.VirtualAccount.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            accountNumber,
        });
        if (!account) {
            res.status(404).json({
                success: false,
                message: 'Virtual account not found',
            });
            return;
        }
        // Get balance from Zainpay
        const balanceResponse = await services_1.zainpayService.getVirtualAccountBalance(accountNumber);
        if (balanceResponse.code !== '00') {
            res.status(400).json({
                success: false,
                message: balanceResponse.description || 'Failed to get balance',
            });
            return;
        }
        res.json({
            success: true,
            data: balanceResponse.data,
        });
    }
    catch (error) {
        console.error('Get virtual account balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get balance',
        });
    }
});
/**
 * Update virtual account status
 * PATCH /api/virtual-accounts/:accountNumber/status
 */
router.patch('/:accountNumber/status', async (req, res) => {
    try {
        const userId = req.user.id;
        const { accountNumber } = req.params;
        const { status } = req.body; // true for active, false for inactive
        // Verify account belongs to user
        const account = await models_1.VirtualAccount.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            accountNumber,
        });
        if (!account) {
            res.status(404).json({
                success: false,
                message: 'Virtual account not found',
            });
            return;
        }
        // Update status via Zainpay
        const updateResponse = await services_1.zainpayService.updateVirtualAccountStatus(account.zainboxCode, accountNumber, status);
        if (updateResponse.code !== '00') {
            res.status(400).json({
                success: false,
                message: updateResponse.description || 'Failed to update status',
            });
            return;
        }
        // Update local database
        account.status = status ? 'active' : 'inactive';
        await account.save();
        res.json({
            success: true,
            message: `Virtual account ${status ? 'activated' : 'deactivated'} successfully`,
            data: {
                accountNumber: account.accountNumber,
                status: account.status,
            },
        });
    }
    catch (error) {
        console.error('Update virtual account status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
        });
    }
});
/**
 * Get virtual account transactions
 * GET /api/virtual-accounts/:accountNumber/transactions
 */
router.get('/:accountNumber/transactions', async (req, res) => {
    try {
        const userId = req.user.id;
        const { accountNumber } = req.params;
        // Verify account belongs to user
        const account = await models_1.VirtualAccount.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            accountNumber,
        });
        if (!account) {
            res.status(404).json({
                success: false,
                message: 'Virtual account not found',
            });
            return;
        }
        // Get transactions from Zainpay
        const transactionsResponse = await services_1.zainpayService.getVirtualAccountTransactions(accountNumber);
        if (transactionsResponse.code !== '00') {
            res.status(400).json({
                success: false,
                message: transactionsResponse.description || 'Failed to get transactions',
            });
            return;
        }
        res.json({
            success: true,
            data: transactionsResponse.data,
        });
    }
    catch (error) {
        console.error('Get virtual account transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions',
        });
    }
});
/**
 * Delete virtual account (Local only)
 * DELETE /api/virtual-accounts/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Verify account belongs to user
        const account = await models_1.VirtualAccount.findOne({
            _id: id,
            userId: new mongoose_1.default.Types.ObjectId(userId),
        });
        if (!account) {
            res.status(404).json({
                success: false,
                message: 'Virtual account not found',
            });
            return;
        }
        // Delete from local database
        await models_1.VirtualAccount.deleteOne({ _id: id });
        res.json({
            success: true,
            message: 'Virtual account deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete virtual account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete virtual account',
        });
    }
});
exports.default = router;
//# sourceMappingURL=virtualAccountRoutes.js.map