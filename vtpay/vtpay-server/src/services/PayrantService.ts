import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';
import { logger } from '../utils/logger';
import { SystemSetting } from '../models/SystemSetting';

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
        transfer_id: number;
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
            httpsAgent: new https.Agent({ family: 4 }), // Force IPv4
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            timeout: 30000, // 30 seconds timeout
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                    error.message = 'Payment provider timed out. The transaction may be pending.';
                } else if (error.code === 'ERR_NETWORK') {
                    error.message = 'Network error connecting to payment provider.';
                } else if ((error.response?.data as any)?.message) {
                    // Pass through provider's message
                    // (optional: could attach it to error.message if needed immediately, 
                    // but usually we read from response.data in PayoutService)
                }

                logger.error('Payrant API Error', {
                    method: error.config?.method?.toUpperCase(),
                    url: error.config?.url,
                    status: error.response?.status,
                    data: error.response?.data,
                    code: error.code,
                    message: error.message
                });
                throw error;
            }
        );
    }

    async refreshConfig() {
        try {
            const settings = await SystemSetting.findOne();
            if (settings && settings.integrations?.payrant) {
                const pr = settings.integrations.payrant;

                const newBaseUrl = pr.baseUrl?.replace(/\/+$/, '') || 'https://api-core.payrant.com';
                const newApiKey = pr.apiKey || '';

                if (newApiKey !== this.apiKey || newBaseUrl !== this.baseUrl) {
                    this.baseUrl = newBaseUrl;
                    this.apiKey = newApiKey;
                    this.initializeClient();
                    logger.info(`Payrant config refreshed. BaseURL: ${this.baseUrl}, KeyLength: ${this.apiKey.length}`);
                }
            } else {
                logger.warn('SystemSetting or Payrant integration config not found');
            }
        } catch (error: any) {
            logger.error('Failed to refresh Payrant config', { message: error?.message || 'Unknown error', stack: error?.stack });
        }
    }

    /**
     * Get list of supported banks
     * GET /payout/banks_list/
     */
    async getBanksList(): Promise<PayrantBank[]> {
        await this.refreshConfig();
        try {
            const response = await this.client.get('/payout/banks_list/');
            if (response.data?.status === 'success') {
                return response.data.data.banks;
            }
        } catch (error) {
            logger.warn('Failed to fetch banks from Payrant, using fallback list', error);
        }

        // Fallback list of major Nigerian banks
        return [
            { bankCode: "090405", bankName: "Moniepoint MFB", bankUrl: "https://transsnet-android-upload-image-prod.s3.amazonaws.com/activity/17518943562816-small%20bank.png", bgUrl: "" },
            { bankCode: "100033", bankName: "PalmPay", bankUrl: "", bgUrl: "" },
            { bankCode: "044", bankName: "Access Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "058", bankName: "Guaranty Trust Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "057", bankName: "Zenith Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "033", bankName: "United Bank for Africa", bankUrl: "", bgUrl: "" },
            { bankCode: "011", bankName: "First Bank of Nigeria", bankUrl: "", bgUrl: "" },
            { bankCode: "090267", bankName: "Kuda Microfinance Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "076", bankName: "Polaris Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "032", bankName: "Union Bank of Nigeria", bankUrl: "", bgUrl: "" },
            { bankCode: "215", bankName: "Unity Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "035", bankName: "Wema Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "050", bankName: "Ecobank Nigeria", bankUrl: "", bgUrl: "" },
            { bankCode: "023", bankName: "Citibank Nigeria", bankUrl: "", bgUrl: "" },
            { bankCode: "063", bankName: "Diamond Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "214", bankName: "FCMB", bankUrl: "", bgUrl: "" },
            { bankCode: "070", bankName: "Fidelity Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "030", bankName: "Heritage Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "301", bankName: "Jaiz Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "082", bankName: "Keystone Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "081", bankName: "Providus Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "221", bankName: "Stanbic IBTC Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "232", bankName: "Sterling Bank", bankUrl: "", bgUrl: "" },
            { bankCode: "032", bankName: "Union Bank of Nigeria", bankUrl: "", bgUrl: "" }
        ];
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
        const response = await this.client.post('/payout/transfer/', payload);
        return response.data;
    }

    /**
     * Verify Transfer
     */
    async verifyTransfer(reference: string): Promise<PayrantTransferResponse> {
        await this.refreshConfig();
        // Fallback: Verify is not officially documented public endpoint yet? 
        // We will try GET /payout/transfer/:reference or similar if known, 
        // else throw or return mock for now to allow compilation.

        // Actually, assuming standard pattern:
        // const response = await this.client.get(\`/payout/transfer/${reference}\`);
        // return response.data;

        throw new Error('Verify transfer not implemented yet');
    }
}

export const payrantService = new PayrantService();
export default payrantService;
