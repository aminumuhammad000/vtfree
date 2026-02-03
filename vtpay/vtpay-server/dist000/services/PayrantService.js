"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrantService = exports.PayrantService = void 0;
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const logger_1 = require("../utils/logger");
const SystemSetting_1 = require("../models/SystemSetting");
class PayrantService {
    constructor() {
        this.baseUrl = 'https://api-core.payrant.com/';
        this.apiKey = '';
        this.initializeClient();
    }
    initializeClient() {
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            httpsAgent: new https_1.default.Agent({ family: 4 }), // Force IPv4
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            timeout: 30000, // 30 seconds timeout
        });
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                error.message = 'Payment provider timed out. The transaction may be pending.';
            }
            else if (error.code === 'ERR_NETWORK') {
                error.message = 'Network error connecting to payment provider.';
            }
            else if (error.response?.data?.message) {
                // Pass through provider's message
                // (optional: could attach it to error.message if needed immediately, 
                // but usually we read from response.data in PayoutService)
            }
            logger_1.logger.error('Payrant API Error', {
                method: error.config?.method?.toUpperCase(),
                url: error.config?.url,
                status: error.response?.status,
                data: error.response?.data,
                code: error.code,
                message: error.message
            });
            throw error;
        });
    }
    async refreshConfig() {
        try {
            const settings = await SystemSetting_1.SystemSetting.findOne();
            if (settings && settings.integrations?.payrant) {
                const pr = settings.integrations.payrant;
                const newBaseUrl = pr.baseUrl?.replace(/\/+$/, '') || 'https://api-core.payrant.com';
                const newApiKey = pr.apiKey || '';
                if (newApiKey !== this.apiKey || newBaseUrl !== this.baseUrl) {
                    this.baseUrl = newBaseUrl;
                    this.apiKey = newApiKey;
                    this.initializeClient();
                    logger_1.logger.info(`Payrant config refreshed. BaseURL: ${this.baseUrl}, KeyLength: ${this.apiKey.length}`);
                }
            }
            else {
                logger_1.logger.warn('SystemSetting or Payrant integration config not found');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh Payrant config', { message: error?.message || 'Unknown error', stack: error?.stack });
        }
    }
    /**
     * Get list of supported banks
     * GET /payout/banks_list/
     */
    async getBanksList() {
        await this.refreshConfig();
        try {
            const response = await this.client.get('/payout/banks_list/');
            if (response.data?.status === 'success') {
                return response.data.data.banks;
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to fetch banks from Payrant, using fallback list', error);
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
    async validateAccount(bankCode, accountNumber) {
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
    async transfer(payload) {
        await this.refreshConfig();
        const response = await this.client.post('/payout/transfer/', payload);
        return response.data;
    }
    /**
     * Verify Transfer
     */
    async verifyTransfer(reference) {
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
exports.PayrantService = PayrantService;
exports.payrantService = new PayrantService();
exports.default = exports.payrantService;
//# sourceMappingURL=PayrantService.js.map