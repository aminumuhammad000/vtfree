import { Request, Response } from 'express';
import CreatedApp from '../../models/created_app.model.js';

export const getAppConfigs = async (req: Request, res: Response) => {
    try {
        const app_id = (req as any).user.app_id;
        const app = await CreatedApp.findOne({ app_id });

        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        // Map CreatedApp fields to the key/value format the frontend expects
        const configs = [
            // Branding
            { key: 'APP_NAME', value: app.app_name, group: 'BRANDING' },
            { key: 'PRIMARY_COLOR', value: app.branding.primary_color, group: 'BRANDING' },
            { key: 'SECONDARY_COLOR', value: app.branding.secondary_color, group: 'BRANDING' },

            // Email Settings
            { key: 'MAIL_PROVIDER', value: app.email_settings?.provider || 'other', group: 'EMAIL' },
            { key: 'MAIL_HOST', value: app.email_settings?.host || '', group: 'EMAIL' },
            { key: 'MAIL_PORT', value: app.email_settings?.port || '587', group: 'EMAIL' },
            { key: 'MAIL_USER', value: app.email_settings?.user || '', group: 'EMAIL' },
            { key: 'MAIL_PASSWORD', value: app.email_settings?.password || '', group: 'EMAIL' },
            { key: 'MAIL_FROM_NAME', value: app.email_settings?.from_name || '', group: 'EMAIL' },
            { key: 'MAIL_FROM_ADDRESS', value: app.email_settings?.from_address || '', group: 'EMAIL' },

            // Payment Settings
            { key: 'DEFAULT_PAYMENT_GATEWAY', value: app.payment_settings?.default_gateway || 'vtpay', group: 'PAYMENT' },
            { key: 'VTPAY_API_KEY', value: app.payment_settings?.vtpay_api_key || '', group: 'PAYMENT' },
            { key: 'VTPAY_SECRET_KEY', value: app.payment_settings?.vtpay_secret_key || '', group: 'PAYMENT' },
            { key: 'VTPAY_PUBLIC_KEY', value: app.payment_settings?.vtpay_public_key || '', group: 'PAYMENT' },
            { key: 'PAYSTACK_SECRET_KEY', value: app.payment_settings?.paystack_secret_key || '', group: 'PAYMENT' },
            { key: 'PAYSTACK_PUBLIC_KEY', value: app.payment_settings?.paystack_public_key || '', group: 'PAYMENT' },
            { key: 'MONNIFY_API_KEY', value: app.payment_settings?.monnify_api_key || '', group: 'PAYMENT' },
            { key: 'MONNIFY_SECRET_KEY', value: app.payment_settings?.monnify_secret_key || '', group: 'PAYMENT' },
            { key: 'MONNIFY_CONTRACT_CODE', value: app.payment_settings?.monnify_contract_code || '', group: 'PAYMENT' },
            { key: 'MONNIFY_CONTRACT_CODE', value: app.payment_settings?.monnify_contract_code || '', group: 'PAYMENT' },

            // Referral Settings
            { key: 'REFERRAL_ENABLED', value: app.referral_settings?.enabled ? 'true' : 'false', group: 'REFERRAL' },
            { key: 'REFERRAL_AMOUNT', value: app.referral_settings?.amount?.toString() || '0', group: 'REFERRAL' },
        ];

        res.json({
            success: true,
            data: configs
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAppConfig = async (req: Request, res: Response) => {
    try {
        const app_id = (req as any).user.app_id;
        const { key } = req.params;
        const { value } = req.body;

        const app = await CreatedApp.findOne({ app_id });

        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        // Initialize objects if they don't exist
        if (!app.email_settings) app.email_settings = {} as any;
        if (!app.payment_settings) app.payment_settings = {} as any;

        // Map key to field
        switch (key) {
            // Email
            case 'MAIL_PROVIDER': app.email_settings.provider = value; break;
            case 'MAIL_HOST': app.email_settings.host = value; break;
            case 'MAIL_PORT': app.email_settings.port = value; break;
            case 'MAIL_USER': app.email_settings.user = value; break;
            case 'MAIL_PASSWORD': app.email_settings.password = value; break;
            case 'MAIL_FROM_NAME': app.email_settings.from_name = value; break;
            case 'MAIL_FROM_ADDRESS': app.email_settings.from_address = value; break;

            // Payment
            case 'DEFAULT_PAYMENT_GATEWAY': app.payment_settings.default_gateway = value; break;
            case 'VTPAY_API_KEY': app.payment_settings.vtpay_api_key = value; break;
            case 'VTPAY_SECRET_KEY': app.payment_settings.vtpay_secret_key = value; break;
            case 'VTPAY_PUBLIC_KEY': app.payment_settings.vtpay_public_key = value; break;
            case 'PAYSTACK_SECRET_KEY': app.payment_settings.paystack_secret_key = value; break;
            case 'PAYSTACK_PUBLIC_KEY': app.payment_settings.paystack_public_key = value; break;
            case 'MONNIFY_API_KEY': app.payment_settings.monnify_api_key = value; break;
            case 'MONNIFY_SECRET_KEY': app.payment_settings.monnify_secret_key = value; break;
            case 'MONNIFY_CONTRACT_CODE': app.payment_settings.monnify_contract_code = value; break;

            // Referral
            case 'REFERRAL_ENABLED':
                if (!app.referral_settings) app.referral_settings = { enabled: false, amount: 0 };
                app.referral_settings.enabled = value === 'true';
                break;
            case 'REFERRAL_AMOUNT':
                if (!app.referral_settings) app.referral_settings = { enabled: false, amount: 0 };
                app.referral_settings.amount = Number(value);
                break;

            default:
                return res.status(400).json({ success: false, message: `Unknown config key: ${key}` });
        }

        await app.save();

        res.json({
            success: true,
            message: 'App configuration updated successfully',
            data: { key, value }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
