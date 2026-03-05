import axios from 'axios';
import { configService } from './config.service.js';
import logger from '../utils/logger.js';
export class PayrantService {
    static baseURL = 'https://api-core.payrant.com/';
    static async getClient(customApiKey) {
        let apiKey = customApiKey || await configService.get('PAYRANT_API_KEY');
        const baseURL = await configService.get('PAYRANT_BASE_URL') || this.baseURL;
        if (!apiKey) {
            throw new Error('Payrant API Key not configured');
        }
        return axios.create({
            baseURL: baseURL,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * Create a new virtual account via Payrant
     */
    static async createVirtualAccount(data, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            logger.info(`Payrant Request: POST /palmpay/ (Ref: ${data.accountReference})`);
            // Map documentType to what Payrant expects if needed. 
            // Docs say "documentType": "nin"
            const response = await client.post('/palmpay/', data);
            // Response format: { status: "Enabled", account_no: "...", virtualAccountName: "...", ... }
            if (response.data && response.data.account_no) {
                return {
                    success: true,
                    data: {
                        accountNumber: response.data.account_no,
                        accountName: response.data.customerName || response.data.virtualAccountName,
                        bankName: 'PalmPay', // Payrant seems to use PalmPay for these
                        reference: response.data.accountReference,
                        status: response.data.status === 'Enabled' ? 'active' : 'inactive'
                    }
                };
            }
            return {
                success: false,
                message: response.data.message || 'Failed to create virtual account via Payrant'
            };
        }
        catch (error) {
            return this.handleError(error, 'createVirtualAccount');
        }
    }
    /**
     * Get list of banks
     */
    static async getBanksList(customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get('/payout/banks_list/');
            return response.data;
        }
        catch (error) {
            logger.error(`Payrant getBanksList Error:`, error.message);
            return { status: 'error', data: { banks: [] } };
        }
    }
    /**
     * Validate account name
     */
    static async validateAccount(bank_code, account_number, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.post('/payout/validate_account/', { bank_code, account_number });
            return response.data;
        }
        catch (error) {
            return this.handleError(error, 'validateAccount');
        }
    }
    /**
     * Initiate transfer
     */
    static async initiateTransfer(data, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.post('/payout/transfer', data);
            return response.data;
        }
        catch (error) {
            return this.handleError(error, 'initiateTransfer');
        }
    }
    /**
     * Initialize Checkout Transaction
     */
    static async initializeCheckout(data, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.post('/transaction/api.php?action=initialize', data);
            return response.data;
        }
        catch (error) {
            return this.handleError(error, 'initializeCheckout');
        }
    }
    /**
     * Verify Checkout Transaction
     */
    static async verifyCheckout(reference, customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get(`/transaction/api.php?action=verify&reference=${reference}`);
            return response.data;
        }
        catch (error) {
            return this.handleError(error, 'verifyCheckout');
        }
    }
    /**
     * Get wallet balance
     */
    static async getBalance(customApiKey) {
        try {
            const client = await this.getClient(customApiKey);
            const response = await client.get('/wallet.php?action=balance');
            // Assuming it returns { status: 'success', data: { balance: ... } }
            return response.data;
        }
        catch (error) {
            return this.handleError(error, 'getBalance');
        }
    }
    static handleError(error, context) {
        if (error.response) {
            logger.error(`Payrant API Error (${context}) - ${error.response.status}:`, error.response.data);
            return {
                success: false,
                message: error.response.data?.message || `Payrant API Error during ${context}`
            };
        }
        else if (error.request) {
            logger.error(`Payrant Network Error (${context}):`, error.message);
            return {
                success: false,
                message: `Payrant Network Error during ${context}`
            };
        }
        else {
            logger.error(`Payrant Error (${context}):`, error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }
}
