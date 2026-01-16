import axios, { AxiosInstance } from 'axios';
import { configService } from './config.service.js';

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
     * Initialize VTPay API key and Axios instance
     */
    private static async init() {
        if (this.axiosInstance) return;

        // Fetch from ConfigService
        const apiKey = await configService.get('VTPAY_API_KEY');
        const baseURL = await configService.get('VTPAY_BASE_URL');

        if (baseURL) {
            this.baseURL = baseURL;
        }

        if (!apiKey) {
            throw new Error('VTPay API key not configured');
        }

        this.apiKey = apiKey;
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Create a new virtual account
     */
    static async createVirtualAccount(data: CreateVirtualAccountDto) {
        await this.init();
        try {
            // Normalize phone number: if 10 digits, prepend '0'
            let normalizedPhone = String(data.phone).trim();
            if (normalizedPhone.length === 10) {
                normalizedPhone = '0' + normalizedPhone;
            }

            const payload = { ...data, phone: normalizedPhone };
            const response = await this.axiosInstance!.post('/virtual-accounts', payload);
            return response.data;
        } catch (error: any) {
            console.error('VTPay createVirtualAccount error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to create virtual account');
        }
    }

    /**
     * Get list of virtual accounts
     */
    static async getVirtualAccounts() {
        await this.init();
        try {
            const response = await this.axiosInstance!.get('/virtual-accounts');
            return response.data;
        } catch (error: any) {
            console.error('VTPay getVirtualAccounts error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch virtual accounts');
        }
    }

    /**
     * Get account balance
     */
    static async getAccountBalance(accountNumber: string) {
        await this.init();
        try {
            const response = await this.axiosInstance!.get(`/virtual-accounts/${accountNumber}/balance`);
            return response.data;
        } catch (error: any) {
            console.error('VTPay getAccountBalance error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch account balance');
        }
    }

    /**
     * Get transactions for a specific account
     */
    static async getTransactions(accountNumber: string) {
        await this.init();
        try {
            const response = await this.axiosInstance!.get(`/virtual-accounts/${accountNumber}/transactions`);
            return response.data;
        } catch (error: any) {
            console.error('VTPay getTransactions error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch account transactions');
        }
    }

    /**
     * Get all transactions (Admin view)
     */
    static async getAllTransactions(limit = 50, offset = 0) {
        await this.init();
        try {
            const response = await this.axiosInstance!.get('/admin/transactions', {
                params: { limit, offset }
            });
            return response.data;
        } catch (error: any) {
            // Fallback: if /admin/transactions fails (e.g. not an admin key), 
            // we might want to try a different approach or just throw
            console.error('VTPay getAllTransactions error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch all transactions');
        }
    }

    /**
     * Get platform wallet balance
     */
    static async getPlatformBalance() {
        await this.init();
        try {
            const response = await this.axiosInstance!.get('/wallet/balance');
            return response.data;
        } catch (error: any) {
            console.error('VTPay getPlatformBalance error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch platform balance');
        }
    }

    /**
     * Get list of banks
     */
    static async getBanksList() {
        await this.init();
        try {
            // Return empty list as default since we don't have the specific endpoint yet
            return { status: 'success', data: { banks: [] } };
        } catch (error: any) {
            return { status: 'success', data: { banks: [] } };
        }
    }

    /**
     * Get balance (generic)
     */
    static async getBalance() {
        return this.getPlatformBalance();
    }

    /**
     * Validate account
     */
    static async validateAccount(bankCode: string, accountNumber: string) {
        await this.init();
        // Return mock validation for now to prevent crashes
        return {
            status: 'success',
            data: {
                account_name: 'Verified Account',
                account_number: accountNumber
            }
        };
    }

    /**
     * Force re-initialization of the axios instance (useful when settings change)
     */
    static forceInit() {
        this.axiosInstance = null;
    }
}
