"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zainpayService = exports.ZainpayService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
class ZainpayService {
    constructor() {
        this.baseUrl = config_1.default.zainpay.baseUrl;
        this.publicKey = config_1.default.zainpay.publicKey;
        this.initializeClient();
    }
    initializeClient() {
        // Ensure no trailing slash
        const baseURL = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
        this.client = axios_1.default.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.publicKey}`,
            },
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            logger_1.logger.error('Zainpay API Error', {
                method: error.config?.method?.toUpperCase(),
                url: error.config?.url,
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        });
    }
    /**
     * Refresh configuration from database
     */
    async refreshConfig() {
        try {
            const { SystemSetting } = await Promise.resolve().then(() => __importStar(require('../models/SystemSetting')));
            const settings = await SystemSetting.findOne();
            if (settings && settings.integrations?.zainpay) {
                const zp = settings.integrations.zainpay;
                this.baseUrl = zp.baseUrl || config_1.default.zainpay.baseUrl || '';
                this.publicKey = zp.apiKey || config_1.default.zainpay.publicKey || '';
                if (this.baseUrl && this.publicKey) {
                    this.initializeClient();
                    logger_1.logger.info('Zainpay config refreshed from database');
                }
                else {
                    logger_1.logger.warn('Zainpay config missing baseUrl or publicKey in DB');
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh Zainpay config', { message: error.message || error });
        }
    }
    // ==================== ZAINBOX OPERATIONS ====================
    /**
     * Create a new Zainbox
     */
    async createZainbox(payload) {
        const response = await this.client.post('/zainbox/create/request', payload);
        return response.data;
    }
    /**
     * Get all Zainboxes
     */
    async listZainboxes() {
        const response = await this.client.get('/zainbox/list');
        return response.data;
    }
    /**
     * Update a Zainbox
     */
    async updateZainbox(payload) {
        const response = await this.client.patch('/zainbox/update', payload);
        return response.data;
    }
    /**
     * Get all virtual accounts linked to a zainbox
     */
    async getZainboxAccounts(zainboxCode) {
        const response = await this.client.get(`/zainbox/virtual-accounts/${zainboxCode}`);
        return response.data;
    }
    /**
     * Get all account balances for a zainbox
     */
    async getZainboxAccountBalances(zainboxCode) {
        const response = await this.client.get(`/zainbox/accounts/balance/${zainboxCode}`);
        return response.data;
    }
    /**
     * Get total balance for a zainbox (sum of all account balances)
     */
    async getZainboxBalance(zainboxCode) {
        const response = await this.getZainboxAccountBalances(zainboxCode);
        if (response.code !== '00' || !response.data) {
            return { totalBalance: 0, balances: [] };
        }
        const rawBalances = response.data;
        const balances = rawBalances.filter(acc => acc.accountName !== 'Internal Settlement Account');
        const totalBalance = balances.reduce((sum, acc) => sum + (acc.balanceAmount || 0), 0);
        return { totalBalance, balances };
    }
    /**
     * Get zainbox transaction history
     */
    async getZainboxTransactions(zainboxCode) {
        const response = await this.client.get(`/zainbox/transactions/${zainboxCode}`);
        return response.data;
    }
    /**
     * Get total payment collected by zainbox
     */
    async getZainboxPaymentSummary(zainboxCode, dateFrom, dateTo) {
        let url = `/zainbox/transfer/deposit/summary/${zainboxCode}`;
        const params = new URLSearchParams();
        if (dateFrom)
            params.append('dateFrom', dateFrom);
        if (dateTo)
            params.append('dateTo', dateTo);
        if (params.toString())
            url += `?${params.toString()}`;
        const response = await this.client.get(url);
        return response.data;
    }
    /**
     * Get zainbox profile and billing plan
     */
    async getZainboxProfile(zainboxCode) {
        const response = await this.client.get(`/zainbox/profile/${zainboxCode}`);
        return response.data;
    }
    // ==================== VIRTUAL ACCOUNT OPERATIONS ====================
    /**
     * Create a static virtual account
     */
    async createVirtualAccount(payload) {
        const response = await this.client.post('/virtual-account/create/request', payload);
        return response.data;
    }
    /**
     * Create a dynamic virtual account (temporary)
     */
    async createDynamicVirtualAccount(payload) {
        const response = await this.client.post('/virtual-account/dynamic/create/request', payload);
        return response.data;
    }
    /**
     * Get virtual account balance
     */
    async getVirtualAccountBalance(accountNumber) {
        const response = await this.client.get(`/virtual-account/wallet/balance/${accountNumber}`);
        return response.data;
    }
    /**
     * Update virtual account status (activate/deactivate)
     */
    async updateVirtualAccountStatus(zainboxCode, accountNumber, status) {
        const response = await this.client.patch('/virtual-account/change/account/status', {
            zainboxCode,
            accountNumber,
            status,
        });
        return response.data;
    }
    /**
     * Get virtual account transactions
     */
    async getVirtualAccountTransactions(accountNumber) {
        try {
            const response = await this.client.get(`/virtual-account/wallet/transactions/${accountNumber}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Failed to fetch transactions for ${accountNumber}`, error.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Get DVA deposit status
     */
    async getDynamicVirtualAccountStatus(txnRef) {
        const response = await this.client.get(`/virtual-account/dynamic/deposit/status/${txnRef}`);
        return response.data;
    }
    // ==================== BANK OPERATIONS ====================
    /**
     * Get list of available banks
     */
    async getBankList() {
        const response = await this.client.get('/bank/list');
        return response.data;
    }
    /**
     * Validate bank account (Name Enquiry)
     */
    async nameEnquiry(bankCode, accountNumber) {
        const response = await this.client.get(`/bank/name-enquiry?bankCode=${bankCode}&accountNumber=${accountNumber}`);
        return response.data;
    }
    // ==================== FUND TRANSFER OPERATIONS ====================
    /**
     * Transfer funds (wallet-to-wallet or wallet-to-bank)
     */
    async fundTransfer(payload) {
        const response = await this.client.post('/bank/transfer/v2', payload);
        return response.data;
    }
    /**
     * Verify transfer status
     */
    async verifyTransfer(txnRef) {
        const response = await this.client.get(`/virtual-account/wallet/transaction/verify/${txnRef}`);
        return response.data;
    }
    /**
     * Verify deposit
     */
    async verifyDeposit(txnRef) {
        const response = await this.client.get(`/virtual-account/wallet/deposit/verify/v2/${txnRef}`);
        return response.data;
    }
    // ==================== SETTLEMENT OPERATIONS ====================
    /**
     * Create a scheduled settlement
     */
    async createSettlement(payload) {
        const response = await this.client.post('/zainbox/settlement', payload);
        return response.data;
    }
    /**
     * Get settlement details
     */
    async getSettlement(zainboxCode) {
        const response = await this.client.get(`/zainbox/settlement?zainboxCode=${zainboxCode}`);
        return response.data;
    }
    // ==================== MERCHANT OPERATIONS ====================
    /**
     * Get merchant transactions
     */
    async getMerchantTransactions(count = 20) {
        const response = await this.client.get(`/zainbox/transactions?count=${count}`);
        return response.data;
    }
    // ==================== RECONCILIATION ====================
    /**
     * Reconcile bank deposit
     */
    async reconcileBankDeposit(params) {
        const queryParams = new URLSearchParams();
        if (params.sessionId)
            queryParams.append('sessionId', params.sessionId);
        queryParams.append('verificationType', params.verificationType);
        queryParams.append('bankType', params.bankType);
        queryParams.append('accountNumber', params.accountNumber);
        const response = await this.client.get(`/virtual-account/wallet/transaction/reconcile/bank-deposit?${queryParams.toString()}`);
        return response.data;
    }
}
exports.ZainpayService = ZainpayService;
// Export singleton instance
exports.zainpayService = new ZainpayService();
exports.default = exports.zainpayService;
//# sourceMappingURL=ZainpayService.js.map