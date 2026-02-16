import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ProviderConfig from '../models/provider.model.js';
import providerRegistry from '../services/providerRegistry.service.js';
import logger from '../utils/logger.js';
import { ApiResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export class AppAdminProviderController {
    static async list(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { active } = req.query;

            const filter: any = { app_id };
            if (active !== undefined) filter.active = String(active) === 'true';

            let providers = await ProviderConfig.find(filter).sort({ priority: 1, name: 1 });

            // Ensure IBData exists and is first
            let ibdataProvider = providers.find(p => p.code === 'ibdata');

            if (!ibdataProvider) {
                // Auto-create IBData provider if it doesn't exist
                ibdataProvider = await ProviderConfig.create({
                    app_id,
                    name: 'IBData (Default)',
                    code: 'ibdata',
                    active: true,
                    priority: 0,
                    supported_services: ['airtime', 'data'],
                    metadata: {
                        is_default: true,
                        auto_configured: true,
                        description: 'Pre-configured provider. No API key needed - funded via VTFree wallet.'
                    }
                });
                logger.info(`Auto-created IBData provider for app: ${app_id}`);

                // Refresh the list
                providers = await ProviderConfig.find(filter).sort({ priority: 1, name: 1 });
            }

            const sanitized = providers.map((p: any) => {
                const obj = p.toObject();
                if (obj.metadata && obj.metadata.env) {
                    obj.metadata = { ...obj.metadata };
                    delete obj.metadata.env;
                }
                // Add flag to indicate if it's the default provider
                obj.is_default = obj.code === 'ibdata';
                obj.requires_api_key = obj.code !== 'ibdata';
                return obj;
            });

            return ApiResponse.success(res, 'Providers retrieved', { providers: sanitized, total: providers.length });
        } catch (error) {
            logger.error('Error listing providers:', error);
            return ApiResponse.error(res, 'Failed to list providers', 500);
        }
    }

    static async getById(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const provider = await ProviderConfig.findOne({ _id: req.params.id, app_id });
            if (!provider) return ApiResponse.error(res, 'Provider not found', 404);
            return ApiResponse.success(res, 'Provider retrieved', { provider });
        } catch (error) {
            logger.error('Error getting provider:', error);
            return ApiResponse.error(res, 'Failed to get provider', 500);
        }
    }

    static async create(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { name, code, base_url, api_key, secret_key, username, password, active, priority, supported_services, metadata } = req.body;

            if (!name || !code) return ApiResponse.error(res, 'name and code are required', 400);

            const exists = await ProviderConfig.findOne({ app_id, code: String(code).toLowerCase() });
            if (exists) return ApiResponse.error(res, 'Provider code already exists for this app', 400);

            const created = await ProviderConfig.create({
                app_id,
                name,
                code: String(code).toLowerCase(),
                base_url,
                api_key,
                secret_key,
                username,
                password,
                active: active !== false,
                priority: priority ?? 1,
                supported_services: Array.isArray(supported_services) ? supported_services : [],
                metadata,
            });

            logger.info(`Provider created for app ${app_id}: ${created.code}`);
            return ApiResponse.success(res, 'Provider created', { provider: created }, 201);
        } catch (error) {
            logger.error('Error creating provider:', error);
            return ApiResponse.error(res, 'Failed to create provider', 500);
        }
    }

    static async update(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { id } = req.params;
            const provider = await ProviderConfig.findOne({ _id: id, app_id });
            if (!provider) return ApiResponse.error(res, 'Provider not found', 404);

            const { name, code, base_url, api_key, secret_key, username, password, active, priority, supported_services, metadata } = req.body;
            if (name !== undefined) provider.name = name;
            if (code !== undefined) provider.code = String(code).toLowerCase();
            if (base_url !== undefined) provider.base_url = base_url;
            if (api_key !== undefined) provider.api_key = api_key;
            if (secret_key !== undefined) provider.secret_key = secret_key;
            if (username !== undefined) provider.username = username;
            if (password !== undefined) provider.password = password;
            if (active !== undefined) provider.active = Boolean(active);
            if (priority !== undefined) provider.priority = Number(priority);
            if (supported_services !== undefined) provider.supported_services = Array.isArray(supported_services) ? supported_services : [];
            if (metadata !== undefined) provider.metadata = metadata;

            await provider.save();
            logger.info(`Provider updated for app ${app_id}: ${id}`);
            return ApiResponse.success(res, 'Provider updated', { provider });
        } catch (error) {
            logger.error('Error updating provider:', error);
            return ApiResponse.error(res, 'Failed to update provider', 500);
        }
    }

    static async remove(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { id } = req.params;

            const provider = await ProviderConfig.findOne({ _id: id, app_id });
            if (!provider) return ApiResponse.error(res, 'Provider not found', 404);

            // Prevent deletion of default IBData provider
            if (provider.code === 'ibdata' && provider.metadata?.is_default) {
                return ApiResponse.error(res, 'Cannot delete the default IBData provider. You can disable it instead.', 403);
            }

            const removed = await ProviderConfig.findOneAndDelete({ _id: id, app_id });
            logger.info(`Provider deleted for app ${app_id}: ${id}`);
            return ApiResponse.success(res, 'Provider deleted', { provider: removed });
        } catch (error) {
            logger.error('Error deleting provider:', error);
            return ApiResponse.error(res, 'Failed to delete provider', 500);
        }
    }

    static async testConnection(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { code } = req.params;
            const provider = await ProviderConfig.findOne({ app_id, code: code.toLowerCase() });

            if (!provider) return ApiResponse.error(res, 'Provider not found', 404);

            const client = providerRegistry.getClient(code.toLowerCase());
            if (!client) return ApiResponse.error(res, 'Provider client not available', 404);

            const results: any = { code, name: provider.name };

            if (client.getWalletBalance) {
                try {
                    if (code.toLowerCase() === 'ibdata') {
                        // For IBData, show the App Owner's wallet balance
                        const CreatedApp = (await import('../models/created_app.model.js')).default;
                        const app = await CreatedApp.findOne({ app_id });
                        if (app) {
                            const VTfreeUser = (await import('../models/vtfree_user.model.js')).default;
                            const user = await VTfreeUser.findById(app.owner_id);
                            results.balance = user ? user.wallet_balance : 0;
                        } else {
                            results.balance = 0;
                        }
                    } else {
                        const balance = await (client as any).getWalletBalance(provider);
                        results.balance = balance;
                    }
                    results.balanceStatus = 'success';
                } catch (error: any) {
                    results.balanceStatus = 'failed';
                    results.balanceError = error.response?.data?.message || error.message;
                }
            }

            if (client.getNetworks) {
                try {
                    const networks = await (client as any).getNetworks(provider);
                    results.networks = networks;
                    results.networksStatus = 'success';
                } catch (error: any) {
                    results.networksStatus = 'failed';
                    results.networksError = error.response?.data?.message || error.message;
                }
            }

            return ApiResponse.success(res, 'Connection test completed', { test: results });
        } catch (error: any) {
            logger.error('Error testing provider connection:', error);
            return ApiResponse.error(res, error.message || 'Failed to test provider connection', 500);
        }
    }

    static async testPurchase(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { code } = req.params;
            const { type, phone, network, plan, amount } = req.body;

            const provider = await ProviderConfig.findOne({ app_id, code: code.toLowerCase() });
            if (!provider) return ApiResponse.error(res, 'Provider not found', 404);

            const client = providerRegistry.getClient(code.toLowerCase());
            if (!client) return ApiResponse.error(res, 'Provider client not available', 404);

            let result;
            const ref = `TEST-${Date.now()}`;
            if (type === 'airtime') {
                if (!client.purchaseAirtime) return ApiResponse.error(res, 'Airtime purchase not supported by this provider', 400);
                result = await (client as any).purchaseAirtime({
                    phone,
                    network,
                    amount: String(amount),
                    ref,
                    airtime_type: 'VTU',
                    ported_number: true
                }, provider);
            } else if (type === 'data') {
                if (!client.purchaseData) return ApiResponse.error(res, 'Data purchase not supported by this provider', 400);
                result = await (client as any).purchaseData({
                    phone,
                    network,
                    plan,
                    amount: String(amount),
                    ref,
                    ported_number: true
                }, provider);
            } else {
                return ApiResponse.error(res, 'Invalid purchase type', 400);
            }

            return ApiResponse.success(res, 'Test purchase completed', { result });
        } catch (error: any) {
            logger.error('Error in test purchase:', error);
            return ApiResponse.error(res, error.response?.data?.message || error.message || 'Test purchase failed', 500);
        }
    }

    static async getProviderData(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { code } = req.params;
            const { type } = req.query;

            const provider = await ProviderConfig.findOne({ app_id, code: code.toLowerCase() });
            if (!provider) return ApiResponse.error(res, 'Provider not found', 404);

            const client = providerRegistry.getClient(code.toLowerCase());
            if (!client) return ApiResponse.error(res, 'Provider client not available', 404);

            let data: any = null;
            switch (type) {
                case 'balance':
                    if (code.toLowerCase() === 'ibdata') {
                        // For IBData, show the App Owner's wallet balance
                        const CreatedApp = (await import('../models/created_app.model.js')).default;
                        const app = await CreatedApp.findOne({ app_id });
                        if (app) {
                            const VTfreeUser = (await import('../models/vtfree_user.model.js')).default;
                            const user = await VTfreeUser.findById(app.owner_id);
                            data = { balance: user ? user.wallet_balance : 0, currency: 'NGN' };
                        } else {
                            data = { balance: 0, currency: 'NGN' };
                        }
                    } else {
                        data = await client.getWalletBalance?.();
                    }
                    break;
                case 'networks':
                    data = await client.getNetworks?.();
                    break;
                case 'plans':
                    if (code.toLowerCase() === 'ibdata') {
                        // Fetch plans defined by Super Admin (where app_id is null)
                        const AirtimePlan = (await import('../models/airtime_plan.model.js')).default;
                        const superAdminPlans = await AirtimePlan.find({
                            app_id: null, // Global plans
                            active: true
                        }).sort({ providerId: 1, price: 1 });

                        // Transform to standard format expected by frontend
                        data = superAdminPlans.map((plan: any) => ({
                            plan_id: plan.externalPlanId || plan.code?.replace('IBDATA_', ''),
                            network: plan.providerId,
                            plan_name: plan.name,
                            amount: plan.price, // Cost price for App Admin
                            validity: plan.meta?.validity || '30 Days',
                            plan_type: plan.type,
                            data_value: plan.meta?.data_value || plan.name
                        }));
                    } else {
                        data = await client.getDataPlans?.();
                    }
                    break;
                default:
                    return ApiResponse.error(res, 'Invalid type', 400);
            }

            return ApiResponse.success(res, `${type} retrieved`, { data });
        } catch (error: any) {
            logger.error(`Error getting provider data:`, error);
            return ApiResponse.error(res, error.message || 'Failed to get provider data', 500);
        }
    }
    static async getEnv(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { id } = req.params;
            const provider = await ProviderConfig.findOne({ _id: id, app_id });
            if (!provider) return ApiResponse.error(res, 'Provider not found', 404);

            const env = provider.metadata?.env || {};
            return ApiResponse.success(res, 'Provider env retrieved', { env });
        } catch (error) {
            logger.error('Error getting provider env:', error);
            return ApiResponse.error(res, 'Failed to get provider env', 500);
        }
    }

    static async updateEnv(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { id } = req.params;
            const { env } = req.body;

            const provider = await ProviderConfig.findOne({ _id: id, app_id });
            if (!provider) return ApiResponse.error(res, 'Provider not found', 404);

            if (!provider.metadata) provider.metadata = {};
            provider.metadata.env = env;
            provider.markModified('metadata');

            await provider.save();
            return ApiResponse.success(res, 'Provider env updated', { env: provider.metadata.env });
        } catch (error) {
            logger.error('Error updating provider env:', error);
            return ApiResponse.error(res, 'Failed to update provider env', 500);
        }
    }
    static async syncProviderData(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { code } = req.params;

            if (code.toLowerCase() !== 'ibdata') {
                return ApiResponse.error(res, 'Sync only supported for IBData currently', 400);
            }

            const AirtimePlan = (await import('../models/airtime_plan.model.js')).default;

            // Fetch global plans (defined by Super Admin)
            // We want plans that are global (app_id is null)
            const globalPlans = await AirtimePlan.find({
                app_id: null,
                active: true
            });

            if (globalPlans.length === 0) {
                return ApiResponse.success(res, 'No global plans found to sync', { count: 0 });
            }

            let syncedCount = 0;

            for (const globalPlan of globalPlans) {
                // Check if plan already exists for this app
                // We match by unique identifier. externalPlanId is the best bet, or code.
                const matchQuery: any = {
                    app_id,
                    providerId: globalPlan.providerId
                };

                if (globalPlan.externalPlanId) {
                    matchQuery.externalPlanId = globalPlan.externalPlanId;
                } else {
                    // Fallback to code if externalPlanId is missing (unlikely for proper plans)
                    matchQuery.code = globalPlan.code;
                }

                const existingPlan = await AirtimePlan.findOne(matchQuery);

                if (existingPlan) {
                    // OPTIONAL: Update details but PRESERVE PRICE if user changed it?
                    // The user request says "make it saved".
                    // If we overwrite, we lose custom pricing.
                    // Usually "Sync" implies "Update descriptions/meta", but maybe not price.
                    // For now, let's skip if exists, or maybe update only non-critical fields?
                    // Let's safe-guard: only create if not exists.
                    // Or maybe update "cost price" in meta if we track that.
                    // But for this task "save in database", creation is the key.

                    // If we strictly follow "Sync", we might want to ensure the plan exists.
                    // Let's just continue.
                    continue;
                }

                // Create new plan for app
                await AirtimePlan.create({
                    app_id,
                    providerId: globalPlan.providerId,
                    providerName: globalPlan.providerName,
                    externalPlanId: globalPlan.externalPlanId,
                    code: globalPlan.code,
                    name: globalPlan.name,
                    // Use the global price as the base/cost price.
                    // The App Admin will sell at this price or higher.
                    price: globalPlan.price,
                    type: globalPlan.type,
                    discount: 0,
                    source_provider: 'ibdata',
                    active: true,
                    meta: {
                        ...(globalPlan.meta || {}),
                        original_global_id: globalPlan._id,
                        cost_price: globalPlan.price // Track cost price for profit calc
                    }
                });
                syncedCount++;
            }

            logger.info(`Synced ${syncedCount} IBData plans for app ${app_id}`);
            return ApiResponse.success(res, 'Plans synced successfully', { count: syncedCount });

        } catch (error) {
            logger.error('Error syncing provider data:', error);
            return ApiResponse.error(res, 'Failed to sync provider data', 500);
        }
    }
}

export default AppAdminProviderController;
