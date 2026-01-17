import { Payout } from '../models';
export declare class PayoutService {
    /**
     * Initiate a payout request
     */
    initiatePayout(userId: string, amount: number, bankDetails: {
        bankCode: string;
        accountNumber: string;
        accountName: string;
    }): Promise<typeof Payout.prototype>;
    /**
     * Process a payout (send to Zainpay)
     */
    processPayout(payoutId: string): Promise<void>;
    /**
     * Handle payout failure (refund funds)
     */
    handlePayoutFailure(payout: any, reason: string): Promise<void>;
    /**
     * Handle payout success (finalize)
     */
    handlePayoutSuccess(payout: any, externalAmount?: number): Promise<void>;
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