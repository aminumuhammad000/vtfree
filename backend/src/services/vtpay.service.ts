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
            const response = await this.axiosInstance!.post('/virtual-accounts', data);
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
     * Get transactions
     */
    static async getTransactions(accountNumber: string) {
        await this.init();
        try {
            const response = await this.axiosInstance!.get(`/virtual-accounts/${accountNumber}/transactions`);
            return response.data;
        } catch (error: any) {
            console.error('VTPay getTransactions error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch transactions');
        }
    }
}
