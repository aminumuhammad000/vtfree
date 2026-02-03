// import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../config';
import { logger } from '../utils/logger';
import {
    ZainpayResponse,
    CreateZainboxPayload,
    Zainbox,
    CreateVirtualAccountPayload,
    VirtualAccountResponse,
    CreateDynamicVirtualAccountPayload,
    DynamicVirtualAccountResponse,
    VirtualAccountBalance,
    AccountTransaction,
    Bank,
    NameEnquiryResponse,
    FundTransferPayload,
    FundTransferResponse,
    TransferVerificationResponse,
    DepositVerificationResponse,
    CreateSettlementPayload,
} from '../types/zainpay';

export class ZainpayService {
    private baseUrl: string;
    private publicKey: string;
    // private client!: AxiosInstance;
    public static lastLogs: string[] = [];

    private log(msg: string) {
        const entry = `[${new Date().toISOString()}] ${msg}`;
        console.log(entry);
        ZainpayService.lastLogs.push(entry);
        if (ZainpayService.lastLogs.length > 50) ZainpayService.lastLogs.shift();
    }

    constructor() {
        this.log('[ZainpayService] Constructor called');
        this.baseUrl = config.zainpay.baseUrl;
        this.publicKey = config.zainpay.publicKey;
    }

    /**
     * Universal request handler using fetch (to avoid axios 405 issues)
     */
    private async request<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
        const baseURL = this.baseUrl.trim().replace(/\/$/, '');
        const cleanEndpoint = endpoint.trim().replace(/^\//, '');
        const url = endpoint.startsWith('http') ? endpoint.trim() : `${baseURL}/${cleanEndpoint}`;

        // Ensure no trailing slash for list endpoints, unless specifically required
        // const finalUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const finalUrl = url;

        const headers: Record<string, string> = {
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

        const options: RequestInit = {
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

                logger.error('Zainpay API Error', {
                    method,
                    url: finalUrl,
                    status: response.status,
                    data: errorBody,
                });
                throw new Error(`${msg}: ${errorBody}`);
            }

            return await response.json() as T;
        } catch (error: any) {
            if (!endpoint.includes('/debug/')) { // Avoid recursion if logging fails
                this.log(`Zainpay API Exception: ${method} ${finalUrl} - ${error.message}`);
            }
            throw error;
        }
    }

    private initializeClient() {
        // No-op now that we use fetch, but keeping for compatibility if needed
    }


    /**
     * Refresh configuration from database
     */
    async refreshConfig() {
        try {
            const { SystemSetting } = await import('../models/SystemSetting');
            const settings = await SystemSetting.findOne();
            if (settings && settings.integrations?.zainpay) {
                const zp = settings.integrations.zainpay;
                this.baseUrl = (zp.baseUrl || config.zainpay.baseUrl || '').trim();
                this.publicKey = (zp.apiKey || config.zainpay.publicKey || '').trim();

                if (this.baseUrl && this.publicKey) {
                    this.log(`Refreshing Zainpay config. New BaseURL: ${this.baseUrl}`);
                    this.initializeClient();
                    this.log(`Zainpay config refreshed from database: ${this.baseUrl}`);
                } else {
                    this.log('Zainpay config missing baseUrl or publicKey in DB');
                }
            }
        } catch (error: any) {
            this.log(`Failed to refresh Zainpay config: ${error.message}`);
        }
    }

    // ==================== ZAINBOX OPERATIONS ====================

    /**
     * Create a new Zainbox
     */
    async createZainbox(payload: CreateZainboxPayload): Promise<ZainpayResponse<Zainbox>> {
        return this.request<ZainpayResponse<Zainbox>>('/zainbox/create/request', 'POST', payload);
    }

    /**
     * Get all Zainboxes
     */
    async listZainboxes(): Promise<ZainpayResponse<Zainbox[]>> {
        return this.request<ZainpayResponse<Zainbox[]>>('/zainbox/list', 'GET');
    }

    /**
     * Update a Zainbox
     */
    async updateZainbox(payload: {
        name: string;
        codeName: string;
        tags?: string;
        callbackUrl?: string;
        emailNotification?: string;
    }): Promise<ZainpayResponse> {
        return this.request<ZainpayResponse>('/zainbox/update', 'PATCH', payload);
    }

    /**
     * Get all virtual accounts linked to a zainbox
     */
    async getZainboxAccounts(zainboxCode: string): Promise<ZainpayResponse<{ bankAccount: string; bankName: string; name: string }[]>> {
        const cleanCode = zainboxCode.trim().replace(/\/+$/, '');
        return this.request<ZainpayResponse<{ bankAccount: string; bankName: string; name: string }[]>>(`/zainbox/virtual-accounts/${cleanCode}`, 'GET');
    }

    /**
     * Get all account balances for a zainbox
     */
    async getZainboxAccountBalances(zainboxCode: string): Promise<ZainpayResponse<VirtualAccountBalance[]>> {
        // Sanitize zainboxCode to prevent trailing slashes that cause 405 errors
        const cleanCode = zainboxCode.trim().replace(/\/+$/, '');
        return this.request<ZainpayResponse<VirtualAccountBalance[]>>(`/zainbox/accounts/balance/${cleanCode}`, 'GET');
    }

    /**
     * Get total balance for a zainbox (sum of all account balances)
     */
    async getZainboxBalance(zainboxCode: string): Promise<{ totalBalance: number; balances: VirtualAccountBalance[] }> {
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
    async getZainboxTransactions(zainboxCode: string): Promise<ZainpayResponse<AccountTransaction[]>> {
        return this.request<ZainpayResponse<AccountTransaction[]>>(`/zainbox/transactions/${zainboxCode}`, 'GET');
    }

    /**
     * Get total payment collected by zainbox
     */
    async getZainboxPaymentSummary(
        zainboxCode: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<ZainpayResponse<{ count: number; total: string; transactionType: string }[]>> {
        let url = `/zainbox/transfer/deposit/summary/${zainboxCode}`;
        const params = new URLSearchParams();
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        if (params.toString()) url += `?${params.toString()}`;

        return this.request<ZainpayResponse<{ count: number; total: string; transactionType: string }[]>>(url, 'GET');
    }

    /**
     * Get zainbox profile and billing plan
     */
    async getZainboxProfile(zainboxCode: string): Promise<ZainpayResponse<{
        zainbox: Zainbox;
        account2AccountBilling: { fixedCharge: string; percentageCharge: number };
        interBankBilling: { fixedCharge: string; percentageCharge: number };
    }>> {
        return this.request<ZainpayResponse<{
            zainbox: Zainbox;
            account2AccountBilling: { fixedCharge: string; percentageCharge: number };
            interBankBilling: { fixedCharge: string; percentageCharge: number };
        }>>(`/zainbox/profile/${zainboxCode}`, 'GET');
    }

    // ==================== VIRTUAL ACCOUNT OPERATIONS ====================

    /**
     * Create a static virtual account
     */
    async createVirtualAccount(payload: CreateVirtualAccountPayload): Promise<ZainpayResponse<VirtualAccountResponse>> {
        return this.request<ZainpayResponse<VirtualAccountResponse>>('/virtual-account/create/request', 'POST', payload);
    }

    /**
     * Create a dynamic virtual account (temporary)
     */
    async createDynamicVirtualAccount(payload: CreateDynamicVirtualAccountPayload): Promise<ZainpayResponse<DynamicVirtualAccountResponse>> {
        return this.request<ZainpayResponse<DynamicVirtualAccountResponse>>('/virtual-account/dynamic/create/request', 'POST', payload);
    }

    /**
     * Get virtual account balance
     */
    async getVirtualAccountBalance(accountNumber: string): Promise<ZainpayResponse<VirtualAccountBalance>> {
        return this.request<ZainpayResponse<VirtualAccountBalance>>(`/virtual-account/wallet/balance/${accountNumber}`, 'GET');
    }

    /**
     * Update virtual account status (activate/deactivate)
     */
    async updateVirtualAccountStatus(
        zainboxCode: string,
        accountNumber: string,
        status: boolean
    ): Promise<ZainpayResponse> {
        return this.request<ZainpayResponse>('/virtual-account/change/account/status', 'PATCH', {
            zainboxCode,
            accountNumber,
            status,
        });
    }

    /**
     * Get virtual account transactions
     */
    async getVirtualAccountTransactions(accountNumber: string): Promise<ZainpayResponse<AccountTransaction[]>> {
        return this.request<ZainpayResponse<AccountTransaction[]>>(`/virtual-account/wallet/transactions/${accountNumber}`, 'GET');
    }

    /**
     * Get DVA deposit status
     */
    async getDynamicVirtualAccountStatus(txnRef: string): Promise<ZainpayResponse<{
        accountName: string;
        accountNumber: string;
        amount: string;
        bankType: string;
        callBackUrl: string;
        createdDate: string;
        duration: number;
        email: string;
        status: string;
        timeToLive: number;
        totalTxnAmount: string;
        txnFee: string;
        txnRef: string;
        zainboxCode: string;
    }>> {
        return this.request<ZainpayResponse<any>>(`/virtual-account/dynamic/deposit/status/${txnRef}`, 'GET');
    }

    // ==================== BANK OPERATIONS ====================

    /**
     * Get list of available banks
     */
    async getBankList(): Promise<ZainpayResponse<Bank[]>> {
        return this.request<ZainpayResponse<Bank[]>>('/bank/list', 'GET');
    }

    /**
     * Validate bank account (Name Enquiry)
     */
    async nameEnquiry(bankCode: string, accountNumber: string): Promise<ZainpayResponse<NameEnquiryResponse>> {
        return this.request<ZainpayResponse<NameEnquiryResponse>>(`/bank/name-enquiry?bankCode=${bankCode}&accountNumber=${accountNumber}`, 'GET');
    }

    /**
     * Verify account (wrapper for nameEnquiry)
     */
    async verifyAccount(accountNumber: string, bankCode: string): Promise<NameEnquiryResponse> {
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
    async fundTransfer(payload: FundTransferPayload): Promise<ZainpayResponse<FundTransferResponse>> {
        return this.request<ZainpayResponse<FundTransferResponse>>('/bank/transfer/v2', 'POST', payload);
    }

    /**
     * Verify transfer status
     */
    async verifyTransfer(txnRef: string): Promise<ZainpayResponse<TransferVerificationResponse>> {
        return this.request<ZainpayResponse<TransferVerificationResponse>>(`/virtual-account/wallet/transaction/verify/${txnRef}`, 'GET');
    }

    /**
     * Verify deposit
     */
    async verifyDeposit(txnRef: string): Promise<ZainpayResponse<DepositVerificationResponse>> {
        return this.request<ZainpayResponse<DepositVerificationResponse>>(`/virtual-account/wallet/deposit/verify/v2/${txnRef}`, 'GET');
    }

    // ==================== SETTLEMENT OPERATIONS ====================

    /**
     * Create a scheduled settlement
     */
    async createSettlement(payload: CreateSettlementPayload): Promise<ZainpayResponse> {
        return this.request<ZainpayResponse>('/zainbox/settlement', 'POST', payload);
    }

    /**
     * Get settlement details
     */
    async getSettlement(zainboxCode: string): Promise<ZainpayResponse<{
        name: string;
        schedulePeriod: string;
        scheduleType: string;
        settlementAccounts: { accountNumber: string; bankCode: string; percentage: string }[];
        zainbox: string;
    }>> {
        return this.request<ZainpayResponse<any>>(`/zainbox/settlement?zainboxCode=${zainboxCode}`, 'GET');
    }

    // ==================== MERCHANT OPERATIONS ====================

    /**
     * Get merchant transactions
     */
    async getMerchantTransactions(count: number = 20): Promise<ZainpayResponse<AccountTransaction[]>> {
        return this.request<ZainpayResponse<AccountTransaction[]>>(`/zainbox/transactions?count=${count}`, 'GET');
    }

    // ==================== RECONCILIATION ====================

    /**
     * Reconcile bank deposit
     */
    async reconcileBankDeposit(params: {
        sessionId?: string;
        verificationType: 'depositReferenceNumber' | 'depositAccountNumber';
        bankType: string;
        accountNumber: string;
    }): Promise<ZainpayResponse<DepositVerificationResponse>> {
        const queryParams = new URLSearchParams();
        if (params.sessionId) queryParams.append('sessionId', params.sessionId);
        queryParams.append('verificationType', params.verificationType);
        queryParams.append('bankType', params.bankType);
        queryParams.append('accountNumber', params.accountNumber);

        return this.request<ZainpayResponse<DepositVerificationResponse>>(`/virtual-account/wallet/transaction/reconcile/bank-deposit?${queryParams.toString()}`, 'GET');
    }
}

// Export singleton instance
export const zainpayService = new ZainpayService();
export default zainpayService;
