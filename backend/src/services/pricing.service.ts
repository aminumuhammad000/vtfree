import { configService } from './config.service.js';

// Default prices in case configurations are missing
const DEFAULT_PRICES = {
    PLATFORM_ANDROID: 10000,
    PLATFORM_IOS: 100000,
    PLATFORM_WEB: 20000,
    PUBLISH_PLAY_STORE: 35000,
    PUBLISH_APP_STORE: 50000,
    PUBLISH_WEB: 15000,
    SERVICE_BILLS: 5000,
    SERVICE_GIFTCARD: 15000,
    APP_UPGRADE_FEE: 5000,
    APP_UPGRADE_ENABLED: false,
    LATEST_TEMPLATE_VERSION: '2.0.0'
};

export class PricingService {
    static async getAppCreationPrices() {
        try {
            return {
                PLATFORM_ANDROID: Number(configService.getSync('APP_PRICE_ANDROID')) || DEFAULT_PRICES.PLATFORM_ANDROID,
                PLATFORM_IOS: Number(configService.getSync('APP_PRICE_IOS')) || DEFAULT_PRICES.PLATFORM_IOS,
                PLATFORM_WEB: Number(configService.getSync('APP_PRICE_WEB')) || DEFAULT_PRICES.PLATFORM_WEB,
                PUBLISH_PLAY_STORE: Number(configService.getSync('PUBLISH_PRICE_PLAY_STORE')) || DEFAULT_PRICES.PUBLISH_PLAY_STORE,
                PUBLISH_APP_STORE: Number(configService.getSync('PUBLISH_PRICE_APP_STORE')) || DEFAULT_PRICES.PUBLISH_APP_STORE,
                PUBLISH_WEB: Number(configService.getSync('PUBLISH_PRICE_WEB')) || 15000,
                APP_UPGRADE_FEE: Number(configService.getSync('APP_UPGRADE_FEE')) || 5000,
                APP_UPGRADE_ENABLED: configService.getSync('APP_UPGRADE_ENABLED') === 'true',
                LATEST_TEMPLATE_VERSION: configService.getSync('LATEST_TEMPLATE_VERSION') || '2.0.0',
                SERVICE_BILLS: DEFAULT_PRICES.SERVICE_BILLS,
                SERVICE_GIFTCARD: DEFAULT_PRICES.SERVICE_GIFTCARD
            };
        } catch (error) {
            console.error('Failed to get pricing from config:', error);
            return DEFAULT_PRICES;
        }
    }
}
