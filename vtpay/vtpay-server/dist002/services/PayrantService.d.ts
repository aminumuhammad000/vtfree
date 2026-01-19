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
        transfer_id: string;
        status: string;
        fee: number;
        amount: number;
        reference: string;
    };
}
export declare class PayrantService {
    private client;
    private baseUrl;
    private apiKey;
    constructor();
    private initializeClient;
    refreshConfig(): Promise<void>;
    transfer(payload: PayrantTransferPayload): Promise<PayrantTransferResponse>;
    verifyTransfer(transferId: string): Promise<any>;
}
export declare const payrantService: PayrantService;
export default payrantService;
//# sourceMappingURL=PayrantService.d.ts.map