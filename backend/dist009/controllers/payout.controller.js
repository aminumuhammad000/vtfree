import { VTStackService } from '../services/vtstack.service.js';
import { ApiResponse } from '../utils/response.js';
export class PayoutController {
    /**
     * Get active payout service
     */
    static async getActiveService(app_id) {
        if (!app_id)
            return VTStackService;
        try {
            const CreatedApp = (await import('../models/created_app.model.js')).default;
            const app = await CreatedApp.findOne({ app_id });
            const gateway = app?.payment_settings?.default_gateway || 'vtstack';
            if (gateway === 'payrant') {
                const { PayrantService } = await import('../services/payrant.service.js');
                return PayrantService;
            }
        }
        catch (e) {
            console.error('Error getting active payout service:', e);
        }
        return VTStackService;
    }
    /**
     * Helper to get App API Key
     */
    static async getAppApiKey(app_id) {
        if (!app_id)
            return undefined;
        try {
            const CreatedApp = (await import('../models/created_app.model.js')).default;
            const app = await CreatedApp.findOne({ app_id });
            const gateway = app?.payment_settings?.default_gateway || 'vtstack';
            if (gateway === 'payrant') {
                return app?.payment_settings?.payrant_api_key;
            }
            // Prefer secret key, fallback to api key - supports both VTStack and VTPay keys
            return app?.payment_settings?.vtstack_secret_key
                || app?.payment_settings?.vtpay_secret_key
                || app?.payment_settings?.vtpay_api_key;
        }
        catch (e) {
            return undefined;
        }
    }
    /**
     * Get list of banks from active gateway
     */
    static async getBanksList(req, res) {
        try {
            const app_id = req.user?.app_id;
            // @ts-ignore
            const service = await this.getActiveService(app_id);
            const apiKey = await this.getAppApiKey(app_id);
            // @ts-ignore
            const result = await service.getBanksList(apiKey); // Note: VTStackService might not implement this yet?
            // VTStack/VTPay returns { status, data: { banks } }
            const banks = Array.isArray(result) ? result : (result?.data?.banks || result?.banks || []);
            return ApiResponse.success(res, banks, 'Banks list retrieved successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    /**
     * Validate bank account
     */
    static async validateAccount(req, res) {
        try {
            const { bank_code, account_number } = req.body;
            const app_id = req.user?.app_id;
            if (!bank_code || !account_number) {
                return ApiResponse.error(res, 'Bank code and account number are required', 400);
            }
            // @ts-ignore
            const service = await this.getActiveService(app_id);
            const apiKey = await this.getAppApiKey(app_id);
            // @ts-ignore
            const result = await service.validateAccount(bank_code, account_number, apiKey);
            // Normalize response
            const accountName = result.account_name || result.data?.account_name || result.data?.accountName || result.accountName;
            if (accountName) {
                return ApiResponse.success(res, {
                    verified: true,
                    account_name: accountName
                }, 'Account validated successfully');
            }
            return ApiResponse.error(res, 'Account validation failed', 400);
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    /**
     * Get balance from active gateway
     */
    static async getVTStackBalance(req, res) {
        try {
            const app_id = req.user?.app_id;
            // @ts-ignore
            const service = await this.getActiveService(app_id);
            const apiKey = await this.getAppApiKey(app_id);
            // Check if service has getBalance method
            if (typeof service.getBalance !== 'function') {
                // @ts-ignore
                if (typeof service.getPlatformBalance === 'function') {
                    // Fallback to getPlatformBalance if getBalance missing
                    const result = await service.getPlatformBalance(apiKey);
                    if (result.status === 'success' || result.success) {
                        return ApiResponse.success(res, result.data, 'Balance retrieved successfully');
                    }
                }
                return ApiResponse.success(res, { balance: 0, currency: 'NGN' }, 'Balance not supported for this gateway');
            }
            // @ts-ignore
            const result = await service.getBalance(apiKey);
            if (result.status === 'success' || result.success) { // VTStack returns {success: true...}
                return ApiResponse.success(res, result.data, 'Balance retrieved successfully');
            }
            return ApiResponse.error(res, result.message || 'Failed to fetch balance', 400);
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
}
