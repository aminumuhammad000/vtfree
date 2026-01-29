import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';

export interface PayrantTransferPayload {
    bank_code: string;
    account_number: string;
    account_name: string;
    amount: number;
    description: string;
    notify_url: string;
}

export interface PayrantTransferResponse {
    status: string;
    message: string;
    data: {
        transfer_id: number; // Changed to number based on doc example "13"
        reference: string;
        order_no: string;
        amount: number;
        fee: number;
        total_debit: number;
        bank_name: string;
        account_name: string;
        account_number: string;
        status: string;
        estimated_completion: string;
        webhook_url: string;
    };
}

export interface PayrantBank {
    bankCode: string;
    bankName: string;
    bankUrl: string;
    bgUrl: string;
}

export interface PayrantAccountValidation {
    account_number: string;
    account_name: string;
    bank_code: string;
    verified: boolean;
}

export class PayrantService {
    private client!: AxiosInstance;
    private baseUrl: string = 'https://api-core.payrant.com/';
    private apiKey: string = '';

    constructor() {
        this.initializeClient();
    }

    private initializeClient() {
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                logger.error('Payrant API Error', {
                    method: error.config?.method?.toUpperCase(),
                    url: error.config?.url,
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                throw error;
            }
        );
    }

    async refreshConfig() {
        try {
            const { SystemSetting } = await import('../models/SystemSetting');
            const settings = await SystemSetting.findOne();
            if (settings && settings.integrations?.payrant) {
                const pr = settings.integrations.payrant;
                // Ensure no trailing slash issues if user adds one
                this.baseUrl = pr.baseUrl?.replace(/\/+$/, '') || 'https://api-core.payrant.com';
                this.apiKey = pr.apiKey || '';
                this.initializeClient();
                logger.info('Payrant config refreshed from database');
            }
        } catch (error) {
            logger.error('Failed to refresh Payrant config', error);
        }
    }

    /**
     * Get list of supported banks
     * GET /payout/banks_list/
     */
    async getBanksList(): Promise<PayrantBank[]> {
        await this.refreshConfig();
        const response = await this.client.get('/payout/banks_list/');
        if (response.data?.status === 'success') {
            return response.data.data.banks;
        }
        return [];
    }

    /**
     * Validate account details
     * POST /payout/validate_account/
     */
    async validateAccount(bankCode: string, accountNumber: string): Promise<PayrantAccountValidation> {
        await this.refreshConfig();
        const response = await this.client.post('/payout/validate_account/', {
            bank_code: bankCode,
            account_number: accountNumber
        });

        if (response.data?.status === 'success') {
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Account validation failed');
    }

    /**
     * Initiate bank transfer
     * POST /payout/transfer
     */
    async transfer(payload: PayrantTransferPayload): Promise<PayrantTransferResponse> {
        await this.refreshConfig();
        const response = await this.client.post('/payout/transfer', payload);
        return response.data;
    }

    /**
     * Verify Transfer
     * Note: Not explicitly documented for Payouts in the user snippets, 
     * but keeping a placeholder or removing if unused. 
     * The snippet showed GET /api-core/transaction/api.php?action=verify for Checkout.
     * We will rely on webhooks for now as per docs.
     */
}

export const payrantService = new PayrantService();
export default payrantService;
