import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';
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
        }
    }

    static async createAccount(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { bankName, accountName, accountNumber, instructions, active } = req.body;

            if (!bankName || !accountName || !accountNumber) {
                return ApiResponse.error(res, 'bankName, accountName and accountNumber are required', 400);
            }

            const acc = await FundingAccount.create({
                app_id,
                bankName,
                accountName,
                accountNumber,
                instructions,
                active: active !== false
            });

            return ApiResponse.success(res, 'Funding account created', { account: acc }, 201);
        } catch (error) {
            return ApiResponse.error(res, 'Failed to create funding account', 500);
        }
    }

    static async updateAccount(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { id } = req.params;
            const { bankName, accountName, accountNumber, instructions, active } = req.body;

            // If it's a demo account, create a new one instead of updating
            if (id.startsWith('demo-')) {
                const acc = await FundingAccount.create({
                    app_id,
                    bankName,
                    accountName,
                    accountNumber,
                    instructions,
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
}
