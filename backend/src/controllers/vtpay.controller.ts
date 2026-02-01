import { Response } from 'express';
import { VTPayService } from '../services/vtpay.service.js';
import { AuthRequest } from '../types/index.js';
import VirtualAccount from '../models/VirtualAccount.js';
import { User, CreatedApp } from '../models/index.js';

/**
 * @desc Create a personal virtual account via VTPay
 */
export const createVirtualAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // --- Fetch App-Specific API Key ---
        let appSpecificApiKey: string | undefined;
        if (user.app_id) {
            const app = await CreatedApp.findOne({ app_id: user.app_id });
            if (app?.payment_settings?.vtpay_secret_key) {
                appSpecificApiKey = app.payment_settings.vtpay_secret_key;
                console.log(`Using App-Specific VTPay Key for App ID: ${user.app_id}`);
            }
        }
        // ----------------------------------

        if (user.kyc_status !== 'verified') {
            return res.status(403).json({
                success: false,
                message: 'KYC verification required. Please complete your profile verification to generate a virtual account.',
                requiresKyc: true
            });
        }

        const { bankType } = req.body;

        // Allowed banks according to USER request
        const allowedBanks = ['moniepoint', 'fcmb', 'fidelity'];
        if (!bankType || !allowedBanks.includes(bankType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid bank type. Supported banks are: ${allowedBanks.join(', ')}`
            });
        }

        // Check if user already has an account with this bank type
        const existingAccount = await VirtualAccount.findOne({
            user: userId,
            'metadata.bankType': bankType,
            provider: 'vtpay'
        });

        if (existingAccount) {
            return res.status(200).json({
                success: true,
                message: 'Virtual account already exists',
                data: existingAccount
            });
        }

        const reference = `VTP-${userId}-${Date.now().toString(36)}`;

        const payload = {
            bankType,
            accountName: `${user.first_name} ${user.last_name}`,
            email: user.email,
            phone: user.phone_number || '08000000000',
            reference,
            bvn: user.bvn,
            dob: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : undefined
        };

        if (!user.bvn) {
            return res.status(400).json({
                success: false,
                message: 'Your BVN is required to generate a virtual account. Please update your profile.'
            });
        }

        // Pass the app-specific key if available
        const result = await VTPayService.createVirtualAccount(payload, appSpecificApiKey);

        if (result.success && result.data) {
            // Save to our database
            const newAccount = await VirtualAccount.create({
                user: userId,
                accountNumber: result.data.accountNumber,
                accountName: result.data.accountName,
                bankName: result.data.bankName,
                provider: 'vtpay',
                reference: result.data.reference || reference,
                status: result.data.status || 'active',
                metadata: {
                    bankType: result.data.bankType
                }
            });

            // Update user model's default virtual account info for quick access
            await User.findByIdAndUpdate(userId, {
                $set: {
                    virtual_account: {
                        account_number: result.data.accountNumber,
                        account_name: result.data.accountName,
                        bank_name: result.data.bankName,
                        status: result.data.status || 'active'
                    }
                }
            });

            return res.status(201).json({
                success: true,
                message: 'Virtual account created successfully',
                data: newAccount
            });
        }

        res.status(400).json(result);
    } catch (error: any) {
        console.error('Create virtual account error:', error);

        // If it's a known validation error or configuration error
        const statusCode = (error.message.includes('required') || error.message.includes('configured')) ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to create virtual account',
        });
    }
};

/**
 * @desc Fetch user's virtual accounts from our database
 */
export const getVirtualAccounts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const accounts = await VirtualAccount.find({ user: userId, provider: 'vtpay' });
        res.status(200).json({
            success: true,
            data: accounts
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch virtual accounts',
        });
    }
};

/**
 * @desc Get account balance via VTPay API
 */
export const getAccountBalance = async (req: AuthRequest, res: Response) => {
    try {
        const { accountNumber } = req.params;
        const result = await VTPayService.getAccountBalance(accountNumber);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch account balance',
        });
    }
};

/**
 * @desc Get transactions for a specific account via VTPay API
 */
export const getTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const { accountNumber } = req.params;
        const result = await VTPayService.getTransactions(accountNumber);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch transactions',
        });
    }
};
