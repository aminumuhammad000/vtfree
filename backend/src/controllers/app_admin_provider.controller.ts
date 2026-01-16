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

            // If no providers found for this app, maybe we should return defaults?
            // For now, let's just return what's there.

            const sanitized = providers.map((p: any) => {
                const obj = p.toObject();
                if (obj.metadata && obj.metadata.env) {
                    obj.metadata = { ...obj.metadata };
                    delete obj.metadata.env;
                }
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
            const removed = await ProviderConfig.findOneAndDelete({ _id: id, app_id });
            if (!removed) return ApiResponse.error(res, 'Provider not found', 404);
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
                    data = await client.getDataPlans?.();

                    // Apply global profit if it's IBData
                    if (code.toLowerCase() === 'ibdata' && Array.isArray(data)) {
                        const globalPlans = await (mongoose.model('AirtimePlan') as any).find({ app_id: null });
                        data = data.map((p: any) => {
                            const globalPlan = globalPlans.find((gp: any) => gp.externalPlanId === p.plan_id || gp.code === `IBDATA_${p.plan_id}`);
                            if (globalPlan) {
                                return {
                                    ...p,
                                    price: globalPlan.price, // This is the selling price set by super admin
                                    original_price: p.price // Keep original for reference
                                };
                            }
                            return p;
                        });
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
}

export default AppAdminProviderController;
