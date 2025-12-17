import crypto from 'crypto';
import axios from 'axios';
import config from '../config';
import { VirtualAccount, Zainbox } from '../models';
import { walletService } from './WalletService';
import { WebhookEvent, WebhookDepositEvent, WebhookTransferSuccessEvent, WebhookTransferFailedEvent } from '../types/zainpay';

export class WebhookService {
    private secretKey: string;
    private vtpayWebhookSecret: string;

    constructor() {
        this.secretKey = config.zainpay.secretKey;
        this.vtpayWebhookSecret = process.env.VTPAY_WEBHOOK_SECRET || 'default-vtpay-webhook-secret';
    }

    /**
     * Verify webhook signature using HMAC-SHA256
     */
    verifySignature(payload: string, signature: string): boolean {
        if (!signature) {
            console.error('No signature provided');
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', this.secretKey)
            .update(payload)
            .digest('hex');

        return signature === expectedSignature;
    }

    /**
     * Process incoming webhook event
     */
    async processWebhook(event: WebhookEvent): Promise<{ success: boolean; message: string }> {
        console.log(`Processing webhook event: ${event.event}`);
        console.log('Webhook data:', JSON.stringify(event.data, null, 2));

        try {
            let result;
            switch (event.event) {
                case 'deposit.success':
                    result = await this.handleDepositSuccess(event as WebhookDepositEvent);
                    break;

                case 'transfer.success':
                    result = await this.handleTransferSuccess(event as WebhookTransferSuccessEvent);
                    break;

                case 'transfer.failed':
                    result = await this.handleTransferFailed(event as WebhookTransferFailedEvent);
                    break;

                default:
                    console.warn(`Unknown webhook event type: ${(event as any).event}`);
                    result = { success: false, message: `Unknown event type: ${(event as any).event}` };
            }

            // Dispatch to tenant regardless of internal processing result (unless it was an unknown event)
            if (event.event === 'deposit.success' || event.event === 'transfer.success' || event.event === 'transfer.failed') {
                await this.dispatchWebhookToTenant(event);
            }

            return result;
        } catch (error) {
            console.error('Error processing webhook:', error);
            return { success: false, message: 'Error processing webhook' };
        }
    }

    /**
     * Dispatch webhook to tenant's callback URL
     */
    private async dispatchWebhookToTenant(event: WebhookEvent): Promise<void> {
        try {
            const zainboxCode = event.data.zainboxCode;
            if (!zainboxCode) {
                console.warn('No zainboxCode in webhook event, cannot dispatch to tenant');
                return;
            }

            const zainbox = await Zainbox.findOne({ zainboxCode });
            if (!zainbox || !zainbox.callbackUrl) {
                console.warn(`No Zainbox or callback URL found for code: ${zainboxCode}`);
                return;
            }

            console.log(`Dispatching webhook to tenant: ${zainbox.callbackUrl}`);

            const payload = JSON.stringify(event);
            const signature = crypto
                .createHmac('sha256', this.vtpayWebhookSecret)
                .update(payload)
                .digest('hex');

            await axios.post(zainbox.callbackUrl, event, {
                headers: {
                    'Content-Type': 'application/json',
                    'VTPay-Signature': signature,
                    'User-Agent': 'VTPay-Webhook-Dispatcher/1.0',
                },
                timeout: 5000, // 5 seconds timeout
            });

            console.log('Webhook dispatched successfully');
        } catch (error: any) {
            console.error('Failed to dispatch webhook to tenant:', error.message);
            // We don't throw here to avoid failing the original request from Zainpay
        }
    }

    /**
     * Handle deposit success event
     */
    private async handleDepositSuccess(event: WebhookDepositEvent): Promise<{ success: boolean; message: string }> {
        const { data } = event;

        // Find the virtual account by account number
        const virtualAccount = await VirtualAccount.findOne({
            accountNumber: data.beneficiaryAccountNumber,
        });

        if (!virtualAccount) {
            console.error(`Virtual account not found: ${data.beneficiaryAccountNumber}`);
            return { success: false, message: 'Virtual account not found' };
        }

        // Check if this transaction has already been processed
        const existingTransaction = await walletService.getTransactionByExternalRef(data.txnRef);
        if (existingTransaction) {
            console.log(`Transaction already processed: ${data.txnRef}`);
            return { success: true, message: 'Transaction already processed' };
        }

        // Credit the user's wallet
        // Amount is in kobo in the new webhook format
        const amountInKobo = parseInt(data.amountAfterCharges, 10);

        await walletService.creditWallet(
            virtualAccount.userId.toString(),
            amountInKobo,
            'deposit',
            data.narration || `Deposit from ${data.senderName}`,
            data.txnRef,
            {
                sender: data.sender,
                senderName: data.senderName,
                bankName: data.bankName,
                paymentRef: data.paymentRef,
                depositedAmount: data.depositedAmount,
                txnChargesAmount: data.txnChargesAmount,
                zainboxCode: data.zainboxCode,
                paymentDate: data.paymentDate,
            },
            virtualAccount.reference // Pass the customer reference
        );

        console.log(`Successfully credited wallet for user ${virtualAccount.userId} with ${amountInKobo} kobo`);
        return { success: true, message: 'Deposit processed successfully' };
    }

    /**
     * Handle transfer success event
     */
    private async handleTransferSuccess(event: WebhookTransferSuccessEvent): Promise<{ success: boolean; message: string }> {
        const { data } = event;

        // Find the virtual account by account number
        const virtualAccount = await VirtualAccount.findOne({
            accountNumber: data.accountNumber,
        });

        if (!virtualAccount) {
            console.error(`Virtual account not found: ${data.accountNumber}`);
            return { success: false, message: 'Virtual account not found' };
        }

        // Update the pending transaction status to success
        const transaction = await walletService.getTransactionByExternalRef(data.txnRef);
        if (transaction) {
            await walletService.updateTransactionStatus(transaction.reference, 'success', {
                paymentRef: data.paymentRef,
                beneficiaryAccountNumber: data.beneficiaryAccountNumber,
                beneficiaryBankCode: data.beneficiaryBankCode,
                txnDate: data.txnDate,
            });
        }

        console.log(`Transfer success processed for txnRef: ${data.txnRef}`);
        return { success: true, message: 'Transfer success processed' };
    }

    /**
     * Handle transfer failed event
     */
    private async handleTransferFailed(event: WebhookTransferFailedEvent): Promise<{ success: boolean; message: string }> {
        const { data } = event;

        // Find the virtual account by account number
        const virtualAccount = await VirtualAccount.findOne({
            accountNumber: data.accountNumber,
        });

        if (!virtualAccount) {
            console.error(`Virtual account not found: ${data.accountNumber}`);
            return { success: false, message: 'Virtual account not found' };
        }

        // Find the pending transaction and refund
        const transaction = await walletService.getTransactionByExternalRef(data.internalTxnRef);
        if (transaction && transaction.status === 'pending') {
            // Update transaction status to failed
            await walletService.updateTransactionStatus(transaction.reference, 'failed', {
                failureReason: 'Transfer failed',
                beneficiaryAccountNumber: data.beneficiaryAccountNumber,
                beneficiaryBankCode: data.beneficiaryBankCode,
                txnDate: data.txnDate,
            });

            // Refund the amount to the user's wallet
            const refundAmount = data.amount.amount;
            await walletService.creditWallet(
                virtualAccount.userId.toString(),
                refundAmount,
                'refund',
                `Refund for failed transfer to ${data.beneficiaryAccountNumber}`,
                `REFUND-${data.internalTxnRef}`,
                {
                    originalTxnRef: data.internalTxnRef,
                    beneficiaryAccountNumber: data.beneficiaryAccountNumber,
                    beneficiaryBankCode: data.beneficiaryBankCode,
                }
            );

            console.log(`Refunded ${refundAmount} kobo for failed transfer: ${data.internalTxnRef}`);
        }

        return { success: true, message: 'Transfer failure processed and refunded' };
    }
}

export const webhookService = new WebhookService();
export default webhookService;
