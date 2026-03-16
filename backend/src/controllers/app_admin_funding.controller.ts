import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';
import { logger } from '../config/bootstrap.js';
import FundingAccount from '../models/funding_account.model.js';
import VirtualAccount from '../models/VirtualAccount.js';

export class AppAdminFundingController {
    static async listAccounts(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;

            // Find the App and its Owner
            const CreatedApp = (await import('../models/created_app.model.js')).default;
            const app = await CreatedApp.findOne({ app_id });

            if (!app) return ApiResponse.error(res, 'App not found', 404);

            const VTfreeUser = (await import('../models/vtfree_user.model.js')).default;
            const owner = await VTfreeUser.findById(app.owner_id);

            if (!owner) return ApiResponse.error(res, 'Owner not found', 404);

            // Fetch manual accounts
            const manualAccounts = await FundingAccount.find({ app_id }).sort({ createdAt: -1 });

            // Fetch virtual accounts - filter by generatedBy
            const virtualAccounts = await VirtualAccount.find({
                user: owner._id,
                generatedBy: req.user?.id
            }).sort({ createdAt: -1 });

            logger.info(`[listAccounts] App: ${app_id}, Admin: ${req.user?.id}, Owner: ${owner._id}, Found ${manualAccounts.length} manual and ${virtualAccounts.length} virtual accounts`);

            // Merge and normalize
            const normalizedVirtual = virtualAccounts.map(va => ({
                _id: va._id,
                bankName: va.bankName,
                accountName: va.accountName,
                accountNumber: va.accountNumber,
                provider: va.provider,
                type: 'virtual',
                active: va.status === 'active',
                isVirtual: true,
                created_at: va.createdAt
            }));

            const normalizedManual = manualAccounts.map(ma => ({
                ...ma.toObject(),
                isVirtual: false
            }));

            const allAccounts = [...normalizedVirtual, ...normalizedManual].sort((a: any, b: any) =>
                new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime()
            );

            logger.info(`[listAccounts] Returning ${allAccounts.length} total accounts`);

            return ApiResponse.success(res, 'Funding accounts retrieved', {
                accounts: allAccounts,
                total: allAccounts.length
            });
        } catch (error) {
            logger.error('Error listing funding accounts:', error);
            return ApiResponse.error(res, 'Failed to list funding accounts', 500);
        }
    }

    static async createAccount(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { bankName, accountName, accountNumber, instructions, provider, type, active } = req.body;

            if (!bankName || !accountName || !accountNumber) {
                return ApiResponse.error(res, 'bankName, accountName and accountNumber are required', 400);
            }

            const account = await FundingAccount.create({
                app_id,
                bankName,
                accountName,
                accountNumber,
                instructions,
                provider: provider || 'manual',
                type: type || 'manual',
                active: active !== false
            });

            return ApiResponse.success(res, 'Funding account created', { account }, 201);
        } catch (error) {
            return ApiResponse.error(res, 'Failed to create funding account', 500);
        }
    }

    static async updateAccount(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { id } = req.params;
            const { bankName, accountName, accountNumber, instructions, provider, type, active, isDemo } = req.body;

            // If it's a demo account or explicitly marked as demo being converted
            if (isDemo || id.startsWith('demo-')) {
                const acc = await FundingAccount.create({
                    app_id,
                    bankName,
                    accountName,
                    accountNumber,
                    instructions,
                    provider: provider || 'manual',
                    type: type || 'manual',
                    active: active !== false
                });
                return ApiResponse.success(res, 'Funding account created from demo', { account: acc }, 201);
            }

            const acc = await FundingAccount.findOne({ _id: id, app_id });

            if (!acc) return ApiResponse.error(res, 'Account not found', 404);

            if (bankName !== undefined) acc.bankName = bankName;
            if (accountName !== undefined) acc.accountName = accountName;
            if (accountNumber !== undefined) acc.accountNumber = accountNumber;
            if (instructions !== undefined) acc.instructions = instructions;
            if (provider !== undefined) acc.provider = provider;
            if (type !== undefined) acc.type = type;
            if (active !== undefined) acc.active = !!active;

            await acc.save();
            return ApiResponse.success(res, 'Funding account updated', { account: acc });
        } catch (error) {
            return ApiResponse.error(res, 'Failed to update funding account', 500);
        }
    }

    static async deleteAccount(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { id } = req.params;
            const acc = await FundingAccount.findOneAndDelete({ _id: id, app_id });

            if (!acc) return ApiResponse.error(res, 'Account not found', 404);
            return ApiResponse.success(res, 'Funding account deleted', { account: acc });
        } catch (error) {
            return ApiResponse.error(res, 'Failed to delete funding account', 500);
        }
    }

    /**
     * Generate a virtual account for the App Admin (VTfreeUser) to fund their wallet
     */
    static async generateVirtualAccount(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const admin_id = req.user?.id;
            const { provider: requestedProvider, bank: requestedBank } = req.body;

            // Find the App and its Owner
            const CreatedApp = (await import('../models/created_app.model.js')).default;
            const app = await CreatedApp.findOne({ app_id });

            if (!app) {
                return ApiResponse.error(res, 'App not found', 404);
            }

            // Find the current App Admin (to get their profile details)
            const AppAdmin = (await import('../models/app_admin.model.js')).default;
            const admin = await AppAdmin.findById(admin_id);

            const VTfreeUser = (await import('../models/vtfree_user.model.js')).default;
            const owner = await VTfreeUser.findById(app.owner_id);

            if (!owner) {
                logger.error(`App owner (VTfreeUser) not found for app_id: ${app_id}, owner_id: ${app.owner_id}`);
                return ApiResponse.error(res, 'App owner not found. Please contact support.', 404);
            }

            // Use Admin details if available, otherwise fallback to Owner details
            const firstName = admin?.first_name || owner.first_name || 'Admin';
            const lastName = admin?.last_name || owner.last_name || '';
            const email = admin?.email || owner.email;
            const phone = owner.phone_number || '08000000000';
            const bvn = owner.bvn; // Get BVN from owner (required for VTStack)

            if (!bvn) {
                return ApiResponse.error(res, 'App owner BVN is required to generate a virtual account', 400);
            }

            // Restrict to VTStack
            const provider = 'vtstack';

            // Check if account already exists for this admin and provider
            const existingAccounts = await VirtualAccount.find({
                user: owner._id,
                provider,
                generatedBy: admin_id
            });

            if (existingAccounts.length >= 3) {
                // Relaxed check or keep as is? 
                // If VTStack only supports 1 account type, multiple accounts might be redundant unless for different references.
                // We'll keep the limit check.
                return ApiResponse.error(res, 'Maximum of 3 virtual accounts allowed for VTStack per admin', 400);
            }

            // Also check if this specific bank already exists for this user/provider
            // With new VTStack, it's always "active" (PalmPay). 
            // We can check if ANY VTStack account exists if we want to enforce 1 account total, 
            // but the code allows 3. We'll skip specific bank check since bankType requested might not matter.

            // Default to PalmPay for VTStack
            const bankType = 'palmpay';

            let account;

            // Generate new account
            logger.info(`Generating virtual account for ${email} (${app_id}) using VTStack (Bank: ${bankType})`);

            try {
                const { VTStackService } = await import('../services/vtstack.service.js');
                const result = await VTStackService.createVirtualAccount({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    phone: phone,
                    bvn: bvn,
                    identityType: 'INDIVIDUAL',
                    reference: `REF-${app_id}-${Date.now()}`
                }, app.payment_settings?.vtstack_secret_key || app.payment_settings?.vtstack_api_key);

                if (result && result.success && result.data) {
                    // Clean account name if necessary
                    const cleanedAccountName = result.data.accountName.trim();

                    // Save to VirtualAccount model
                    account = await VirtualAccount.create({
                        user: owner._id,
                        generatedBy: admin_id,
                        accountNumber: result.data.accountNumber,
                        accountName: cleanedAccountName,
                        bankName: result.data.bankName || 'Virtual Bank',
                        provider: 'vtstack',
                        reference: result.data.reference,
                        status: 'active',
                        metadata: {
                            ...result.data,
                            bankType: bankType
                        }
                    });
                } else {
                    throw new Error(result?.message || 'Failed to create virtual account');
                }

                return ApiResponse.success(res, 'Virtual account generated successfully', { account });
            } catch (err: any) {
                logger.error(`Failed to generate virtual account:`, err);

                if (err.message?.includes('already exists')) {
                    // Try to sync and find the existing account
                    try {
                        const { VTStackService } = await import('../services/vtstack.service.js');
                        const vtstackResult = await VTStackService.getVirtualAccounts(app.payment_settings?.vtstack_api_key || app.payment_settings?.vtstack_secret_key);
                        const vtstackAccounts = Array.isArray(vtstackResult.data) ? vtstackResult.data : (vtstackResult.data?.accounts || vtstackResult.accounts || []);

                        if (vtstackAccounts.length > 0) {
                            for (const va of vtstackAccounts) {
                                const exists = await VirtualAccount.findOne({ accountNumber: va.accountNumber });
                                if (!exists) {
                                    await VirtualAccount.create({
                                        user: owner._id,
                                        generatedBy: admin_id,
                                        accountNumber: va.accountNumber,
                                        accountName: va.accountName.trim(),
                                        bankName: va.bankName || 'Virtual Bank',
                                        provider: 'vtstack',
                                        reference: va.reference || `SYNC-${Date.now()}`,
                                        status: 'active',
                                        metadata: va
                                    });
                                }
                            }
                            const account = await VirtualAccount.findOne({ user: owner._id, provider: 'vtstack' });
                            if (account) {
                                return ApiResponse.success(res, 'Virtual account already exists and has been synced', { account });
                            }
                        }
                    } catch (syncErr) {
                        logger.error('Failed to sync after "already exists" error:', syncErr);
                    }
                }

                const status = err.message?.includes('disabled') || err.message?.includes('already exists') ? 400 : 500;
                return ApiResponse.error(res, err.message || 'Failed to generate virtual account', status);
            }

        } catch (error: any) {
            logger.error('Error generating virtual account:', error);
            return ApiResponse.error(res, error.message || 'Internal server error', 500);
        }
    }

    /**
     * Get the App Admin's Owner (Wallet) Balance and associated virtual accounts
     */
    static async getOwnerBalance(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;

            const CreatedApp = (await import('../models/created_app.model.js')).default;
            const app = await CreatedApp.findOne({ app_id });

            if (!app) {
                return ApiResponse.error(res, 'App not found', 404);
            }

            const VTfreeUser = (await import('../models/vtfree_user.model.js')).default;
            const owner = await VTfreeUser.findById(app.owner_id);

            if (!owner) {
                return ApiResponse.error(res, 'App owner not found', 404);
            }

            // Get Virtual Account details - filter by generatedBy
            let accounts = await VirtualAccount.find({
                user: owner._id,
                provider: 'vtstack',
                generatedBy: req.user?.id
            });

            // Sync with VTStack to ensure we have the latest
            try {
                const { VTStackService } = await import('../services/vtstack.service.js');
                const vtstackResult = await VTStackService.getVirtualAccounts(app.payment_settings?.vtstack_api_key || app.payment_settings?.vtstack_secret_key);
                const vtstackAccounts = Array.isArray(vtstackResult.data) ? vtstackResult.data : (vtstackResult.data?.accounts || vtstackResult.accounts || []);

                if (vtstackAccounts.length > 0) {
                    // Check against ALL accounts for this owner to avoid duplicates
                    const allOwnerAccounts = await VirtualAccount.find({ user: owner._id });

                    let synced = false;
                    for (const va of vtstackAccounts) {
                        const exists = allOwnerAccounts.find(a => a.accountNumber === va.accountNumber);
                        if (!exists) {
                            await VirtualAccount.create({
                                user: owner._id,
                                generatedBy: req.user?.id,
                                accountNumber: va.accountNumber,
                                accountName: va.accountName.trim(),
                                bankName: va.bankName || 'Virtual Bank',
                                provider: 'vtstack',
                                reference: va.reference || `SYNC-${Date.now()}`,
                                status: 'active',
                                metadata: va
                            });
                            synced = true;
                        }
                    }
                    if (synced) {
                        accounts = await VirtualAccount.find({ user: owner._id, provider: 'vtstack', generatedBy: req.user?.id });
                    }
                }
            } catch (syncErr) {
                logger.error('Failed to sync VTStack accounts in getOwnerBalance:', syncErr);
            }

            // Get total count for the current admin to enforce limit correctly in UI
            const totalOwnerAccounts = await VirtualAccount.countDocuments({
                user: owner._id,
                provider: 'vtstack',
                generatedBy: req.user?.id
            });

            return ApiResponse.success(res, 'Owner balance and accounts retrieved', {
                balance: owner.wallet_balance || 0,
                accounts,
                totalOwnerAccounts: totalOwnerAccounts || 0
            });
        } catch (error: any) {
            logger.error('Error fetching owner balance:', error);
            return ApiResponse.error(res, error.message || 'Internal server error', 500);
        }
    }

    /**
     * Get list of virtual accounts from VTStack
     */
    static async getVTStackAccounts(req: AuthRequest, res: Response) {
        try {
            const { VTStackService } = await import('../services/vtstack.service.js');
            const CreatedApp = (await import('../models/created_app.model.js')).default;
            const app = await CreatedApp.findOne({ app_id: req.user?.app_id });
            const result = await VTStackService.getVirtualAccounts(app?.payment_settings?.vtstack_secret_key || app?.payment_settings?.vtstack_api_key);

            const accounts = Array.isArray(result.data) ? result.data : (result.data?.accounts || result.accounts || []);

            return ApiResponse.success(res, 'VTStack accounts retrieved successfully', { accounts });
        } catch (error: any) {
            logger.error('Error getting VTStack accounts:', error);
            return ApiResponse.error(res, error.message, 500);
        }
    }

    /**
     * Get balances from all providers
     */
    static async getProviderBalances(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;

            // Find the App and its Owner
            const CreatedApp = (await import('../models/created_app.model.js')).default;
            const app = await CreatedApp.findOne({ app_id });

            if (!app) return ApiResponse.error(res, 'App not found', 404);

            const VTfreeUser = (await import('../models/vtfree_user.model.js')).default;
            const owner = await VTfreeUser.findById(app.owner_id);

            if (!owner) return ApiResponse.error(res, 'Owner not found', 404);

            const { VTStackService } = await import('../services/vtstack.service.js');
            const smeplugService = (await import('../services/smeplug.service.js')).default;

            // Check if VTStack API key is configured for this app
            const vtstackApiKey = app.payment_settings?.vtstack_secret_key || app.payment_settings?.vtstack_api_key;
            const hasVtstackKey = vtstackApiKey && vtstackApiKey.trim().length > 0;

            // Fetch external balances with error tracking
            const [smeplugRes, vtstackRes] = await Promise.all([
                smeplugService.getWalletBalance().catch(() => ({ balance: null, error: true })),
                hasVtstackKey
                    ? VTStackService.getPlatformBalance(vtstackApiKey).catch((err) => {
                        logger.error('VTStack Balance Fetch Error:', err?.message);
                        return { data: { balance: null }, error: true, message: err?.message };
                    })
                    : Promise.resolve({ data: { balance: null }, error: true })
            ]);

            const ownerBalance = owner.wallet_balance || 0;
            const smeplugBalance = smeplugRes?.balance;
            // VTStack returns balance in kobo, convert to Naira by dividing by 100
            const vtstackBalanceKobo = vtstackRes?.data?.balance ?? vtstackRes?.balance;
            const vtstackBalance = vtstackBalanceKobo ? Number(vtstackBalanceKobo) / 100 : 0;

            const providers = [
                {
                    code: 'vtstack',
                    name: 'VTStack',
                    balance: ownerBalance,
                    currency: 'NGN',
                    status: 'ok'
                },
                {
                    code: 'smeplug',
                    name: 'SMEPlug',
                    balance: smeplugBalance ?? 0,
                    currency: 'NGN',
                    status: (smeplugRes as any).error ? 'error' : 'ok'
                }
            ];

            return ApiResponse.success(res, 'Provider balances retrieved', {
                providers,
                total: ownerBalance + (Number(smeplugBalance) || 0),
                vtstackBalance: vtstackBalance ?? 0
            });
        } catch (error: any) {
            logger.error('Error getting provider balances:', error);
            return ApiResponse.error(res, error.message, 500);
        }
    }

    /**
     * Get general funding info (balance + accounts)
     */
    static async getFundingInfo(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const CreatedApp = (await import('../models/created_app.model.js')).default;
            const app = await CreatedApp.findOne({ app_id });

            if (!app) return ApiResponse.error(res, 'App not found', 404);

            const VTfreeUser = (await import('../models/vtfree_user.model.js')).default;
            const owner = await VTfreeUser.findById(app.owner_id);

            if (!owner) return ApiResponse.error(res, 'Owner not found', 404);

            const accounts = await VirtualAccount.find({
                user: owner._id,
                provider: 'vtstack',
                generatedBy: req.user?.id
            });

            return ApiResponse.success(res, 'Funding info retrieved', {
                balance: owner.wallet_balance || 0,
                accounts: accounts || []
            });
        } catch (error: any) {
            logger.error('Error getting funding info:', error);
            return ApiResponse.error(res, error.message, 500);
        }
    }
}
