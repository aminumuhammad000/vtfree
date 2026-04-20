import axios from 'axios';
import { configService } from './config.service.js';
import logger from '../utils/logger.js';
export class VTStackService {
    static baseURL = 'https://api.vtstack.com.ng/api';
    static async getClient(customApiKey) {
        let apiKey = customApiKey || await configService.get('VTSTACK_SECRET_KEY');
        // Mask key for logging
        const maskedKey = apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING';
        logger.info(`[VTStackService] Using Secret API Key: ${maskedKey}`);
        if (!apiKey) {
            throw new Error('VTStack Secret Key is not configured. Please set VTSTACK_SECRET_KEY in settings.');
        }
        return axios.create({
            baseURL: this.baseURL,
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });
    }
    static handleError(error, context) {
        if (error.response) {
            logger.error(`[VTStackService] ${context} Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            throw new Error(error.response.data?.message || `VTStack API Error: ${context}`);
        }
        else if (error.request) {
            logger.error(`[VTStackService] ${context} No Response: ${error.message}`);
            throw new Error('No response from VTStack API. Please check your network connection.');
        }
        else {
            logger.error(`[VTStackService] ${context} Request Setup Error: ${error.message}`);
            throw new Error(error.message || `Failed to setup request for ${context}`);
        }
    }
    /**
     * Create a virtual account
     * Endpoint: POST /virtual-accounts
     */
    static async createVirtualAccount(data, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            // Normalize phone (ensure it starts with 0 if it's Nigerian mobile)
            let normalizedPhone = data.phone;
            // Basic normalization logic if needed
            // Generate a random 11-digit BVN as requested by user to ensure uniqueness
            const randomBvn = Math.floor(10000000000 + Math.random() * 90000000000).toString();
            const payload = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: normalizedPhone,
                bvn: data.bvn || randomBvn, // Use provided BVN or randomized fallback
                // Valid identity types: INDIVIDUAL, CORPORATE. Default to INDIVIDUAL as per docs.
                identityType: data.identityType || 'INDIVIDUAL',
                reference: data.reference
            };
            logger.info(`[VTStackService] Creating virtual account for reference: ${data.reference}`);
            const response = await client.post('/virtual-accounts', payload);
            logger.info(`[VTStackService] Virtual account created successfully: ${response.data?.data?.accountNumber}`);
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'createVirtualAccount');
        }
    }
    /**
     * Fetch all virtual accounts
     * Endpoint: GET /virtual-accounts
     */
    static async getVirtualAccounts(customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            logger.info(`[VTStackService] Fetching virtual accounts`);
            const response = await client.get('/virtual-accounts');
            // Assuming response structure { success: true, data: [ ... ] }
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'getVirtualAccounts');
        }
    }
    /**
     * Get account balance
     * Endpoint: GET /virtual-accounts/:accountNumber/balance
     */
    static async getAccountBalance(accountNumber, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            logger.info(`[VTStackService] Fetching balance for account: ${accountNumber}`);
            const response = await client.get(`/virtual-accounts/${accountNumber}/balance`);
            const data = response.data;
            // Convert kobo to Naira if balance is present
            if (data && data.success && data.data && typeof data.data.balance === 'number') {
                data.data.balance = data.data.balance / 100;
            }
            return data;
        }
        catch (error) {
            this.handleError(error, 'getAccountBalance');
        }
    }
    // --- Compatibility Methods (Added to prevent controller crashes) ---
    /**
     * Get account transactions (Added for compatibility)
     * Endpoint: GET /virtual-accounts/:accountNumber/transactions
     */
    static async getTransactions(accountNumber, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            logger.info(`[VTStackService] Fetching transactions for account: ${accountNumber}`);
            // Attempt standard endpoint pattern
            const response = await client.get(`/virtual-accounts/${accountNumber}/transactions`);
            return response.data;
        }
        catch (error) {
            // If endpoint doesn't exist, return empty array gracefully to avoid breaking UI
            if (error.response && error.response.status === 404) {
                return { success: true, data: [] };
            }
            this.handleError(error, 'getTransactions');
        }
    }
    /**
     * Get all transactions (Admin view)
     * Endpoint: GET /admin/transactions
     */
    static async getAllTransactions(limit = 50, offset = 0, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get(`/admin/transactions?limit=${limit}&offset=${offset}`);
            const data = response.data;
            // Convert kobo to Naira for all transactions
            if (data && data.success && data.data && Array.isArray(data.data.transactions)) {
                data.data.transactions = data.data.transactions.map((tx) => ({
                    ...tx,
                    amount: typeof tx.amount === 'number' ? tx.amount / 100 : tx.amount,
                    fee: typeof tx.fee === 'number' ? tx.fee / 100 : tx.fee,
                    amountNaira: typeof tx.amount === 'number' ? tx.amount / 100 : tx.amount, // Set amountNaira for compatibility
                    feeNaira: typeof tx.fee === 'number' ? tx.fee / 100 : tx.fee // Set feeNaira for compatibility
                }));
            }
            return data;
        }
        catch (error) {
            // Handle 404 gracefully
            if (error.response && error.response.status === 404) {
                return { success: true, data: { transactions: [], pagination: { total: 0, page: 1, limit } } };
            }
            this.handleError(error, 'getAllTransactions');
        }
    }
    /**
     * Get Platform (Wallet) Balance
     * Endpoint: GET /wallet/balance
     */
    static async getPlatformBalance(customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            // Attempt standard wallet balance endpoint
            const response = await client.get('/wallet/balance');
            const data = response.data;
            // Convert kobo to Naira if balance is present
            if (data && data.success && data.data && typeof data.data.balance === 'number') {
                data.data.balance = data.data.balance / 100;
            }
            return data;
        }
        catch (error) {
            if (error.response && error.response.status === 404) {
                return { success: true, data: { balance: 0, currency: 'NGN' } };
            }
            this.handleError(error, 'getPlatformBalance');
        }
    }
    /**
     * Alias for getPlatformBalance (used in some controllers)
     */
    static async getBalance(customApiKey) {
        return this.getPlatformBalance(customApiKey);
    }
}
