import { Request, Response } from 'express';
import CreatedApp from '../models/created_app.model.js';
import { ApiResponse } from '../utils/response.js';

/**
 * GET /api/app-admin/payment-settings
 */
export const getPaymentSettings = async (req: Request, res: Response) => {
    try {
        const app_id = (req as any).user.app_id;
        const app = await CreatedApp.findOne({ app_id });

        if (!app) return ApiResponse.error(res, 'App not found', 404);

        return ApiResponse.success(res, app.payment_settings, 'Payment settings retrieved');
    } catch (error: any) {
        return ApiResponse.error(res, error.message, 500);
    }
};

/**
 * PUT /api/app-admin/payment-settings
 */
export const updatePaymentSettings = async (req: Request, res: Response) => {
    try {
        const app_id = (req as any).user.app_id;
        const {
            default_gateway,
            vtstack_api_key,
            vtstack_secret_key,
            payrant_api_key,
            payrant_webhook_secret,
            payrant_is_active,
            monnify_api_key,
            monnify_secret_key,
            monnify_contract_code
        } = req.body;

        const app = await CreatedApp.findOne({ app_id });
        if (!app) return ApiResponse.error(res, 'App not found', 404);

        if (!app.payment_settings) app.payment_settings = {} as any;

        if (default_gateway) app.payment_settings.default_gateway = default_gateway;
        if (vtstack_api_key !== undefined) app.payment_settings.vtstack_api_key = vtstack_api_key;
        if (vtstack_secret_key !== undefined) app.payment_settings.vtstack_secret_key = vtstack_secret_key;

        // Payrant
        if (payrant_api_key !== undefined) app.payment_settings.payrant_api_key = payrant_api_key;
        if (payrant_webhook_secret !== undefined) app.payment_settings.payrant_webhook_secret = payrant_webhook_secret;
        if (payrant_is_active !== undefined) app.payment_settings.payrant_is_active = !!payrant_is_active;

        // Monnify
        if (monnify_api_key !== undefined) app.payment_settings.monnify_api_key = monnify_api_key;
        if (monnify_secret_key !== undefined) app.payment_settings.monnify_secret_key = monnify_secret_key;
        if (monnify_contract_code !== undefined) app.payment_settings.monnify_contract_code = monnify_contract_code;

        await app.save();

        return ApiResponse.success(res, app.payment_settings, 'Payment settings updated');
    } catch (error: any) {
        return ApiResponse.error(res, error.message, 500);
    }
};
