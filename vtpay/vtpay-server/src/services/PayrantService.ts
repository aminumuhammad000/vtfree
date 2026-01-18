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
        transfer_id: string;
        status: string;
        fee: number;
        amount: number;
        reference: string;
    };
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
                this.baseUrl = pr.baseUrl || 'https://api-core.payrant.com/';
                this.apiKey = pr.apiKey || '';
                this.initializeClient();
                logger.info('Payrant config refreshed from database');
            }
        } catch (error) {
            logger.error('Failed to refresh Payrant config', error);
        }
    }

    async transfer(payload: PayrantTransferPayload): Promise<PayrantTransferResponse> {
        await this.refreshConfig();
        const response = await this.client.post('/payout/transfer', payload);
        return response.data;
    }

    // Add verification if Payrant provides an endpoint for it
    async verifyTransfer(transferId: string): Promise<any> {
        await this.refreshConfig();
        const response = await this.client.get(`/payout/transfer/${transferId}`);
        return response.data;
    }
}

export const payrantService = new PayrantService();
export default payrantService;
