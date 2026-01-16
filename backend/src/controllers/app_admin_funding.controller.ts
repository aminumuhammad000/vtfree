import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';
<<<<<<< HEAD
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
=======
import ProviderConfig from '../models/provider.model.js';
import FundingAccount from '../models/funding_account.model.js';
import { providerRegistry } from '../services/providerRegistry.service.js';
import { config } from '../config/bootstrap.js';
import logger from '../utils/logger.js';

export class AppAdminFundingController {
    /**
     * Get balances for all providers configured by this app admin
     */
    static async getProviderBalances(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const providers = await ProviderConfig.find({ app_id }).sort({ priority: 1, name: 1 });
            const results: any[] = [];

            for (const p of providers) {
                let balance: number | null = null;
                let currency: string | null = null;
                let status: 'ok' | 'unsupported' | 'error' = 'unsupported';

                try {
                    const client: any = providerRegistry.getClient(p.code);
                    if (client && typeof client.getWalletBalance === 'function') {
                        // Some clients might need the provider config to get API keys
                        const resp = await client.getWalletBalance(p);
                        if (resp && typeof resp === 'object') {
                            balance = typeof resp.balance === 'number' ? resp.balance :
                                (typeof resp.available_balance === 'number' ? resp.available_balance : null);

                            if (balance === null && resp.data && typeof resp.data === 'object') {
                                balance = typeof resp.data.balance === 'number' ? resp.data.balance :
                                    (typeof resp.data.available_balance === 'number' ? resp.data.available_balance : null);
                                currency = (resp.data.currency as string) || null;
                            } else {
                                currency = (resp.currency as string) || null;
                            }
                        }
                        status = 'ok';
                    }
                } catch (e) {
                    status = 'error';
                }

                // Mask balance for ibdata if requested, but app admin should probably see it?
                // The user previously asked to mask it in Providers.tsx, so I'll keep it consistent.
                const displayBalance = p.code.toLowerCase() === 'ibdata' ? '***.**' : balance;

                results.push({
                    code: p.code,
                    name: p.name,
                    balance: displayBalance,
                    currency: currency || 'NGN',
                    status
                });
            }

            const numericBalances = results.map(r => (typeof r.balance === 'number' ? r.balance : 0));
            const total = numericBalances.reduce((a, b) => a + b, 0);

            return ApiResponse.success(res, 'Provider balances', { providers: results, total });
        } catch (error) {
            logger.error('Error getting app admin provider balances:', error);
            return ApiResponse.error(res, 'Failed to fetch balances', 500);
        }
    }

    /**
     * Get funding info and accounts for this app
     */
    static async getFundingInfo(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            // Get app-specific accounts
            let accounts = await FundingAccount.find({ app_id }).sort({ createdAt: -1 });

            // If no accounts exist, return demo ones as requested
            if (accounts.length === 0) {
                accounts = [
                    {
                        _id: 'demo-1',
                        bankName: 'Wema Bank (Demo)',
                        accountName: 'IBData Virtual Account',
                        accountNumber: '0123456789',
                        instructions: 'Fund this account to top up your IBData wallet.',
                        active: true,
                        isDemo: true
                    } as any,
                    {
                        _id: 'demo-2',
                        bankName: 'Moniepoint (Demo)',
                        accountName: 'SMEPlug Virtual Account',
                        accountNumber: '9876543210',
                        instructions: 'Fund this account to top up your SMEPlug wallet.',
                        active: true,
                        isDemo: true
                    } as any,
                    {
                        _id: 'demo-3',
                        bankName: 'Sterling Bank (Demo)',
                        accountName: 'Topupmate Virtual Account',
                        accountNumber: '5556667778',
                        instructions: 'Fund this account to top up your Topupmate wallet.',
                        active: true,
                        isDemo: true
                    } as any
                ];
            }

            return ApiResponse.success(res, 'Funding info', {
                funding: config.fundingAccount, // Global instructions
                accounts
            });
        } catch (error) {
            logger.error('Error getting funding info:', error);
            return ApiResponse.error(res, 'Failed to fetch funding info', 500);
        }
    }

    static async listAccounts(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const accounts = await FundingAccount.find({ app_id }).sort({ createdAt: -1 });
            return ApiResponse.success(res, 'Funding accounts', { accounts, total: accounts.length });
        } catch (error) {
            return ApiResponse.error(res, 'Failed to fetch funding accounts', 500);
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
        }
    }

    static async createAccount(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
<<<<<<< HEAD
            const { bankName, accountName, accountNumber, instructions, provider, type, active } = req.body;

            const account = await FundingAccount.create({
=======
            const { bankName, accountName, accountNumber, instructions, active } = req.body;

            if (!bankName || !accountName || !accountNumber) {
                return ApiResponse.error(res, 'bankName, accountName and accountNumber are required', 400);
            }

            const acc = await FundingAccount.create({
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
                app_id,
                bankName,
                accountName,
                accountNumber,
                instructions,
<<<<<<< HEAD
                provider: provider || 'manual',
                type: type || 'manual',
                active: active !== false
            });

            return ApiResponse.success(res, 'Funding account created', { account }, 201);
=======
                active: active !== false
            });

            return ApiResponse.success(res, 'Funding account created', { account: acc }, 201);
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
        } catch (error) {
            return ApiResponse.error(res, 'Failed to create funding account', 500);
        }
    }

    static async updateAccount(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { id } = req.params;
<<<<<<< HEAD
            const { bankName, accountName, accountNumber, instructions, provider, type, active, isDemo } = req.body;

            // If it's a demo account being converted
            if (isDemo) {
=======
            const { bankName, accountName, accountNumber, instructions, active } = req.body;

            // If it's a demo account, create a new one instead of updating
            if (id.startsWith('demo-')) {
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
                const acc = await FundingAccount.create({
                    app_id,
                    bankName,
                    accountName,
                    accountNumber,
                    instructions,
<<<<<<< HEAD
                    provider: provider || 'manual',
                    type: type || 'manual',
=======
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
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
<<<<<<< HEAD
            if (provider !== undefined) acc.provider = provider;
            if (type !== undefined) acc.type = type;
=======
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
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
<<<<<<< HEAD

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

            // Restrict to IBData as per user requirement
            const provider = 'ibdata';

            // Check if account already exists for this admin and provider
            // For ibdata, we allow up to 3 accounts per admin
            const existingAccounts = await VirtualAccount.find({
                user: owner._id,
                provider,
                generatedBy: admin_id
            });

            if (existingAccounts.length >= 3) {
                return ApiResponse.error(res, 'Maximum of 3 virtual accounts allowed for IBData per admin', 400);
            }

            // Also check if this specific bank already exists for this user/provider
            if (requestedBank && existingAccounts.find(a => (a.metadata as any)?.bankType === requestedBank)) {
                return ApiResponse.error(res, `A virtual account for ${requestedBank} already exists`, 400);
            }

            // Map requested bank to Zainpay supported bank types
            const bankMapping: Record<string, string> = {
                'palmpay': 'moniepoint',
                'wema': 'moniepoint',
                'fidelity': 'fidelity',
                'sterling': 'sterling',
                'moniepoint': 'moniepoint',
                'gtbank': 'gtBank',
                'fcmb': 'fcmb'
            };

            const bankType = bankMapping[requestedBank?.toLowerCase()] || 'fidelity';

            let account;

            // Generate new account
            logger.info(`Generating virtual account for ${email} (${app_id}) using ${provider} (Bank: ${bankType})`);

            try {
                const { VTPayService } = await import('../services/vtpay.service.js');
                const result = await VTPayService.createVirtualAccount({
                    bankType: bankType,
                    accountName: `${firstName} ${lastName}`.trim(),
                    email: email,
                    reference: `REF-${app_id}-${Date.now()}`,
                    phone: phone
                }, app.payment_settings?.vtpay_api_key);

                if (result && result.success && result.data) {
                    // Clean account name: remove "Zainpay" prefix if present
                    const cleanedAccountName = result.data.accountName.replace(/Zainpay/gi, '').trim();

                    // Save to VirtualAccount model
                    account = await VirtualAccount.create({
                        user: owner._id,
                        generatedBy: admin_id,
                        accountNumber: result.data.accountNumber,
                        accountName: cleanedAccountName,
                        bankName: result.data.bankName || 'Virtual Bank',
                        provider: provider,
                        reference: result.data.reference,
                        status: 'active',
                        metadata: {
                            ...result.data,
                            bankType: bankType
                        }
                    });
                } else {
                    throw new Error(result?.message || 'Failed to create IBData virtual account');
                }

                return ApiResponse.success(res, 'Virtual account generated successfully', { account });
            } catch (err: any) {
                logger.error(`Failed to generate virtual account (${provider}):`, err);

                if (err.message?.includes('already exists')) {
                    // Try to sync and find the existing account
                    try {
                        const { VTPayService } = await import('../services/vtpay.service.js');
                        const vtpayResult = await VTPayService.getVirtualAccounts(app.payment_settings?.vtpay_api_key);
                        const vtpayAccounts = Array.isArray(vtpayResult.data) ? vtpayResult.data : (vtpayResult.data?.accounts || vtpayResult.accounts || []);

                        if (vtpayAccounts.length > 0) {
                            for (const va of vtpayAccounts) {
                                const exists = await VirtualAccount.findOne({ accountNumber: va.accountNumber });
                                if (!exists) {
                                    await VirtualAccount.create({
                                        user: owner._id,
                                        generatedBy: admin_id,
                                        accountNumber: va.accountNumber,
                                        accountName: va.accountName,
                                        bankName: va.bankName || 'Virtual Bank',
                                        provider: provider,
                                        reference: va.reference || `SYNC-${Date.now()}`,
                                        status: 'active',
                                        metadata: va
                                    });
                                }
                            }
                            const account = await VirtualAccount.findOne({ user: owner._id, provider, 'metadata.bankType': bankType });
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
     * Get the App Admin's IBData (Wallet) Balance
     */
    static async getIBDataBalance(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;

            const CreatedApp = (await import('../models/created_app.model.js')).default;
            const app = await CreatedApp.findOne({ app_id });

            if (!app) {
                return ApiResponse.error(res, 'App not found', 404);
            }

            const VTfreeUser = (await import('../models/vtfree_user.model.js')).default;
            const user = await VTfreeUser.findById(app.owner_id);
            const owner = await VTfreeUser.findById(app.owner_id);

            if (!owner) {
                return ApiResponse.error(res, 'App owner not found', 404);
            }

            // Get Virtual Account details - filter by generatedBy
            let accounts = await VirtualAccount.find({
                user: owner._id,
                provider: 'ibdata',
                generatedBy: req.user?.id
            });

            // Sync with VTPay to ensure we have the latest
            try {
                const { VTPayService } = await import('../services/vtpay.service.js');
                const vtpayResult = await VTPayService.getVirtualAccounts(app.payment_settings?.vtpay_api_key);
                const vtpayAccounts = Array.isArray(vtpayResult.data) ? vtpayResult.data : (vtpayResult.data?.accounts || vtpayResult.accounts || []);

                if (vtpayAccounts.length > 0) {
                    // Check against ALL accounts for this owner to avoid duplicates
                    const allOwnerAccounts = await VirtualAccount.find({ user: owner._id });

                    let synced = false;
                    for (const va of vtpayAccounts) {
                        const exists = allOwnerAccounts.find(a => a.accountNumber === va.accountNumber);
                        if (!exists) {
                            await VirtualAccount.create({
                                user: user._id,
                                generatedBy: req.user?.id,
                                accountNumber: va.accountNumber,
                                accountName: va.accountName.replace(/Zainpay/gi, '').trim(),
                                bankName: va.bankName || 'Virtual Bank',
                                provider: 'ibdata',
                                reference: va.reference || `SYNC-${Date.now()}`,
                                status: 'active',
                                metadata: va
                            });
                            synced = true;
                        }
                    }
                    if (synced) {
                        accounts = await VirtualAccount.find({ user: user._id, provider: 'ibdata' });
                    }
                }
            } catch (syncErr) {
                logger.error('Failed to sync VTPay accounts in getIBDataBalance:', syncErr);
            }

            // Get total count for the current admin to enforce limit correctly in UI
            const totalOwnerAccounts = await VirtualAccount.countDocuments({
                user: owner._id,
                provider: 'ibdata',
                generatedBy: req.user?.id
            });

            return ApiResponse.success(res, 'IBData balance retrieved', {
                balance: owner.wallet_balance || 0,
                accounts,
                totalOwnerAccounts: totalOwnerAccounts || 0
            });
        } catch (error: any) {
            logger.error('Error fetching IBData balance:', error);
            return ApiResponse.error(res, error.message || 'Internal server error', 500);
        }
    }

    /**
     * Get list of virtual accounts from VTPay
     */
    static async getVTPayAccounts(req: AuthRequest, res: Response) {
        try {
            const { VTPayService } = await import('../services/vtpay.service.js');
            const CreatedApp = (await import('../models/created_app.model.js')).default;
            const app = await CreatedApp.findOne({ app_id: req.user?.app_id });
            const result = await VTPayService.getVirtualAccounts(app?.payment_settings?.vtpay_api_key);

            const accounts = Array.isArray(result.data) ? result.data : (result.data?.accounts || result.accounts || []);

            return ApiResponse.success(res, 'VTPay accounts retrieved successfully', { accounts });
        } catch (error: any) {
            logger.error('Error getting VTPay accounts:', error);
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

            const { VTPayService } = await import('../services/vtpay.service.js');
            const smeplugService = (await import('../services/smeplug.service.js')).default;
            const topupmateService = (await import('../services/topupmate.service.js')).default;

            // Check if VTPay API key is configured for this app
            const vtpayApiKey = app.payment_settings?.vtpay_api_key;
            const hasVtpayKey = vtpayApiKey && vtpayApiKey.trim().length > 0;

            // Fetch external balances with error tracking
            const [smeplugRes, topupmateRes, vtpayRes] = await Promise.all([
                smeplugService.getWalletBalance().catch(() => ({ balance: null, error: true })),
                topupmateService.getWalletBalance().catch(() => ({ balance: null, error: true })),
                hasVtpayKey
                    ? VTPayService.getPlatformBalance(vtpayApiKey).catch(() => ({ data: { balance: null }, error: true }))
                    : Promise.resolve({ data: { balance: null }, error: true })
            ]);

            const ibdataBalance = owner.wallet_balance || 0;
            const smeplugBalance = smeplugRes?.balance;
            const topupmateBalance = topupmateRes?.balance;
            const vtpayBalance = vtpayRes?.data?.balance ?? vtpayRes?.balance;

            const providers = [
                {
                    code: 'ibdata',
                    name: 'IBData',
                    balance: ibdataBalance,
                    currency: 'NGN',
                    status: 'ok'
                },
                {
                    code: 'smeplug',
                    name: 'SMEPlug',
                    balance: smeplugBalance ?? 0,
                    currency: 'NGN',
                    status: (smeplugRes as any).error ? 'error' : 'ok'
                },
                {
                    code: 'topupmate',
                    name: 'Topupmate',
                    balance: topupmateBalance ?? 0,
                    currency: 'NGN',
                    status: (topupmateRes as any).error ? 'error' : 'ok'
                },
                {
                    code: 'vtpay',
                    name: 'VTPay',
                    balance: vtpayBalance ?? 0,
                    currency: 'NGN',
                    status: (vtpayRes as any).error ? 'error' : 'ok'
                }
            ];

            return ApiResponse.success(res, 'Provider balances retrieved', {
                providers,
                total: ibdataBalance + (Number(smeplugBalance) || 0) + (Number(topupmateBalance) || 0) + (Number(vtpayBalance) || 0),
                vtpayBalance: vtpayBalance ?? 0
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
                provider: 'ibdata',
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
=======
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
}
