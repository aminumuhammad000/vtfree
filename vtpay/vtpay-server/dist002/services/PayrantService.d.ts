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
export declare class PayrantService {
    private client;
    private baseUrl;
    private apiKey;
    constructor();
    private initializeClient;
    refreshConfig(): Promise<void>;
    /**
     * Get list of supported banks
     * GET /payout/banks_list/
     */
    getBanksList(): Promise<PayrantBank[]>;
    /**
     * Validate account details
     * POST /payout/validate_account/
     */
    validateAccount(bankCode: string, accountNumber: string): Promise<PayrantAccountValidation>;
    /**
     * Initiate bank transfer
     * POST /payout/transfer
     */
    transfer(payload: PayrantTransferPayload): Promise<PayrantTransferResponse>;
    /**
     * Verify Transfer
     */
    verifyTransfer(reference: string): Promise<PayrantTransferResponse>;
}
export declare const payrantService: PayrantService;
export default payrantService;
//# sourceMappingURL=PayrantService.d.ts.map