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
// import axios, { AxiosInstance, AxiosError } from 'axios';
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
class ZainpayService {
    log(msg) {
        const entry = `[${new Date().toISOString()}] ${msg}`;
        console.log(entry);
        ZainpayService.lastLogs.push(entry);
        if (ZainpayService.lastLogs.length > 50)
            ZainpayService.lastLogs.shift();
    }
    constructor() {
        this.log('[ZainpayService] Constructor called');
        this.baseUrl = config_1.default.zainpay.baseUrl;
        this.publicKey = config_1.default.zainpay.publicKey;
    }
    /**
     * Universal request handler using fetch (to avoid axios 405 issues)
     */
    async request(endpoint, method = 'GET', body) {
        const baseURL = this.baseUrl.trim().replace(/\/$/, '');
        const cleanEndpoint = endpoint.trim().replace(/^\//, '');
        const url = endpoint.startsWith('http') ? endpoint.trim() : `${baseURL}/${cleanEndpoint}`;
        // Ensure no trailing slash for list endpoints, unless specifically required
        // const finalUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const finalUrl = url;
        const headers = {
            'Authorization': `Bearer ${this.publicKey}`,
            'Accept': 'application/json',
            'User-Agent': 'curl/7.68.0'
        };
        // Special case: settlement endpoint requires text/plain Accept header
        if (endpoint.includes('/settlement')) {
            headers['Accept'] = 'text/plain, application/json';
        }
        if (method !== 'GET') {
            headers['Content-Type'] = 'application/json';
        }
        const options = {
            method,
            headers,
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        this.log(`[ZainpayService] ${method} ${finalUrl}`);
        // Log URL length to detect hidden chars
        this.log(`[ZainpayService] URL Length: ${finalUrl.length}, Chars: ${finalUrl.split('').map(c => c.charCodeAt(0)).join(',')}`);
        this.log(`[ZainpayService] Headers: ${JSON.stringify({ ...headers, 'Authorization': headers['Authorization']?.substring(0, 15) + '...' })}`);
        try {
            const response = await fetch(finalUrl, options);
            if (!response.ok) {
                const errorBody = await response.text();
                const msg = `Zainpay API Error: ${method} ${url} ${response.status} ${response.statusText}`;
                this.log(msg);
                this.log(`Error Body: ${errorBody}`);
                logger_1.logger.error('Zainpay API Error', {
                    method,
                    url: finalUrl,
                    status: response.status,
                    data: errorBody,
                });
                throw new Error(`${msg}: ${errorBody}`);
            }
            return await response.json();
        }
        catch (error) {
            if (!endpoint.includes('/debug/')) { // Avoid recursion if logging fails
                this.log(`Zainpay API Exception: ${method} ${finalUrl} - ${error.message}`);
            }
            throw error;
        }
    }
    initializeClient() {
        // No-op now that we use fetch, but keeping for compatibility if needed
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
                this.baseUrl = (zp.baseUrl || config_1.default.zainpay.baseUrl || '').trim();
                this.publicKey = (zp.apiKey || config_1.default.zainpay.publicKey || '').trim();
                if (this.baseUrl && this.publicKey) {
                    this.log(`Refreshing Zainpay config. New BaseURL: ${this.baseUrl}`);
                    this.initializeClient();
                    this.log(`Zainpay config refreshed from database: ${this.baseUrl}`);
                }
                else {
                    this.log('Zainpay config missing baseUrl or publicKey in DB');
                }
            }
        }
        catch (error) {
            this.log(`Failed to refresh Zainpay config: ${error.message}`);
        }
    }
    // ==================== ZAINBOX OPERATIONS ====================
    /**
     * Create a new Zainbox
     */
    async createZainbox(payload) {
        return this.request('/zainbox/create/request', 'POST', payload);
    }
    /**
     * Get all Zainboxes
     */
    async listZainboxes() {
        return this.request('/zainbox/list', 'GET');
    }
    /**
     * Update a Zainbox
     */
    async updateZainbox(payload) {
        return this.request('/zainbox/update', 'PATCH', payload);
    }
    /**
     * Get all virtual accounts linked to a zainbox
     */
    async getZainboxAccounts(zainboxCode) {
        const cleanCode = zainboxCode.trim().replace(/\/+$/, '');
        return this.request(`/zainbox/virtual-accounts/${cleanCode}`, 'GET');
    }
    /**
     * Get all account balances for a zainbox
     */
    async getZainboxAccountBalances(zainboxCode) {
        // Sanitize zainboxCode to prevent trailing slashes that cause 405 errors
        const cleanCode = zainboxCode.trim().replace(/\/+$/, '');
        return this.request(`/zainbox/accounts/balance/${cleanCode}`, 'GET');
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
        return this.request(`/zainbox/transactions/${zainboxCode}`, 'GET');
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
        return this.request(url, 'GET');
    }
    /**
     * Get zainbox profile and billing plan
     */
    async getZainboxProfile(zainboxCode) {
        return this.request(`/zainbox/profile/${zainboxCode}`, 'GET');
    }
    // ==================== VIRTUAL ACCOUNT OPERATIONS ====================
    /**
     * Create a static virtual account
     */
    async createVirtualAccount(payload) {
        return this.request('/virtual-account/create/request', 'POST', payload);
    }
    /**
     * Create a dynamic virtual account (temporary)
     */
    async createDynamicVirtualAccount(payload) {
        return this.request('/virtual-account/dynamic/create/request', 'POST', payload);
    }
    /**
     * Get virtual account balance
     */
    async getVirtualAccountBalance(accountNumber) {
        return this.request(`/virtual-account/wallet/balance/${accountNumber}`, 'GET');
    }
    /**
     * Update virtual account status (activate/deactivate)
     */
    async updateVirtualAccountStatus(zainboxCode, accountNumber, status) {
        return this.request('/virtual-account/change/account/status', 'PATCH', {
            zainboxCode,
            accountNumber,
            status,
        });
    }
    /**
     * Get virtual account transactions
     */
    async getVirtualAccountTransactions(accountNumber) {
        return this.request(`/virtual-account/wallet/transactions/${accountNumber}`, 'GET');
    }
    /**
     * Get DVA deposit status
     */
    async getDynamicVirtualAccountStatus(txnRef) {
        return this.request(`/virtual-account/dynamic/deposit/status/${txnRef}`, 'GET');
    }
    // ==================== BANK OPERATIONS ====================
    /**
     * Get list of available banks
     */
    async getBankList() {
        return this.request('/bank/list', 'GET');
    }
    /**
     * Validate bank account (Name Enquiry)
     */
    async nameEnquiry(bankCode, accountNumber) {
        return this.request(`/bank/name-enquiry?bankCode=${bankCode}&accountNumber=${accountNumber}`, 'GET');
    }
    /**
     * Verify account (wrapper for nameEnquiry)
     */
    async verifyAccount(accountNumber, bankCode) {
        const response = await this.nameEnquiry(bankCode, accountNumber);
        if (response.code !== '00' || !response.data) {
            throw new Error(response.description || 'Account verification failed');
        }
        return response.data;
    }
    // ==================== FUND TRANSFER OPERATIONS ====================
    /**
     * Transfer funds (wallet-to-wallet or wallet-to-bank)
     */
    async fundTransfer(payload) {
        return this.request('/bank/transfer/v2', 'POST', payload);
    }
    /**
     * Verify transfer status
     */
    async verifyTransfer(txnRef) {
        return this.request(`/virtual-account/wallet/transaction/verify/${txnRef}`, 'GET');
    }
    /**
     * Verify deposit
     */
    async verifyDeposit(txnRef) {
        return this.request(`/virtual-account/wallet/deposit/verify/v2/${txnRef}`, 'GET');
    }
    // ==================== SETTLEMENT OPERATIONS ====================
    /**
     * Create a scheduled settlement
     */
    async createSettlement(payload) {
        return this.request('/zainbox/settlement', 'POST', payload);
    }
    /**
     * Get settlement details
     */
    async getSettlement(zainboxCode) {
        return this.request(`/zainbox/settlement?zainboxCode=${zainboxCode}`, 'GET');
    }
    // ==================== MERCHANT OPERATIONS ====================
    /**
     * Get merchant transactions
     */
    async getMerchantTransactions(count = 20) {
        return this.request(`/zainbox/transactions?count=${count}`, 'GET');
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
        return this.request(`/virtual-account/wallet/transaction/reconcile/bank-deposit?${queryParams.toString()}`, 'GET');
    }
}
exports.ZainpayService = ZainpayService;
// private client!: AxiosInstance;
ZainpayService.lastLogs = [];
// Export singleton instance
exports.zainpayService = new ZainpayService();
exports.default = exports.zainpayService;
//# sourceMappingURL=ZainpayService.js.map