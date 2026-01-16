import { WebhookEvent } from '../types/zainpay';
export declare class WebhookService {
    private secretKey;
    private vtpayWebhookSecret;
    constructor();
    /**
     * Verify webhook signature using HMAC-SHA256
     */
    verifySignature(payload: string, signature: string): boolean;
    /**
     * Process incoming webhook event
     */
    processWebhook(event: WebhookEvent): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Dispatch webhook to tenant's callback URL
     */
    private dispatchWebhookToTenant;
    /**
     * Handle deposit success event
     */
    private handleDepositSuccess;
    /**
     * Handle transfer success event
     */
    private handleTransferSuccess;
    /**
     * Handle transfer failed event
     */
    private handleTransferFailed;
}
export declare const webhookService: WebhookService;
export default webhookService;
//# sourceMappingURL=WebhookService.d.ts.map