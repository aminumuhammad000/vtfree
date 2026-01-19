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
        // Zainpay supports specific banks for virtual accounts
        const supportedBanks = [
            { code: 'moniepoint', name: 'Moniepoint Microfinance Bank' },
            { code: 'fcmb', name: 'FCMB' },
            { code: 'sterlingBank', name: 'Sterling Bank Plc' },
            { code: 'fidelity', name: 'Fidelity Bank Plc' }
        ];
        res.json({
            success: true,
            data: supportedBanks,
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
    console.log('Incoming virtual account creation request:', req.body);
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
        if (!bvn || bvn.replace(/\D/g, '').length !== 11) {
            res.status(400).json({
                success: false,
                message: 'A valid 11-digit BVN is required',
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
        // Ensure BVN is exactly 11 digits if provided, otherwise Zainpay might reject it
        const validatedBvn = (bvn || user.bvn || '').replace(/\D/g, '');
        // Ensure DOB is in DD-MM-YYYY format
        let validatedDob = dob || '01-01-1990';
        if (validatedDob.includes('-')) {
            const parts = validatedDob.split('-');
            if (parts[0].length === 4) { // YYYY-MM-DD
                validatedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
        // Parse account name into first and last name if provided
        let payloadFirstName = firstName || user.firstName;
        let payloadSurname = lastName || user.lastName;
        if (accountName) {
            const nameParts = accountName.trim().split(' ');
            if (nameParts.length > 0) {
                payloadFirstName = nameParts[0];
                if (nameParts.length > 1) {
                    payloadSurname = nameParts.slice(1).join(' ');
                }
                else {
                    // If only one name provided, use it as surname too or keep user's surname?
                    // Better to use it as surname to avoid empty surname if required
                    payloadSurname = nameParts[0];
                }
            }
        }
        // Create virtual account via Zainpay
        // PRIORITIZE provided customer details over logged-in user details
        const payload = {
            bankType,
            firstName: payloadFirstName,
            surname: payloadSurname,
            email: email || user.email,
            mobileNumber: phone || user.phone,
            dob: validatedDob,
            gender: gender || 'M',
            address: address || 'Nigeria',
            title: req.body.title || 'Mr',
            state: state || 'Lagos',
            bvn: validatedBvn.length === 11 ? validatedBvn : '',
            zainboxCode: targetZainboxCode,
        };
        console.log('Sending payload to Zainpay:', JSON.stringify(payload, null, 2));
        const zainpayResponse = await services_1.zainpayService.createVirtualAccount(payload);
        if (zainpayResponse.code !== '00') {
            console.error('Zainpay Error Response:', zainpayResponse);
            res.status(400).json({
                success: false,
                message: zainpayResponse.description || 'Failed to create virtual account',
            });
            return;
        }
        const accountData = zainpayResponse.data;
        // Force VTPay branding
        // Use the user-provided account name (alias) if available, otherwise clean up the returned name
        let finalAccountName = `VTPay - ${accountName || firstName || user.firstName}`;
        // If the returned name from Zainpay is significantly different and we want to keep it but rebrand
        // const cleanedReturnedName = accountData.accountName.replace(/Zainpay/gi, '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
        // finalAccountName = `VTPay - ${cleanedReturnedName}`;
        // However, user specifically asked for "VTPay" in account name and "not the name i put" implies they want control
        // But also said "it show zainpay-Aminu Muhammad and is not the name i put"
        // So we should prioritize the name they put in the form (req.body.accountName)
        if (accountName) {
            finalAccountName = `VTPay - ${accountName}`;
        }
        else {
            // Fallback to cleaning the returned name if no custom name provided
            const cleanedName = accountData.accountName.replace(/Zainpay/gi, '').replace(/^[\s-]*|[\s-]*$/g, '');
            finalAccountName = `VTPay - ${cleanedName}`;
        }
        // Save virtual account to database
        const virtualAccount = new models_1.VirtualAccount({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            accountNumber: accountData.accountNumber,
            accountName: finalAccountName,
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
        const errorMessage = error.response?.data?.description ||
            error.response?.data?.message ||
            error.message ||
            'Failed to create virtual account';
        // Avoid returning 401/403 to frontend to prevent auto-logout
        // unless it's truly an auth issue with the user (which is handled by middleware)
        let status = error.response?.status || 500;
        if (status === 401 || status === 403) {
            status = 500; // Map upstream auth errors to server error
        }
        console.error('Zainpay Error Details:', JSON.stringify(error.response?.data, null, 2));
        res.status(status).json({
            success: false,
            message: errorMessage,
            details: error.response?.data
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
                const zainpayResponse = await services_1.zainpayService.getZainboxAccounts(userZainbox.zainboxCode);
                // 3. Sync with local DB
                if (zainpayResponse.code === '00' && Array.isArray(zainpayResponse.data)) {
                    for (const zAccount of zainpayResponse.data) {
                        // Do not include the Internal Settlement Account
                        if (zAccount.name === 'Internal Settlement Account') {
                            continue;
                        }
                        let account = await models_1.VirtualAccount.findOne({ accountNumber: zAccount.bankAccount });
                        if (!account) {
                            // Create new local record
                            const rawName = zAccount.name.replace(/Zainpay/gi, '').replace(/^[\s-]*|[\s-]*$/g, '');
                            const finalName = `VTPay - ${rawName}`;
                            await models_1.VirtualAccount.create({
                                userId: new mongoose_1.default.Types.ObjectId(userId),
                                accountNumber: zAccount.bankAccount,
                                accountName: finalName,
                                bankName: zAccount.bankName,
                                bankType: 'zenithBank', // Default or infer from bankName if possible
                                zainboxCode: userZainbox.zainboxCode,
                                email: req.user.email,
                                status: 'active',
                                reference: `imported_${Date.now()}_${Math.random().toString(36).substring(7)}`
                            });
                        }
                        else if (account.userId.toString() !== userId.toString()) {
                            // Update existing record with correct userId if it belongs to this user's zainbox
                            account.userId = new mongoose_1.default.Types.ObjectId(userId);
                            await account.save();
                        }
                        // Force update name for existing accounts too if they contain Zainpay
                        else if (account.accountName.includes('Zainpay')) {
                            const rawName = account.accountName.replace(/Zainpay/gi, '').replace(/^[\s-]*|[\s-]*$/g, '');
                            account.accountName = `VTPay - ${rawName}`;
                            await account.save();
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
        const query = {};
        if (req.user.role !== 'admin') {
            // Get user's Zainboxes to include accounts by zainboxCode as well
            const userZainboxes = await models_1.Zainbox.find({ userId });
            const zainboxCodes = userZainboxes.map(z => z.zainboxCode).filter(Boolean);
            query.$or = [
                { userId: new mongoose_1.default.Types.ObjectId(userId) },
                { zainboxCode: { $in: zainboxCodes } }
            ];
        }
        const accounts = await models_1.VirtualAccount.find({
            ...query,
            accountName: { $ne: 'Internal Settlement Account' }
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
        // Verify account belongs to user (or user is admin)
        const query = { accountNumber };
        if (req.user.role !== 'admin') {
            query.userId = new mongoose_1.default.Types.ObjectId(userId);
        }
        const account = await models_1.VirtualAccount.findOne(query);
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
            data: {
                ...balanceResponse.data,
                balanceAmount: (balanceResponse.data?.balanceAmount || 0) / 100
            },
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
        // Verify account belongs to user (or user is admin)
        const query = { accountNumber };
        if (req.user.role !== 'admin') {
            query.userId = new mongoose_1.default.Types.ObjectId(userId);
        }
        const account = await models_1.VirtualAccount.findOne(query);
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
        // Verify account belongs to user (or user is admin)
        const query = { accountNumber };
        if (req.user.role !== 'admin') {
            query.userId = new mongoose_1.default.Types.ObjectId(userId);
        }
        const account = await models_1.VirtualAccount.findOne(query);
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
        const transactions = (transactionsResponse.data || []).map((txn) => ({
            ...txn,
            amount: (txn.amount || 0) / 100
        }));
        res.json({
            success: true,
            data: transactions,
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
    res.status(403).json({
        success: false,
        message: 'Virtual account deletion is not allowed',
    });
});
exports.default = router;
//# sourceMappingURL=virtualAccountRoutes.js.map