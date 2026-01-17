export interface ZainpayResponse<T = any> {
    code: string;
    data?: T;
    description: string;
    status: string;
}
export interface CreateZainboxPayload {
    name: string;
    callbackUrl: string;
    emailNotification?: string;
    description?: string;
    tags?: string;
    codeNamePrefix?: string;
    allowAutoInternalTransfer?: boolean;
}
export interface Zainbox {
    callbackUrl: string;
    codeName: string;
    emailNotification?: string;
    name: string;
    tags?: string;
    zainboxCode?: string;
    isActive?: boolean;
    isLive?: boolean;
}
export interface CreateVirtualAccountPayload {
    bankType: string;
    firstName: string;
    surname: string;
    email: string;
    mobileNumber: string;
    dob: string;
    gender: 'M' | 'F';
    address: string;
    title: string;
    state: string;
    bvn: string;
    zainboxCode: string;
}
export interface VirtualAccountResponse {
    bankName: string;
    email: string;
    accountName: string;
    accountType: string;
    accountNumber: string;
}
export interface CreateDynamicVirtualAccountPayload {
    bankType: string;
    email: string;
    amount: string;
    zainboxCode: string;
    txnRef: string;
    duration: number;
    accountName: string;
    callBackUrl: string;
}
export interface DynamicVirtualAccountResponse {
    accountName: string;
    accountNumber: string;
    amount: string;
    bankName: string;
    duration: number;
    email: string;
    paymentStatus: 'pending' | 'success' | 'mismatch' | 'expired';
    totalAmount: string;
    txnFee: string;
    txnRef: string;
}
export interface VirtualAccountBalance {
    accountName: string;
    accountNumber: string;
    balanceAmount: number;
    transactionDate: string;
}
export interface AccountTransaction {
    accountNumber: string;
    destinationAccountNumber?: string;
    amount: number;
    balance: number;
    narration: string;
    transactionDate: string;
    transactionRef: string;
    transactionType: 'deposit' | 'transfer';
}
export interface Bank {
    code: string;
    name: string;
}
export interface NameEnquiryResponse {
    accountName: string;
    accountNumber: string;
    bankCode: string;
    bankName: string;
}
export interface FundTransferPayload {
    destinationAccountNumber: string;
    destinationBankCode: string;
    amount: string;
    sourceAccountNumber: string;
    sourceBankCode: string;
    zainboxCode: string;
    txnRef: string;
    narration: string;
    callbackUrl?: string;
}
export interface FundTransferResponse {
    amount: string;
    callBackUrl?: string;
    destinationAccountName: string;
    destinationAccountNumber: string;
    destinationBankCode: string;
    narration: string;
    paymentRef: string;
    sourceAccountNumber: string;
    sourceBankAccountName: string;
    sourceBankCode: string;
    status: string;
    totalTxnAmount: string;
    txnFee: string;
    txnRef: string;
    zainboxCode: string;
}
export interface TransferVerificationResponse {
    amount: string;
    destinationAccountNumber: string;
    destinationBankCode: string;
    narration: string;
    paymentRef: string;
    sourceAccountNumber: string;
    txnDate: string;
    txnRef: string;
    txnStatus: 'success' | 'failed' | 'pending';
}
export interface DepositVerificationResponse {
    amountAfterCharges: number;
    bankName: string;
    beneficiaryAccountName: string;
    beneficiaryAccountNumber: string;
    narration: string;
    paymentDate: string;
    paymentRef: string;
    sender: string;
    senderName: string;
    txnDate: string;
    txnRef: string;
    txnType: string;
    zainboxCode: string;
    zainboxName: string;
}
export interface SettlementAccount {
    accountNumber: string;
    bankCode: string;
    percentage: string;
}
export interface CreateSettlementPayload {
    name: string;
    zainboxCode: string;
    scheduleType: 'T1' | 'T7' | 'T30';
    schedulePeriod: string;
    settlementAccountList: SettlementAccount[];
    status: boolean;
}
export interface WebhookDepositEvent {
    event: 'deposit.success';
    data: {
        depositedAmount: string;
        txnChargesAmount: string;
        amountAfterCharges: string;
        bankName: string;
        beneficiaryAccountName: string;
        beneficiaryAccountNumber: string;
        narration: string;
        paymentDate: string;
        paymentRef: string;
        sender: string;
        senderName: string;
        txnDate: string;
        txnRef: string;
        txnType: string;
        zainboxCode: string;
        callBackUrl: string;
        emailNotification: string;
        zainboxName: string;
    };
}
export interface WebhookTransferSuccessEvent {
    event: 'transfer.success';
    data: {
        accountNumber: string;
        amount: {
            amount: number;
        };
        beneficiaryAccountNumber: string;
        beneficiaryBankCode: string;
        narration: string;
        paymentRef: string;
        txnDate: string;
        txnRef: string;
        txnType: string;
        zainboxCode: string;
    };
}
export interface WebhookTransferFailedEvent {
    event: 'transfer.failed';
    data: {
        accountNumber: string;
        amount: {
            amount: number;
        };
        beneficiaryAccountName: string;
        beneficiaryAccountNumber: string;
        beneficiaryBankCode: string;
        internalTxnRef: string;
        txnDate: string;
        txnType: string;
        zainboxCode: string;
    };
}
export type WebhookEvent = WebhookDepositEvent | WebhookTransferSuccessEvent | WebhookTransferFailedEvent;
//# sourceMappingURL=zainpay.d.ts.map