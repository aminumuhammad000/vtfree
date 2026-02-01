import axios from 'axios';
// Default prices in case API fails or is not configured
const DEFAULT_PRICES = {
    PLATFORM_ANDROID: 10000,
    PLATFORM_IOS: 100000,
    PLATFORM_WEB: 20000,
    PUBLISH_PLAY_STORE: 35000,
    PUBLISH_APP_STORE: 50000,
    SERVICE_BILLS: 5000,
    SERVICE_GIFTCARD: 15000
};
export class PricingService {
    static apiRef = process.env.VTFREE_PRICING_API_URL || 'https://vtfree-pricing.api/prices'; // Conceptual URL
    static async getAppCreationPrices() {
        try {
            // Check if user provided an API URL in env, otherwise fallback
            if (!process.env.VTFREE_PRICING_API_URL) {
                console.warn('VTFREE_PRICING_API_URL not set. Using default pricing.');
                return DEFAULT_PRICES;
            }
            const response = await axios.get(process.env.VTFREE_PRICING_API_URL);
            if (response.data && response.data.success) {
                return { ...DEFAULT_PRICES, ...response.data.data };
            }
            return DEFAULT_PRICES;
        }
        catch (error) {
            console.error('Failed to fetch pricing from external API:', error);
            return DEFAULT_PRICES;
        }
    }
}
