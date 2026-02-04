import { SystemConfig } from '../models/index.js';
class ConfigService {
    cache = new Map();
    loaded = false;
    async loadConfigs() {
        try {
            const configs = await SystemConfig.find({});
            this.cache.clear();
            configs.forEach(config => {
                this.cache.set(config.key, config.value);
            });
            this.loaded = true;
            console.log('✅ System configurations loaded from database');
        }
        catch (error) {
            console.error('❌ Failed to load system configurations:', error);
        }
    }
    async get(key, defaultValue = '') {
        if (!this.loaded) {
            await this.loadConfigs();
        }
        return this.cache.get(key) || defaultValue;
    }
    getSync(key, defaultValue = '') {
        return this.cache.get(key) || defaultValue;
    }
    async set(key, value) {
        await SystemConfig.findOneAndUpdate({ key }, { value }, { upsert: true, new: true, setDefaultsOnInsert: true });
        this.cache.set(key, value);
    }
    async refresh() {
        await this.loadConfigs();
    }
    // Seed default keys if they don't exist
    async seedDefaults() {
        const defaults = [
            { key: 'MAIL_HOST', group: 'EMAIL', description: 'SMTP Host' },
            { key: 'MAIL_PORT', group: 'EMAIL', description: 'SMTP Port' },
            { key: 'MAIL_USER', group: 'EMAIL', description: 'SMTP User' },
            { key: 'MAIL_PASSWORD', group: 'EMAIL', description: 'SMTP Password' },
            { key: 'MAIL_FROM_NAME', group: 'EMAIL', description: 'Sender Name' },
            { key: 'MAIL_FROM_ADDRESS', group: 'EMAIL', description: 'Sender Email Address' },
            { key: 'MAIL_PROVIDER', group: 'EMAIL', description: 'Email Provider (gmail/other)' },
            { key: 'DEFAULT_PAYMENT_GATEWAY', group: 'PAYMENT', description: 'Default Payment Gateway (vtpay/paystack/monnify)' },
            { key: 'TERMII_API_KEY', group: 'SMS', description: 'Termii API Key' },
            { key: 'TERMII_SENDER_ID', group: 'SMS', description: 'Termii Sender ID' },
            { key: 'JWT_SECRET', group: 'SECURITY', description: 'JWT Secret Key' },
            { key: 'JWT_EXPIRY', group: 'SECURITY', description: 'JWT Expiry Time' },
            { key: 'MONNIFY_API_KEY', group: 'PAYMENT', description: 'Monnify API Key' },
            { key: 'MONNIFY_SECRET_KEY', group: 'PAYMENT', description: 'Monnify Secret Key' },
            { key: 'MONNIFY_CONTRACT_CODE', group: 'PAYMENT', description: 'Monnify Contract Code' },
            { key: 'MONNIFY_BASE_URL', group: 'PAYMENT', description: 'Monnify Base URL' },
            { key: 'ZAINPAY_API_KEY', group: 'PAYMENT', description: 'Zainpay API Key' },
            { key: 'ZAINPAY_SECRET_KEY', group: 'PAYMENT', description: 'Zainpay Secret Key' },
            { key: 'ZAINPAY_BASE_URL', group: 'PAYMENT', description: 'Zainpay Base URL' },
            { key: 'ZAINPAY_IS_LIVE', group: 'PAYMENT', description: 'Zainpay Live Mode' },
            { key: 'VTPAY_API_KEY', group: 'PAYMENT', description: 'VTPay API Key (Default Gateway)' },
            { key: 'VTPAY_BASE_URL', group: 'PAYMENT', description: 'VTPay Base URL' },
            { key: 'VTPAY_SECRET_KEY', group: 'PAYMENT', description: 'VTPay Secret Key' },
            { key: 'VTPAY_PUBLIC_KEY', group: 'PAYMENT', description: 'VTPay Public Key' },
            { key: 'VTPAY_IS_ACTIVE', group: 'PAYMENT', description: 'VTPay Gateway Status (true/false)' },
            { key: 'PAYSTACK_SECRET_KEY', group: 'PAYMENT', description: 'Paystack Secret Key' },
            { key: 'PAYSTACK_PUBLIC_KEY', group: 'PAYMENT', description: 'Paystack Public Key' },
            { key: 'PAYSTACK_IS_ACTIVE', group: 'PAYMENT', description: 'Paystack Gateway Status' },
            { key: 'FLUTTERWAVE_SECRET_KEY', group: 'PAYMENT', description: 'Flutterwave Secret Key' },
            { key: 'FLUTTERWAVE_PUBLIC_KEY', group: 'PAYMENT', description: 'Flutterwave Public Key' },
            { key: 'FLUTTERWAVE_ENCRYPTION_KEY', group: 'PAYMENT', description: 'Flutterwave Encryption Key' },
            { key: 'FLUTTERWAVE_IS_ACTIVE', group: 'PAYMENT', description: 'Flutterwave Gateway Status' },
            { key: 'KYC_AUTO_APPROVE', group: 'SECURITY', description: 'Auto-approve KYC uploads (true/false)' },
            { key: 'NODE_ENV', group: 'SYSTEM', description: 'Environment (development/production)' },
            // App Pricing
            { key: 'APP_PRICE_ANDROID', group: 'PRICING', description: 'Base price for Android App', value: '10000' },
            { key: 'APP_PRICE_IOS', group: 'PRICING', description: 'Base price for iOS App', value: '100000' },
            { key: 'APP_PRICE_WEB', group: 'PRICING', description: 'Base price for Web App', value: '20000' },
            { key: 'PUBLISH_PRICE_PLAY_STORE', group: 'PRICING', description: 'Google Play Store publishing fee', value: '35000' },
            { key: 'PUBLISH_PRICE_APP_STORE', group: 'PRICING', description: 'Apple App Store publishing fee', value: '50000' },
            { key: 'APP_UPGRADE_FEE', group: 'PRICING', description: 'Fee for upgrading app to latest version', value: '5000' },
            { key: 'APP_UPGRADE_ENABLED', group: 'SYSTEM', description: 'Enable/Disable App Upgrades', value: 'true' },
            { key: 'LATEST_TEMPLATE_VERSION', group: 'SYSTEM', description: 'Latest App Template Version', value: '2.0.0' },
        ];
        for (const def of defaults) {
            const exists = await SystemConfig.findOne({ key: def.key });
            if (!exists) {
                let value = process.env[def.key] || '';
                if (def.key === 'JWT_SECRET' && !value) {
                    const { config } = await import('../config/bootstrap.js');
                    value = config.jwtSecret;
                }
                await SystemConfig.create({
                    key: def.key,
                    value: def.value || value,
                    group: def.group,
                    description: def.description
                });
                console.log(`🌱 Seeded config key: ${def.key}`);
            }
        }
        await this.loadConfigs();
    }
}
export const configService = new ConfigService();
