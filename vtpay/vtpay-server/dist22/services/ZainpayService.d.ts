import { ZainpayResponse, CreateZainboxPayload, Zainbox, CreateVirtualAccountPayload, VirtualAccountResponse, CreateDynamicVirtualAccountPayload, DynamicVirtualAccountResponse, VirtualAccountBalance, AccountTransaction, Bank, NameEnquiryResponse, FundTransferPayload, FundTransferResponse, TransferVerificationResponse, DepositVerificationResponse, CreateSettlementPayload } from '../types/zainpay';
export declare class ZainpayService {
    private client;
    private baseUrl;
    private publicKey;
    private secretKey;
    constructor();
    private initializeClient;
    /**
     * Refresh configuration from SystemSetting
     */
    refreshConfig(): Promise<void>;
    /**
     * Create a new Zainbox
     */
    createZainbox(payload: CreateZainboxPayload): Promise<ZainpayResponse<Zainbox>>;
    /**
     * Get all Zainboxes
     */
    listZainboxes(): Promise<ZainpayResponse<Zainbox[]>>;
    /**
     * Update a Zainbox
     */
    updateZainbox(payload: {
        name: string;
        codeName: string;
        tags?: string;
        callbackUrl?: string;
        emailNotification?: string;
    }): Promise<ZainpayResponse>;
    /**
     * Get all virtual accounts linked to a zainbox
     */
    getZainboxAccounts(zainboxCode: string): Promise<ZainpayResponse<{
        bankAccount: string;
        bankName: string;
        name: string;
    }[]>>;
    /**
     * Get all account balances for a zainbox
     */
    getZainboxAccountBalances(zainboxCode: string): Promise<ZainpayResponse<VirtualAccountBalance[]>>;
    /**
     * Get zainbox transaction history
     */
    getZainboxTransactions(zainboxCode: string): Promise<ZainpayResponse<AccountTransaction[]>>;
    /**
     * Get total payment collected by zainbox
     */
    getZainboxPaymentSummary(zainboxCode: string, dateFrom?: string, dateTo?: string): Promise<ZainpayResponse<{
        count: number;
        total: string;
        transactionType: string;
    }[]>>;
    /**
     * Get zainbox profile and billing plan
     */
    getZainboxProfile(zainboxCode: string): Promise<ZainpayResponse<{
        zainbox: Zainbox;
        account2AccountBilling: {
            fixedCharge: string;
            percentageCharge: number;
        };
        interBankBilling: {
            fixedCharge: string;
            percentageCharge: number;
        };
    }>>;
    /**
     * Create a static virtual account
     */
    createVirtualAccount(payload: CreateVirtualAccountPayload): Promise<ZainpayResponse<VirtualAccountResponse>>;
    /**
     * Create a dynamic virtual account (temporary)
     */
    createDynamicVirtualAccount(payload: CreateDynamicVirtualAccountPayload): Promise<ZainpayResponse<DynamicVirtualAccountResponse>>;
    /**
     * Get virtual account balance
     */
    getVirtualAccountBalance(accountNumber: string): Promise<ZainpayResponse<VirtualAccountBalance>>;
    /**
     * Update virtual account status (activate/deactivate)
     */
    updateVirtualAccountStatus(zainboxCode: string, accountNumber: string, status: boolean): Promise<ZainpayResponse>;
    /**
     * Get virtual account transactions
     */
    getVirtualAccountTransactions(accountNumber: string): Promise<ZainpayResponse<AccountTransaction[]>>;
    /**
     * Get DVA deposit status
     */
    getDynamicVirtualAccountStatus(txnRef: string): Promise<ZainpayResponse<{
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
    }>>;
    /**
     * Get list of available banks
     */
    getBankList(): Promise<ZainpayResponse<Bank[]>>;
    /**
     * Validate bank account (Name Enquiry)
     */
    nameEnquiry(bankCode: string, accountNumber: string): Promise<ZainpayResponse<NameEnquiryResponse>>;
    /**
     * Transfer funds (wallet-to-wallet or wallet-to-bank)
     */
    fundTransfer(payload: FundTransferPayload): Promise<ZainpayResponse<FundTransferResponse>>;
    /**
     * Verify transfer status
     */
    verifyTransfer(txnRef: string): Promise<ZainpayResponse<TransferVerificationResponse>>;
    /**
     * Verify deposit
     */
    verifyDeposit(txnRef: string): Promise<ZainpayResponse<DepositVerificationResponse>>;
    /**
     * Create a scheduled settlement
     */
    createSettlement(payload: CreateSettlementPayload): Promise<ZainpayResponse>;
    /**
     * Get settlement details
     */
    getSettlement(zainboxCode: string): Promise<ZainpayResponse<{
        name: string;
        schedulePeriod: string;
        scheduleType: string;
        settlementAccounts: {
            accountNumber: string;
            bankCode: string;
            percentage: string;
        }[];
        zainbox: string;
    }>>;
    /**
     * Get merchant transactions
     */
    getMerchantTransactions(count?: number): Promise<ZainpayResponse<AccountTransaction[]>>;
    /**
     * Reconcile bank deposit
     */
    reconcileBankDeposit(params: {
        sessionId?: string;
        verificationType: 'depositReferenceNumber' | 'depositAccountNumber';
        bankType: string;
        accountNumber: string;
    }): Promise<ZainpayResponse<DepositVerificationResponse>>;
}
export declare const zainpayService: ZainpayService;
export default zainpayService;
//# sourceMappingURL=ZainpayService.d.ts.map