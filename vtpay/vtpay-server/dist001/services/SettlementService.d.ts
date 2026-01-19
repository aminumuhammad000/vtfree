export declare class SettlementService {
    /**
     * Handle Zainpay settlement webhook
     * This clears pending balances for all users whose transactions were part of this settlement.
     */
    handleSettlementWebhook(payload: any): Promise<void>;
}
export declare const settlementService: SettlementService;
export default settlementService;
//# sourceMappingURL=SettlementService.d.ts.map