export declare class PayoutService {
    /**
     * Calculate payout fees
     */
    calculateFees(amount: number, isInternal: boolean): Promise<{
        fee: number;
        payrantFee: number;
        totalDebit: number;
        vtpayFee: number;
        zainpayPercentFee: number;
        zainpayFixedFee: number;
        totalDeducted: number;
        netAmount: number;
    }>;
    /**
     * Initiate a payout request
     */
    initiatePayout(userId: string, amount: number, details: {
        bankCode: string;
        accountNumber: string;
        accountName: string;
    }): Promise<any>;
    /**
     * Process a payout (send to Payrant)
     * @param payoutId The ID of the payout
     * @param throwOnError If true, wil re-throw errors instead of just logging them (used for synchronous API calls)
     */
    processPayout(payoutId: string, throwOnError?: boolean): Promise<any>;
    /**
     * Handle Payout Success (Webhook or Polling)
     */
    handlePayoutSuccess(payout: any, externalAmount?: number): Promise<void>;
    /**
     * Handle Payout Failure (Webhook or Polling)
     */
    handlePayoutFailure(payout: any, reason: string, skipRefund?: boolean): Promise<void>;
    /**
     * Process Settlements (Pending -> Cleared)
     */
    processSettlements(): Promise<void>;
    /**
     * Reconcile Payouts (Bounded Polling)
     */
    reconcilePayouts(): Promise<void>;
    /**
     * Send payout success notification email
     */
    private sendPayoutSuccessNotification;
}
export declare const payoutService: PayoutService;
export default payoutService;
//# sourceMappingURL=PayoutService.d.ts.map