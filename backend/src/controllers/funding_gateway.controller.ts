import { Response } from 'express';
import { VTPayService } from '../services/vtpay.service.js';
import { PayrantService } from '../services/payrant.service.js';
import { AuthRequest } from '../types/index.js';
import VirtualAccount from '../models/VirtualAccount.js';
import { User, CreatedApp } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * @desc Create a personal virtual account via the configured gateway (Payrant or VTPay)
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

        const gateway = app.payment_settings?.default_gateway || 'vtpay';

        if (user.kyc_status !== 'verified') {
            return res.status(403).json({
                success: false,
                message: 'KYC verification required. Please complete your profile verification to generate a virtual account.',
                requiresKyc: true
            });
        }

        const { bankType } = req.body;

        // Check if user already has an account with this gateway
        const existingAccount = await VirtualAccount.findOne({
            user: userId,
            provider: gateway,
            ...(gateway === 'vtpay' ? { 'metadata.bankType': bankType } : {})
        });

        if (existingAccount) {
            return res.status(200).json({
                success: true,
                message: 'Virtual account already exists',
                data: existingAccount
            });
        }

        const reference = `${gateway.toUpperCase().substring(0, 3)}-${userId}-${Date.now().toString(36)}`;

        let result;
        if (gateway === 'payrant') {
            const nin = user.nin || user.bvn;
            if (!nin) {
                return res.status(400).json({
                    success: false,
                    message: 'Your NIN or BVN is required to generate a Payrant virtual account. Please update your profile.'
                });
            }

            const payload = {
                documentType: 'nin' as const,
                documentNumber: nin,
                virtualAccountName: `${user.first_name}_${user.last_name}`,
                customerName: `${user.first_name} ${user.last_name}`,
                email: user.email,
                accountReference: reference
            };

            result = await PayrantService.createVirtualAccount(payload, app.payment_settings?.payrant_api_key);
        } else {
            // Default to VTPay
            const allowedBanks = ['moniepoint', 'fcmb', 'fidelity'];
            const selectedBank = (bankType && allowedBanks.includes(bankType)) ? bankType : 'moniepoint';

            if (!user.bvn) {
                return res.status(400).json({
                    success: false,
                    message: 'Your BVN is required to generate a virtual account. Please update your profile.'
                });
            }

            const payload = {
                bankType: selectedBank,
                accountName: `${user.first_name} ${user.last_name}`,
                email: user.email,
                phone: user.phone_number || '08000000000',
                reference,
                bvn: user.bvn,
                dob: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : undefined
            };

            result = await VTPayService.createVirtualAccount(payload, app.payment_settings?.vtpay_secret_key || app.payment_settings?.vtpay_api_key);
        }

        if (result && result.success && result.data) {
            // Save to database
            const newAccount = await VirtualAccount.create({
                user: userId,
                accountNumber: result.data.accountNumber,
                accountName: result.data.accountName,
                bankName: result.data.bankName,
                provider: gateway,
                reference: result.data.reference || reference,
                status: result.data.status || 'active',
                metadata: {
                    ...result.data,
                    // Keep bankType for compatibility if it was VTPay
                    bankType: gateway === 'vtpay' ? result.data.bankType : undefined
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

        res.status(400).json(result || { success: false, message: 'Failed to create virtual account' });
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
        const gateway = app?.payment_settings?.default_gateway || 'vtpay';

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

        let result;
        if (account.provider === 'payrant') {
            // Payrant doesn't seem to have a balance endpoint for specific accounts in the provided docs, 
            // but we might need to check if there is one. 
            // For now, return a generic message or try a default.
            return res.status(200).json({ success: true, balance: 0, currency: 'NGN' });
        } else {
            result = await VTPayService.getAccountBalance(accountNumber, app?.payment_settings?.vtpay_secret_key || app?.payment_settings?.vtpay_api_key);
        }

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

        const user = await User.findById(account.user);
        const appId = user?.app_id;
        const app = await CreatedApp.findOne({ app_id: appId });

        let result;
        if (account.provider === 'payrant') {
            // Payrant docs only mentioned checkout transactions verify. 
            // We might have to store our own transaction history or check if there's an API.
            return res.status(200).json({ success: true, data: [] });
        } else {
            result = await VTPayService.getTransactions(accountNumber, app?.payment_settings?.vtpay_secret_key || app?.payment_settings?.vtpay_api_key);
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch transactions',
        });
    }
};
