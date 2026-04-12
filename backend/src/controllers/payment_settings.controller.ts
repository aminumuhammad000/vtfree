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
            vtstack_api_key,
            vtstack_secret_key,
            vtstack_public_key
        } = req.body;

        const app = await CreatedApp.findOne({ app_id });
        if (!app) return ApiResponse.error(res, 'App not found', 404);

        if (!app.payment_settings) app.payment_settings = { default_gateway: 'vtstack' } as any;

        app.payment_settings.default_gateway = 'vtstack';
        if (vtstack_api_key !== undefined) app.payment_settings.vtstack_api_key = vtstack_api_key?.trim();
        if (vtstack_secret_key !== undefined) app.payment_settings.vtstack_secret_key = vtstack_secret_key?.trim();
        if (vtstack_public_key !== undefined) app.payment_settings.vtstack_public_key = vtstack_public_key?.trim();

        await app.save();

        return ApiResponse.success(res, app.payment_settings, 'Payment settings updated');
    } catch (error: any) {
        return ApiResponse.error(res, error.message, 500);
    }
};
