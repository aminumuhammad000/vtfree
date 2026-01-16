import axios, { AxiosInstance } from 'axios';
import { configService } from './config.service.js';
import logger from '../utils/logger.js';

export interface CreateVirtualAccountDto {
    bankType: string;
    accountName: string;
    email: string;
    reference: string;
    phone: string;
}

export class VTPayService {
    private static apiKey: string | null = null;
    private static baseURL = 'http://localhost:3000/api'; // Default to local
    private static axiosInstance: AxiosInstance | null = null;

    /**
     * Get an Axios instance for a specific API key
     */
    private static async getClient(customApiKey?: string) {
        const apiKey = customApiKey || await configService.get('VTPAY_API_KEY');
        const baseURL = await configService.get('VTPAY_BASE_URL') || this.baseURL;

        if (!apiKey) {
            throw new Error('VTPay API key not configured');
        }

        return axios.create({
            baseURL: baseURL,
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Create a new virtual account
     */
    static async createVirtualAccount(data: CreateVirtualAccountDto, customApiKey?: string) {
        try {
            const client = await this.getClient(customApiKey);
            // Normalize phone number: if 10 digits, prepend '0'
            let normalizedPhone = String(data.phone).trim();
            if (normalizedPhone.length === 10) {
                normalizedPhone = '0' + normalizedPhone;
            }

            const payload = { ...data, phone: normalizedPhone };
            const response = await client.post('/virtual-accounts', payload);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                logger.error(`VTPay API Error (${error.response.status}):`, error.response.data);
            } else {
                logger.error('VTPay Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to create virtual account');
        }
    }

    /**
     * Get list of virtual accounts
     */
    static async getVirtualAccounts(customApiKey?: string) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get('/virtual-accounts');
            return response.data;
        } catch (error: any) {
            if (error.response) {
                logger.error(`VTPay getVirtualAccounts API Error (${error.response.status}):`, error.response.data);
            } else {
                logger.error('VTPay getVirtualAccounts Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch virtual accounts');
        }
    }

    /**
     * Get account balance
     */
    static async getAccountBalance(accountNumber: string, customApiKey?: string) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get(`/virtual-accounts/${accountNumber}/balance`);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                logger.error(`VTPay getAccountBalance API Error (${error.response.status}):`, error.response.data);
            } else {
                logger.error('VTPay getAccountBalance Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch account balance');
        }
    }

    /**
     * Get transactions for a specific account
     */
    static async getTransactions(accountNumber: string, customApiKey?: string) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get(`/virtual-accounts/${accountNumber}/transactions`);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                logger.error(`VTPay getTransactions API Error (${error.response.status}):`, error.response.data);
            } else {
                logger.error('VTPay getTransactions Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch account transactions');
        }
    }

    /**
     * Get all transactions (Admin view)
     */
    static async getAllTransactions(limit = 50, offset = 0, customApiKey?: string) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get('/admin/transactions', {
                params: { limit, offset }
            });
            return response.data;
        } catch (error: any) {
            if (error.response) {
                logger.error(`VTPay getAllTransactions API Error (${error.response.status}):`, error.response.data);
            } else {
                logger.error('VTPay getAllTransactions Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch all transactions');
        }
    }

    /**
     * Get platform wallet balance
     */
    static async getPlatformBalance(customApiKey?: string) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get('/wallet/balance');
            return response.data;
        } catch (error: any) {
            if (error.response) {
                logger.error(`VTPay getPlatformBalance API Error (${error.response.status}):`, error.response.data);
            } else {
                logger.error('VTPay getPlatformBalance Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch platform balance');
        }
    }

    /**
     * Get list of banks
     */
    static async getBanksList(customApiKey?: string) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get('/banks');
            return response.data;
        } catch (error: any) {
            if (error.response) {
                logger.error(`VTPay getBanksList API Error (${error.response.status}):`, error.response.data);
            } else {
                logger.error('VTPay getBanksList Request Error:', error.message);
            }
            // Fallback to empty list to prevent crashes
            return { success: false, data: [] };
        }
    }

    /**
     * Get balance (generic)
     */
    static async getBalance(customApiKey?: string) {
        return this.getPlatformBalance(customApiKey);
    }

    /**
     * Validate account
     */
    static async validateAccount(bankCode: string, accountNumber: string, customApiKey?: string) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get('/banks/verify', {
                params: { bankCode, accountNumber }
            });
            return response.data;
        } catch (error: any) {
            if (error.response) {
                logger.error(`VTPay validateAccount API Error (${error.response.status}):`, error.response.data);
            } else {
                logger.error('VTPay validateAccount Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || 'Failed to verify account');
        }
    }
}
