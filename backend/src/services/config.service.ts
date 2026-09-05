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
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        this.cache.set(key, value);
    }

    async refresh() {
        await this.loadConfigs();
    }
}


export const configService = new ConfigService();
