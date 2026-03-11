import CreatedApp from '../../models/created_app.model.js';
export const getAppConfigs = async (req, res) => {
    try {
        const app_id = req.user.app_id;
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
            { key: 'PAYSTACK_SECRET_KEY', value: app.payment_settings?.paystack_secret_key || '', group: 'PAYMENT' },
            { key: 'PAYSTACK_PUBLIC_KEY', value: app.payment_settings?.paystack_public_key || '', group: 'PAYMENT' },
            { key: 'MONNIFY_API_KEY', value: app.payment_settings?.monnify_api_key || '', group: 'PAYMENT' },
            { key: 'MONNIFY_SECRET_KEY', value: app.payment_settings?.monnify_secret_key || '', group: 'PAYMENT' },
            { key: 'MONNIFY_CONTRACT_CODE', value: app.payment_settings?.monnify_contract_code || '', group: 'PAYMENT' },
            { key: 'PAYRANT_API_KEY', value: app.payment_settings?.payrant_api_key || '', group: 'PAYMENT' },
            { key: 'PAYRANT_WEBHOOK_SECRET', value: app.payment_settings?.payrant_webhook_secret || '', group: 'PAYMENT' },
            { key: 'PAYRANT_IS_ACTIVE', value: app.payment_settings?.payrant_is_active ? 'true' : 'false', group: 'PAYMENT' },
            // Referral Settings
            { key: 'REFERRAL_ENABLED', value: app.referral_settings?.enabled ? 'true' : 'false', group: 'REFERRAL' },
            { key: 'REFERRAL_AMOUNT', value: app.referral_settings?.amount?.toString() || '0', group: 'REFERRAL' },
        ];
        res.json({
            success: true,
            data: configs
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const updateAppConfig = async (req, res) => {
    try {
        const app_id = req.user.app_id;
        const { key } = req.params;
        const { value } = req.body;
        const app = await CreatedApp.findOne({ app_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        // Initialize objects if they don't exist
        if (!app.email_settings)
            app.email_settings = {};
        if (!app.payment_settings)
            app.payment_settings = {};
        // Map key to field
        switch (key) {
            // Email
            case 'MAIL_PROVIDER':
                app.email_settings.provider = value;
                break;
            case 'MAIL_HOST':
                app.email_settings.host = value;
                break;
            case 'MAIL_PORT':
                app.email_settings.port = value;
                break;
            case 'MAIL_USER':
                app.email_settings.user = value;
                break;
            case 'MAIL_PASSWORD':
                app.email_settings.password = value;
                break;
            case 'MAIL_FROM_NAME':
                app.email_settings.from_name = value;
                break;
            case 'MAIL_FROM_ADDRESS':
                app.email_settings.from_address = value;
                break;
            // Payment
            case 'DEFAULT_PAYMENT_GATEWAY':
                app.payment_settings.default_gateway = value;
                break;
            case 'VTSTACK_API_KEY':
                app.payment_settings.vtstack_api_key = value;
                break;
            case 'VTSTACK_SECRET_KEY':
            case 'VTSTACK_SECRET_KEY': // Alias
                // Validate API Key
                if (value && value.length > 5) {
                    try {
                        const { VTStackService } = await import('../../services/vtstack.service.js');
                        // Use getBalance to verify the key works
                        await VTStackService.getBalance(value);
                    }
                    catch (err) {
                        return res.status(400).json({
                            success: false,
                            message: `Invalid API Key: Connection failed. ${err.message}`
                        });
                    }
                }
                app.payment_settings.vtstack_secret_key = value;
                break;
            case 'VTSTACK_PUBLIC_KEY':
                app.payment_settings.vtstack_public_key = value;
                break;
            case 'PAYSTACK_SECRET_KEY':
                app.payment_settings.paystack_secret_key = value;
                break;
            case 'PAYSTACK_PUBLIC_KEY':
                app.payment_settings.paystack_public_key = value;
                break;
            case 'MONNIFY_API_KEY':
                app.payment_settings.monnify_api_key = value;
                break;
            case 'MONNIFY_SECRET_KEY':
                app.payment_settings.monnify_secret_key = value;
                break;
            case 'MONNIFY_CONTRACT_CODE':
                app.payment_settings.monnify_contract_code = value;
                break;
            case 'PAYRANT_API_KEY':
                app.payment_settings.payrant_api_key = value;
                break;
            case 'PAYRANT_WEBHOOK_SECRET':
                app.payment_settings.payrant_webhook_secret = value;
                break;
            case 'PAYRANT_IS_ACTIVE':
                app.payment_settings.payrant_is_active = value === 'true';
                break;
            // Referral
            case 'REFERRAL_ENABLED':
                if (!app.referral_settings)
                    app.referral_settings = { enabled: false, amount: 0 };
                app.referral_settings.enabled = value === 'true';
                break;
            case 'REFERRAL_AMOUNT':
                if (!app.referral_settings)
                    app.referral_settings = { enabled: false, amount: 0 };
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
