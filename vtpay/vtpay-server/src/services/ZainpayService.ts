import axios, { AxiosInstance, AxiosError } from 'axios';
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
    private client!: AxiosInstance;
    private baseUrl: string;
    private publicKey: string;
    private secretKey: string;

    constructor() {
        this.baseUrl = config.zainpay.baseUrl;
        this.publicKey = config.zainpay.publicKey;
        this.secretKey = config.zainpay.secretKey;

        this.initializeClient();
    }

    private initializeClient() {
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.publicKey}`,
            },
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                logger.error('Zainpay API Error', {
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

    /**
     * Refresh configuration from SystemSetting
     */
    async refreshConfig() {
        try {
            logger.info('Refreshing Zainpay configuration from database...');
            const SystemSetting = (await import('../models')).SystemSetting;
            const settings = await SystemSetting.findOne();

            if (settings && settings.integrations.zainpay) {
                const zainpayConfig = settings.integrations.zainpay;

                // Only update if keys are present
                if (zainpayConfig.apiKey && zainpayConfig.baseUrl) {
                    logger.info(`Found Zainpay settings in DB. Mode: ${zainpayConfig.isLive ? 'LIVE' : 'SANDBOX'}`);
                    logger.info(`DB BaseURL: ${zainpayConfig.baseUrl}`);

                    this.publicKey = zainpayConfig.apiKey;
                    this.baseUrl = zainpayConfig.baseUrl;
                    this.secretKey = zainpayConfig.secretKey;

                    this.initializeClient();
                } else {
                    logger.warn('Zainpay settings in DB are incomplete (missing apiKey or baseUrl). Using defaults/env.');
                }
            } else {
                logger.info('No Zainpay settings found in DB. Using defaults/env.');
            }
        } catch (error) {
            logger.error('Failed to refresh Zainpay config', error);
        }
    }

    // ==================== ZAINBOX OPERATIONS ====================

    /**
     * Create a new Zainbox
     */
    async createZainbox(payload: CreateZainboxPayload): Promise<ZainpayResponse<Zainbox>> {
        const response = await this.client.post('/zainbox/create/request', payload);
        return response.data;
    }

    /**
     * Get all Zainboxes
     */
    async listZainboxes(): Promise<ZainpayResponse<Zainbox[]>> {
        const response = await this.client.get('/zainbox/list');
        return response.data;
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
        const response = await this.client.patch('/zainbox/update', payload);
        return response.data;
    }

    /**
     * Get all virtual accounts linked to a zainbox
     */
    async getZainboxAccounts(zainboxCode: string): Promise<ZainpayResponse<{ bankAccount: string; bankName: string; name: string }[]>> {
        const response = await this.client.get(`/zainbox/virtual-accounts/${zainboxCode}`);
        return response.data;
    }

    /**
     * Get all account balances for a zainbox
     */
    async getZainboxAccountBalances(zainboxCode: string): Promise<ZainpayResponse<VirtualAccountBalance[]>> {
        const response = await this.client.get(`/zainbox/accounts/balance/${zainboxCode}`);
        return response.data;
    }

    /**
     * Get zainbox transaction history
     */
    async getZainboxTransactions(zainboxCode: string): Promise<ZainpayResponse<AccountTransaction[]>> {
        const response = await this.client.get(`/zainbox/transactions/${zainboxCode}`);
        return response.data;
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

        const response = await this.client.get(url);
        return response.data;
    }

    /**
     * Get zainbox profile and billing plan
     */
    async getZainboxProfile(zainboxCode: string): Promise<ZainpayResponse<{
        zainbox: Zainbox;
        account2AccountBilling: { fixedCharge: string; percentageCharge: number };
        interBankBilling: { fixedCharge: string; percentageCharge: number };
    }>> {
        const response = await this.client.get(`/zainbox/profile/${zainboxCode}`);
        return response.data;
    }

    // ==================== VIRTUAL ACCOUNT OPERATIONS ====================

    /**
     * Create a static virtual account
     */
    async createVirtualAccount(payload: CreateVirtualAccountPayload): Promise<ZainpayResponse<VirtualAccountResponse>> {
        const response = await this.client.post('/virtual-account/create/request', payload);
        return response.data;
    }

    /**
     * Create a dynamic virtual account (temporary)
     */
    async createDynamicVirtualAccount(payload: CreateDynamicVirtualAccountPayload): Promise<ZainpayResponse<DynamicVirtualAccountResponse>> {
        const response = await this.client.post('/virtual-account/dynamic/create/request', payload);
        return response.data;
    }

    /**
     * Get virtual account balance
     */
    async getVirtualAccountBalance(accountNumber: string): Promise<ZainpayResponse<VirtualAccountBalance>> {
        const response = await this.client.get(`/virtual-account/wallet/balance/${accountNumber}`);
        return response.data;
    }

    /**
     * Update virtual account status (activate/deactivate)
     */
    async updateVirtualAccountStatus(
        zainboxCode: string,
        accountNumber: string,
        status: boolean
    ): Promise<ZainpayResponse> {
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
    async getVirtualAccountTransactions(accountNumber: string): Promise<ZainpayResponse<AccountTransaction[]>> {
        const response = await this.client.get(`/virtual-account/wallet/transactions/${accountNumber}`);
        return response.data;
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
        const response = await this.client.get(`/virtual-account/dynamic/deposit/status/${txnRef}`);
        return response.data;
    }

    // ==================== BANK OPERATIONS ====================

    /**
     * Get list of available banks
     */
    async getBankList(): Promise<ZainpayResponse<Bank[]>> {
        const response = await this.client.get('/bank/list');
        return response.data;
    }

    /**
     * Validate bank account (Name Enquiry)
     */
    async nameEnquiry(bankCode: string, accountNumber: string): Promise<ZainpayResponse<NameEnquiryResponse>> {
        const response = await this.client.get(`/bank/name-enquiry?bankCode=${bankCode}&accountNumber=${accountNumber}`);
        return response.data;
    }

    // ==================== FUND TRANSFER OPERATIONS ====================

    /**
     * Transfer funds (wallet-to-wallet or wallet-to-bank)
     */
    async fundTransfer(payload: FundTransferPayload): Promise<ZainpayResponse<FundTransferResponse>> {
        const response = await this.client.post('/bank/transfer/v2', payload);
        return response.data;
    }

    /**
     * Verify transfer status
     */
    async verifyTransfer(txnRef: string): Promise<ZainpayResponse<TransferVerificationResponse>> {
        const response = await this.client.get(`/virtual-account/wallet/transaction/verify/${txnRef}`);
        return response.data;
    }

    /**
     * Verify deposit
     */
    async verifyDeposit(txnRef: string): Promise<ZainpayResponse<DepositVerificationResponse>> {
        const response = await this.client.get(`/virtual-account/wallet/deposit/verify/v2/${txnRef}`);
        return response.data;
    }

    // ==================== SETTLEMENT OPERATIONS ====================

    /**
     * Create a scheduled settlement
     */
    async createSettlement(payload: CreateSettlementPayload): Promise<ZainpayResponse> {
        const response = await this.client.post('/zainbox/settlement', payload);
        return response.data;
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
        const response = await this.client.get(`/zainbox/settlement?zainboxCode=${zainboxCode}`);
        return response.data;
    }

    // ==================== MERCHANT OPERATIONS ====================

    /**
     * Get merchant transactions
     */
    async getMerchantTransactions(count: number = 20): Promise<ZainpayResponse<AccountTransaction[]>> {
        const response = await this.client.get(`/zainbox/transactions?count=${count}`);
        return response.data;
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

        const response = await this.client.get(`/virtual-account/wallet/transaction/reconcile/bank-deposit?${queryParams.toString()}`);
        return response.data;
    }
}

// Export singleton instance
export const zainpayService = new ZainpayService();
export default zainpayService;
