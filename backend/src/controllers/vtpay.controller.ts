import { Response } from 'express';
import { VTStackService } from '../services/vtstack.service.js';
import { AuthRequest } from '../types/index.js';
import VirtualAccount from '../models/VirtualAccount.js';
import { User, CreatedApp } from '../models/index.js';

/**
 * @desc Create a personal virtual account via VTStack (Legacy VTPay Controller)
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
            if ((app as any)?.payment_settings?.vtstack_secret_key || (app as any)?.payment_settings?.vtpay_secret_key) {
                appSpecificApiKey = (app as any).payment_settings?.vtstack_secret_key || (app as any).payment_settings?.vtpay_secret_key;
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

        // VTStack supports only PalmPay - ignore bankType

        // Check if user already has a VTStack account
        const existingAccount = await VirtualAccount.findOne({
            user: userId,
            provider: 'vtstack' // normalized to vtstack
        });

        if (existingAccount) {
            return res.status(200).json({
                success: true,
                message: 'Virtual account already exists',
                data: existingAccount
            });
        }

        const reference = `VTS-${userId}-${Date.now().toString(36)}`;

        if (!user.bvn) {
            return res.status(400).json({
                success: false,
                message: 'Your BVN is required to generate a virtual account. Please update your profile.'
            });
        }

        const payload = {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone_number || '08000000000',
            reference,
            bvn: user.bvn
        };

        // Pass the app-specific key if available
        const result = await VTStackService.createVirtualAccount(payload, appSpecificApiKey);

        if (result && result.success && result.data) {
            // Save to our database
            const newAccount = await VirtualAccount.create({
                user: userId,
                accountNumber: result.data.accountNumber,
                accountName: result.data.accountName,
                bankName: result.data.bankName || 'PalmPay',
                provider: 'vtstack',
                reference: result.data.reference || reference,
                status: result.data.status || 'active',
                metadata: {
                    bankType: 'palmpay'
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

        const accounts = await VirtualAccount.find({
            user: userId,
            provider: { $in: ['vtpay', 'vtstack'] }
        });
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
 * @desc Get account balance via VTStack API
 */
export const getAccountBalance = async (req: AuthRequest, res: Response) => {
    try {
        const { accountNumber } = req.params;
        const result = await VTStackService.getAccountBalance(accountNumber);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch account balance',
        });
    }
};

/**
 * @desc Get transactions for a specific account via VTStack API
 */
export const getTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const { accountNumber } = req.params;
        // Check if method exists (not implemented in V1 of VTStackService based on user prompt)
        // @ts-ignore
        if (typeof VTStackService.getTransactions === 'function') {
            // @ts-ignore
            const result = await VTStackService.getTransactions(accountNumber);
            return res.status(200).json(result);
        }
        res.status(200).json({ success: true, data: [] });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch transactions',
        });
    }
};
