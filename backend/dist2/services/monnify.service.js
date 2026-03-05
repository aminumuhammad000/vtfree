// services/monnify.service.ts
import axios from 'axios';
import crypto from 'crypto';
export class MonnifyService {
    config;
    axiosInstance;
    accessToken = null;
    tokenExpiry = 0;
    constructor() {
        this.config = {
            apiKey: '',
            secretKey: '',
            contractCode: '',
            baseUrl: 'https://sandbox.monnify.com',
        };
        this.axiosInstance = axios.create({
            baseURL: this.config.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    async ensureConfig() {
        if (this.config.apiKey && this.config.secretKey)
            return;
        const { configService } = await import('./config.service.js');
        this.config.apiKey = await configService.get('MONNIFY_API_KEY') || process.env.MONNIFY_API_KEY || '';
        this.config.secretKey = await configService.get('MONNIFY_SECRET_KEY') || process.env.MONNIFY_SECRET_KEY || '';
        this.config.contractCode = await configService.get('MONNIFY_CONTRACT_CODE') || process.env.MONNIFY_CONTRACT_CODE || '';
        this.config.baseUrl = await configService.get('MONNIFY_BASE_URL') || process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com';
        this.axiosInstance.defaults.baseURL = this.config.baseUrl;
    }
    /**
     * Get access token from Monnify
     */
    async getAccessToken() {
        try {
            await this.ensureConfig();
            // Return cached token if still valid
            if (this.accessToken && Date.now() < this.tokenExpiry) {
                return this.accessToken;
            }
            const auth = Buffer.from(`${this.config.apiKey}:${this.config.secretKey}`).toString('base64');
            console.log('🔑 Requesting Monnify access token...');
            const response = await this.axiosInstance.post('/api/v1/auth/login', {}, {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            });
            if (response.data.requestSuccessful) {
                this.accessToken = response.data.responseBody.accessToken;
                // Set expiry to 5 minutes before actual expiry
                this.tokenExpiry = Date.now() + (response.data.responseBody.expiresIn - 300) * 1000;
                console.log('✅ Monnify access token obtained');
                return this.accessToken;
            }
            throw new Error(response.data.responseMessage || 'Failed to get access token');
        }
        catch (error) {
            console.error('❌ Monnify auth error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Monnify');
        }
    }
    /**
     * Initialize a payment transaction
     */
    async initiatePayment(data) {
        try {
            await this.ensureConfig();
            const token = await this.getAccessToken();
            const payload = {
                amount: data.amount,
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                paymentReference: data.paymentReference,
                paymentDescription: data.paymentDescription || 'Wallet Funding',
                currencyCode: 'NGN',
                contractCode: this.config.contractCode,
                redirectUrl: data.redirectUrl || process.env.FRONTEND_URL || 'http://localhost:8081',
                paymentMethods: ['CARD', 'ACCOUNT_TRANSFER', 'USSD'],
                incomeSplitConfig: data.incomeSplitConfig || [],
            };
            console.log('💳 Initiating Monnify payment:', payload.paymentReference);
            const response = await this.axiosInstance.post('/api/v1/merchant/transactions/init-transaction', payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.data.requestSuccessful) {
                console.log('✅ Payment initialized:', response.data.responseBody.checkoutUrl);
                return response.data.responseBody;
            }
            throw new Error(response.data.responseMessage || 'Failed to initialize payment');
        }
        catch (error) {
            console.error('❌ Monnify initiate payment error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.responseMessage || 'Failed to initiate payment');
        }
    }
    /**
     * Verify a payment transaction
     */
    async verifyPayment(transactionReference) {
        try {
            await this.ensureConfig();
            const token = await this.getAccessToken();
            console.log('🔍 Verifying Monnify payment:', transactionReference);
            const response = await this.axiosInstance.get(`/api/v2/transactions/${encodeURIComponent(transactionReference)}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.data.requestSuccessful) {
                console.log('✅ Payment verified:', response.data.responseBody.paymentStatus);
                return response.data.responseBody;
            }
            throw new Error(response.data.responseMessage || 'Failed to verify payment');
        }
        catch (error) {
            console.error('❌ Monnify verify payment error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.responseMessage || 'Failed to verify payment');
        }
    }
    /**
     * Validate Monnify webhook signature
     */
    validateWebhookSignature(payload, signature) {
        try {
            const hash = crypto
                .createHmac('sha512', this.config.secretKey)
                .update(JSON.stringify(payload))
                .digest('hex');
            return hash === signature;
        }
        catch (error) {
            console.error('❌ Webhook signature validation error:', error);
            return false;
        }
    }
    /**
     * Generate payment reference
     */
    generatePaymentReference(userId) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `MNF-${userId.substring(0, 8)}-${timestamp}-${random}`;
    }
}
export const monnifyService = new MonnifyService();
