import { SystemConfig } from '../models/index.js';

class ConfigService {
    private cache: Map<string, string> = new Map();
    private loaded: boolean = false;

    async loadConfigs() {
        try {
            const configs = await SystemConfig.find({});
            this.cache.clear();
            configs.forEach(config => {
                this.cache.set(config.key, config.value);
            });
            this.loaded = true;
            console.log('✅ System configurations loaded from database');
        } catch (error) {
            console.error('❌ Failed to load system configurations:', error);
        }
    }

    async get(key: string, defaultValue: string = ''): Promise<string> {
        if (!this.loaded) {
            await this.loadConfigs();
        }
        return this.cache.get(key) || defaultValue;
    }

    getSync(key: string, defaultValue: string = ''): string {
        return this.cache.get(key) || defaultValue;
    }

    async set(key: string, value: string) {
        await SystemConfig.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
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

            { key: 'PAYRANT_API_KEY', group: 'PAYMENT', description: 'Payrant API Key' },
            { key: 'PAYRANT_WEBHOOK_SECRET', group: 'PAYMENT', description: 'Payrant Webhook Secret' },

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

            { key: 'NODE_ENV', group: 'SYSTEM', description: 'Environment (development/production)' },
        ];

        for (const def of defaults) {
            const exists = await SystemConfig.findOne({ key: def.key });
            if (!exists) {
                await SystemConfig.create({
                    key: def.key,
                    value: process.env[def.key] || '',
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
