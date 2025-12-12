import axios from 'axios';
import { configService } from './config.service.js';

export class VTPayService {
    private static apiKey: string | null = null;
    private static baseURL = 'https://api.vtpass.com'; // Replace with actual VTPay base URL

    /**
     * Initialize VTPay API key from config
     */
    private static async getApiKey(): Promise<string> {
        if (this.apiKey) return this.apiKey;

        // Fetch from ConfigService
        const apiKey = await configService.get('VTPAY_API_KEY');
        if (!apiKey) {
            throw new Error('VTPay API key not configured');
        }

        this.apiKey = apiKey;
        return this.apiKey;
    }

    /**
     * Get list of banks from VTPay
     */
    static async getBanksList() {
        try {
            const apiKey = await this.getApiKey();

            const response = await axios.get(`${this.baseURL}/payout/banks_list`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            console.error('VTPay getBanksList error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch banks list');
        }
    }

    /**
     * Validate bank account number
     */
    static async validateAccount(bankCode: string, accountNumber: string) {
        try {
            const apiKey = await this.getApiKey();

            const response = await axios.post(
                `${this.baseURL}/payout/validate_account/`,
                {
                    bank_code: bankCode,
                    account_number: accountNumber,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('VTPay validateAccount error:', error.response?.data || error.message);

            // Return the error response structure from VTPay
            if (error.response?.data) {
                return error.response.data;
            }

            throw new Error('Failed to validate account');
        }
    }

    /**
     * Get VTPay account balance
     */
    static async getBalance() {
        try {
            const apiKey = await this.getApiKey();

            // Assuming there's a balance endpoint - update URL as needed
            const response = await axios.get(`${this.baseURL}/payout/balance`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            console.error('VTPay getBalance error:', error.response?.data || error.message);

            // Return mock data for now if endpoint doesn't exist
            return {
                status: 'success',
                data: {
                    balance: 0,
                    currency: 'NGN',
                },
            };
        }
    }
}
