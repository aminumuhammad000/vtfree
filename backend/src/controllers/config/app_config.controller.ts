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
            { key: 'DEFAULT_PAYMENT_GATEWAY', value: app.payment_settings?.default_gateway || 'vtstack', group: 'PAYMENT' },
            { key: 'VTSTACK_API_KEY', value: app.payment_settings?.vtstack_api_key || '', group: 'PAYMENT' },
            { key: 'VTSTACK_SECRET_KEY', value: app.payment_settings?.vtstack_secret_key || '', group: 'PAYMENT' },
            { key: 'VTSTACK_PUBLIC_KEY', value: app.payment_settings?.vtstack_public_key || '', group: 'PAYMENT' },

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
            case 'VTSTACK_API_KEY': app.payment_settings.vtstack_api_key = value?.trim(); break;
            case 'VTSTACK_SECRET_KEY':
                // Validate API Key - inform the user but don't block saving if verification fails
                // (except for obviously invalid short keys)
                if (value && value.length > 8) {
                    try {
                        const { VTStackService } = await import('../../services/vtstack.service.js');
                        // Use a reliable endpoint to verify the key works
                        await VTStackService.getVirtualAccounts(value);
                    } catch (err: any) {
                        console.warn('[AppConfigController] VTStack Key Verification Failed:', err.message);
                        // Save but warn the user in the response
                        app.payment_settings.vtstack_secret_key = value;
                        await app.save();
                        return res.json({
                            success: true,
                            message: `API Key saved, but verification failed: ${err.message}. Please double-check your credentials on VTStack.`,
                            data: { key, value }
                        });
                    }
                }
                app.payment_settings.vtstack_secret_key = value?.trim();
                break;
            case 'VTSTACK_PUBLIC_KEY': app.payment_settings.vtstack_public_key = value?.trim(); break;

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
