import { Response } from 'express';
import { VTStackService } from '../services/vtstack.service.js';
import { AuthRequest } from '../types/index.js';
import VirtualAccount from '../models/VirtualAccount.js';
import { User, CreatedApp } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * @desc Create a personal virtual account via VTStack
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

        const appId = user.app_id || req.body.app_id;
        if (!appId) {
            return res.status(400).json({ success: false, message: 'App ID is required' });
        }

        const app = await CreatedApp.findOne({ app_id: appId });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        // Always use VTStack
        const gateway = 'vtstack';

        const kycOptionalApps = ['dadsub', 'abbasalehsub'];
        const isKycOptional = appId && kycOptionalApps.includes(appId);

        if (!isKycOptional && user.kyc_status !== 'verified') {
            return res.status(403).json({
                success: false,
                message: 'KYC verification required. Please complete your profile verification to generate a virtual account.',
                requiresKyc: true
            });
        }

        // Check if user already has an account with VTStack
        const existingAccount = await VirtualAccount.findOne({
            user: userId,
            provider: gateway,
        });

        if (existingAccount) {
            return res.status(200).json({
                success: true,
                message: 'Virtual account already exists',
                data: existingAccount
            });
        }

        const reference = `${gateway.toUpperCase().substring(0, 3)}-${userId}-${Date.now().toString(36)}`;

        // Default to VTStack
        if (!user.first_name || !user.last_name) {
            return res.status(400).json({
                success: false,
                message: 'First name and Last name are required to generate a virtual account. Please update your profile.'
            });
        }

        const payload = {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone_number || '08000000000',
            reference,
            bvn: user.bvn || '00000000000',
        };

        // Use VTStack Service
        const apiKey = (app as any).payment_settings?.vtstack_secret_key
            || (app as any).payment_settings?.vtstack_api_key;

        const result = await VTStackService.createVirtualAccount(payload, apiKey);

        if (result && result.success && result.data) {
            // Save to database
            const newAccount = await VirtualAccount.create({
                user: userId,
                accountNumber: result.data.accountNumber,
                accountName: result.data.accountName,
                bankName: result.data.bankName || 'PalmPay',
                provider: gateway,
                reference: result.data.reference || reference,
                status: result.data.status || 'active',
                metadata: {
                    ...result.data,
                    bankType: 'palmpay'
                }
            });

            // Update user model
            await User.findByIdAndUpdate(userId, {
                $set: {
                    virtual_account: {
                        account_number: result.data.accountNumber,
                        account_name: result.data.accountName,
                        bank_name: result.data.bankName,
                        account_reference: result.data.reference || reference,
                        provider: gateway,
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

        // Handle error response from service
        res.status(400).json({
            success: false,
            message: result?.message || 'Failed to create virtual account'
        });

    } catch (error: any) {
        logger.error('Create virtual account error:', error);
        res.status(500).json({
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

        const accounts = await VirtualAccount.find({ user: userId });

        // Find app to get default gateway
        const user = await User.findById(userId);
        const app = await CreatedApp.findOne({ app_id: user?.app_id });
        let gateway = app?.payment_settings?.default_gateway || 'vtstack';
        if (gateway === 'vtstack') gateway = 'vtstack';

        res.status(200).json({
            success: true,
            data: accounts,
            gateway
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch virtual accounts',
        });
    }
};

/**
 * @desc Get account balance via configured Gateway API
 */
export const getAccountBalance = async (req: AuthRequest, res: Response) => {
    try {
        const { accountNumber } = req.params;
        const account = await VirtualAccount.findOne({ accountNumber });

        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const user = await User.findById(account.user);
        const appId = user?.app_id;
        const app = await CreatedApp.findOne({ app_id: appId });

        // Use VTStack Service
        const apiKey = (app as any)?.payment_settings?.vtstack_secret_key
            || (app as any)?.payment_settings?.vtstack_api_key;

        const result = await VTStackService.getAccountBalance(accountNumber, apiKey);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch account balance',
        });
    }
};

/**
 * @desc Get transactions for a specific account
 */
export const getTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const { accountNumber } = req.params;
        const account = await VirtualAccount.findOne({ accountNumber });

        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        // VTStack doesn't have a specific getTransactions endpoint for sub-accounts in this implementation
        return res.status(200).json({ success: true, data: [] });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch transactions',
        });
    }
};
