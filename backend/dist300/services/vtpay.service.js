import axios from 'axios';
import { configService } from './config.service.js';
import logger from '../utils/logger.js';
export class VTPayService {
    static baseURL = 'https://vtpayapi.vtfree.com.ng/api'; // Default to LIVE
    /**
     * Get an Axios instance for a specific API key
     */
    static async getClient(customApiKey) {
        // According to docs, we MUST use Secret Key in x-api-key header
        let apiKey = customApiKey || await configService.get('VTPAY_SECRET_KEY');
        // Fallback to API_KEY only if SECRET_KEY is missing (backward compatibility)
        if (!apiKey) {
            apiKey = await configService.get('VTPAY_API_KEY');
        }
        const baseURL = await configService.get('VTPAY_BASE_URL') || this.baseURL;
        if (!apiKey || apiKey === 'sk_live_vtpay_key_here') {
            throw new Error('VTPay Secret Key not configured');
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
    static async createVirtualAccount(data, customApiKey) {
        try {
            // Normalize phone number: if 10 digits, prepend '0'
            let normalizedPhone = String(data.phone).trim();
            if (normalizedPhone.length === 10) {
                normalizedPhone = '0' + normalizedPhone;
            }
            const payload = { ...data, phone: normalizedPhone };
            const baseURL = await configService.get('VTPAY_BASE_URL') || this.baseURL;
            // Get the correct key for logging/request
            let apiKey = customApiKey || await configService.get('VTPAY_SECRET_KEY');
            if (!apiKey)
                apiKey = await configService.get('VTPAY_API_KEY');
            logger.info(`VTPay Request: POST ${baseURL}/virtual-accounts (Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING'})`);
            const response = await axios.post(`${baseURL}/virtual-accounts`, payload, {
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 15000 // 15s timeout
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
                logger.error(`VTPay API Error (${error.response.status}):`, error.response.data);
                throw new Error(error.response.data?.message || error.response.data?.error || 'VTPay API Error');
            }
            else if (error.request) {
                logger.error('VTPay Network Error (No response):', error.message);
                throw new Error('Failed to connect to VTPay server (Network Error)');
            }
            else {
                logger.error('VTPay Request Error:', error.message);
                // Propagate the actual error (e.g. "VTPay Secret Key not configured")
                throw new Error(error.message || 'An unexpected error occurred');
            }
        }
    }
    /**
     * Get list of virtual accounts
     */
    static async getVirtualAccounts(customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get('/virtual-accounts');
            return response.data;
        }
        catch (error) {
            if (error.response) {
                logger.error(`VTPay getVirtualAccounts API Error (${error.response.status}):`, error.response.data);
            }
            else {
                logger.error('VTPay getVirtualAccounts Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch virtual accounts');
        }
    }
    /**
     * Get account balance
     */
    static async getAccountBalance(accountNumber, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get(`/virtual-accounts/${accountNumber}/balance`);
            return response.data;
        }
        catch (error) {
            if (error.response) {
                logger.error(`VTPay getAccountBalance API Error (${error.response.status}):`, error.response.data);
            }
            else {
                logger.error('VTPay getAccountBalance Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch account balance');
        }
    }
    /**
     * Get transactions for a specific account
     */
    static async getTransactions(accountNumber, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get(`/virtual-accounts/${accountNumber}/transactions`);
            return response.data;
        }
        catch (error) {
            if (error.response) {
                logger.error(`VTPay getTransactions API Error (${error.response.status}):`, error.response.data);
            }
            else {
                logger.error('VTPay getTransactions Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch account transactions');
        }
    }
    /**
     * Get all transactions (Admin view)
     */
    static async getAllTransactions(limit = 50, offset = 0, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get('/admin/transactions', {
                params: { limit, offset }
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
                logger.error(`VTPay getAllTransactions API Error (${error.response.status}):`, error.response.data);
            }
            else {
                logger.error('VTPay getAllTransactions Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch all transactions');
        }
    }
    /**
     * Get platform wallet balance
     */
    static async getPlatformBalance(customApiKey) {
        try {
            // This will now use VTPAY_SECRET_KEY as per the updated getClient method
            const client = await this.getClient(customApiKey);
            // Log the request (masked key)
            const baseURL = await configService.get('VTPAY_BASE_URL') || this.baseURL;
            let apiKey = customApiKey || await configService.get('VTPAY_SECRET_KEY');
            if (!apiKey)
                apiKey = await configService.get('VTPAY_API_KEY');
            logger.info(`VTPay Request: GET ${baseURL}/wallet/balance (Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING'})`);
            const response = await client.get('/wallet/balance');
            return response.data;
        }
        catch (error) {
            if (error.response) {
                logger.error(`VTPay getPlatformBalance API Error (${error.response.status}):`, error.response.data);
            }
            else {
                logger.error('VTPay getPlatformBalance Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch platform balance');
        }
    }
    /**
     * Get list of banks
     */
    static async getBanksList(customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get('/banks');
            return response.data;
        }
        catch (error) {
            if (error.response) {
                logger.error(`VTPay getBanksList API Error (${error.response.status}):`, error.response.data);
            }
            else {
                logger.error('VTPay getBanksList Request Error:', error.message);
            }
            // Fallback to empty list to prevent crashes
            return { success: false, data: [] };
        }
    }
    /**
     * Get balance (generic)
     */
    static async getBalance(customApiKey) {
        return this.getPlatformBalance(customApiKey);
    }
    /**
     * Validate account
     */
    static async validateAccount(bankCode, accountNumber, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get('/banks/verify', {
                params: { bankCode, accountNumber }
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
                logger.error(`VTPay validateAccount API Error (${error.response.status}):`, error.response.data);
            }
            else {
                logger.error('VTPay validateAccount Request Error:', error.message);
            }
            throw new Error(error.response?.data?.message || 'Failed to verify account');
        }
    }
}
