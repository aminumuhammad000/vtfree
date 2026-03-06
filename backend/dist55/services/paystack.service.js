import axios from 'axios';
import * as crypto from 'crypto';
import config from '../config/env.js';
export class PaystackService {
    api;
    baseUrl;
    secretKey;
    publicKey;
    webhookSecret;
    constructor() {
        this.baseUrl = 'https://api.paystack.co';
        this.secretKey = '';
        this.publicKey = '';
        this.webhookSecret = '';
        this.api = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.ensureConfig();
    }
    async ensureConfig() {
        if (this.secretKey)
            return;
        const { configService } = await import('./config.service.js');
        const { config: envConfig } = await import('../config/env.js');
        this.secretKey = await configService.get('PAYSTACK_SECRET_KEY') || envConfig.paystack.secretKey;
        this.publicKey = await configService.get('PAYSTACK_PUBLIC_KEY') || envConfig.paystack.publicKey;
        this.webhookSecret = await configService.get('PAYSTACK_WEBHOOK_SECRET') || envConfig.paystack.webhookSecret;
        this.api.defaults.headers.common['Authorization'] = `Bearer ${this.secretKey}`;
    }
    /**
     * Initialize a transaction
     * @param email Customer's email
     * @param amount Amount in kobo (e.g., 5000 for ₦50.00)
     * @param reference Optional custom reference
     */
    async initializeTransaction(email, amount, reference) {
        try {
            await this.ensureConfig();
            const response = await this.api.post('/transaction/initialize', {
                email,
                amount: amount * 100, // Convert to kobo
                reference: reference || `VTU_${Date.now()}`,
                callback_url: `${config.appUrl}/api/payment/verify`,
                metadata: {
                    custom_fields: [
                        {
                            display_name: 'Payment For',
                            variable_name: 'payment_for',
                            value: 'VTU Wallet Topup'
                        }
                    ]
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Paystack initialization error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to initialize Paystack payment');
        }
    }
    /**
     * Verify a transaction
     * @param reference Transaction reference to verify
     */
    async verifyTransaction(reference) {
        try {
            await this.ensureConfig();
            const response = await this.api.get(`/transaction/verify/${reference}`);
            return response.data;
        }
        catch (error) {
            console.error('Paystack verification error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to verify Paystack payment');
        }
    }
    /**
     * Handle Paystack webhook
     * @param payload Webhook payload
     * @param signature Webhook signature for verification
     */
    async handleWebhook(payload, signature) {
        try {
            await this.ensureConfig();
            // Verify the webhook signature
            if (!this.secretKey) {
                throw new Error('Paystack secret key is not configured');
            }
            const hmac = crypto.createHmac('sha512', this.secretKey);
            hmac.update(JSON.stringify(payload));
            const hash = hmac.digest('hex');
            if (hash !== signature) {
                throw new Error('Invalid webhook signature');
            }
            const { event, data } = payload;
            if (event === 'charge.success') {
                return {
                    success: true,
                    data: {
                        reference: data.reference,
                        amount: data.amount / 100, // Convert back to naira
                        status: data.status,
                        paidAt: data.paid_at,
                        metadata: data.metadata
                    }
                };
            }
            return { success: false, message: 'Unhandled event type' };
        }
        catch (error) {
            console.error('Paystack webhook error:', error);
            throw error;
        }
    }
    /**
     * Create a transfer recipient
     * @param accountNumber Bank account number
     * @param bankCode Paystack bank code
     * @param accountName Account name (optional)
     */
    async createTransferRecipient(accountNumber, bankCode, accountName) {
        try {
            await this.ensureConfig();
            const response = await this.api.post('/transferrecipient', {
                type: 'nuban',
                name: accountName || 'VTU Customer',
                account_number: accountNumber,
                bank_code: bankCode,
                currency: 'NGN'
            });
            return response.data;
        }
        catch (error) {
            console.error('Paystack create recipient error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to create transfer recipient');
        }
    }
    /**
     * Initiate a transfer
     * @param amount Amount in kobo
     * @param recipient Recipient code from createTransferRecipient
     * @param reason Optional reason for transfer
     */
    async initiateTransfer(amount, recipient, reason) {
        try {
            await this.ensureConfig();
            const response = await this.api.post('/transfer', {
                source: 'balance',
                amount: amount * 100, // Convert to kobo
                recipient,
                reason: reason || 'VTU Wallet Withdrawal'
            });
            return response.data;
        }
        catch (error) {
            console.error('Paystack transfer error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to initiate transfer');
        }
    }
    /**
     * Verify a transfer
     * @param reference Transfer reference
     */
    async verifyTransfer(reference) {
        try {
            await this.ensureConfig();
            const response = await this.api.get(`/transfer/verify/${reference}`);
            return response.data;
        }
        catch (error) {
            console.error('Paystack transfer verification error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to verify transfer');
        }
    }
    /**
     * List all banks
     */
    async listBanks() {
        try {
            await this.ensureConfig();
            const response = await this.api.get('/bank?country=nigeria');
            return response.data;
        }
        catch (error) {
            console.error('Paystack list banks error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch banks');
        }
    }
    /**
     * Resolve account number
     * @param accountNumber Bank account number
     * @param bankCode Paystack bank code
     */
    async resolveAccount(accountNumber, bankCode) {
        try {
            await this.ensureConfig();
            const response = await this.api.get(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
            return response.data;
        }
        catch (error) {
            console.error('Paystack resolve account error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to resolve account details');
        }
    }
}
