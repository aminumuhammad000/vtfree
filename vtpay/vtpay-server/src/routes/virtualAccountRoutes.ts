import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { VirtualAccount, User } from '../models';
import { zainpayService } from '../services';
import { authenticate, AuthenticatedRequest } from '../middleware';
import config from '../config';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Create a virtual account for the user
 * POST /api/virtual-accounts
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { bankType = 'gtBank' } = req.body;

        // Get user details for virtual account creation
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        // Check if user already has a virtual account with this bank
        const existingAccount = await VirtualAccount.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            bankType,
            status: 'active',
        });

        if (existingAccount) {
            res.status(409).json({
                success: false,
                message: 'User already has an active virtual account with this bank',
                data: {
                    accountNumber: existingAccount.accountNumber,
                    accountName: existingAccount.accountName,
                    bankName: existingAccount.bankName,
                },
            });
            return;
        }

        // Create virtual account via Zainpay
        const zainpayResponse = await zainpayService.createVirtualAccount({
            bankType,
            firstName: user.firstName,
            surname: user.lastName,
            email: user.email,
            mobileNumber: user.phone,
            dob: req.body.dob || '01-01-1990', // Default if not provided
            gender: req.body.gender || 'M',
            address: req.body.address || 'Nigeria',
            title: req.body.title || 'Mr',
            state: req.body.state || 'Lagos',
            bvn: user.bvn || req.body.bvn || '',
            zainboxCode: config.zainpay.zainboxCode,
        });

        if (zainpayResponse.code !== '00') {
            res.status(400).json({
                success: false,
                message: zainpayResponse.description || 'Failed to create virtual account',
            });
            return;
        }

        const accountData = zainpayResponse.data!;

        // Save virtual account to database
        const virtualAccount = new VirtualAccount({
            userId: new mongoose.Types.ObjectId(userId),
            accountNumber: accountData.accountNumber,
            accountName: accountData.accountName,
            bankName: accountData.bankName,
            bankType,
            zainboxCode: config.zainpay.zainboxCode,
            email: user.email,
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
                bankName: virtualAccount.bankName,
                bankType: virtualAccount.bankType,
                status: virtualAccount.status,
            },
        });
    } catch (error) {
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
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        const accounts = await VirtualAccount.find({
            userId: new mongoose.Types.ObjectId(userId),
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: accounts.map((account) => ({
                id: account._id,
                accountNumber: account.accountNumber,
                accountName: account.accountName,
                bankName: account.bankName,
                bankType: account.bankType,
                status: account.status,
                createdAt: account.createdAt,
            })),
        });
    } catch (error) {
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
router.get('/:accountNumber/balance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { accountNumber } = req.params;

        // Verify account belongs to user
        const account = await VirtualAccount.findOne({
            userId: new mongoose.Types.ObjectId(userId),
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
        const balanceResponse = await zainpayService.getVirtualAccountBalance(accountNumber);

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
    } catch (error) {
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
router.patch('/:accountNumber/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { accountNumber } = req.params;
        const { status } = req.body; // true for active, false for inactive

        // Verify account belongs to user
        const account = await VirtualAccount.findOne({
            userId: new mongoose.Types.ObjectId(userId),
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
        const updateResponse = await zainpayService.updateVirtualAccountStatus(
            account.zainboxCode,
            accountNumber,
            status
        );

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
    } catch (error) {
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
router.get('/:accountNumber/transactions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { accountNumber } = req.params;

        // Verify account belongs to user
        const account = await VirtualAccount.findOne({
            userId: new mongoose.Types.ObjectId(userId),
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
        const transactionsResponse = await zainpayService.getVirtualAccountTransactions(accountNumber);

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
    } catch (error) {
        console.error('Get virtual account transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions',
        });
    }
});

export default router;
