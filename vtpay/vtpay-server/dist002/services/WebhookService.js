"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookService = exports.WebhookService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
const models_1 = require("../models");
const WalletService_1 = require("./WalletService");
const EmailService_1 = require("./EmailService");
const PayoutService_1 = require("./PayoutService");
class WebhookService {
    constructor() {
        this.secretKey = config_1.default.zainpay.secretKey;
        this.vtpayWebhookSecret = process.env.VTPAY_WEBHOOK_SECRET || 'default-vtpay-webhook-secret';
    }
    /**
     * Verify webhook signature using HMAC-SHA256
     */
    verifySignature(payload, signature) {
        if (!signature) {
            logger_1.logger.error('No signature provided');
            return false;
        }
        const expectedSignature = crypto_1.default
            .createHmac('sha256', this.secretKey)
            .update(payload)
            .digest('hex');
        return signature === expectedSignature;
    }
    /**
     * Process incoming webhook event
     */
    async processWebhook(event) {
        logger_1.logger.info(`Processing webhook event: ${event.event}`);
        logger_1.logger.debug('Webhook data', event.data);
        try {
            // Log incoming Zainpay webhook
            const zainboxCode = event.data.zainboxCode;
            const zainbox = zainboxCode ? await models_1.Zainbox.findOne({ zainboxCode }) : null;
            if (zainbox) {
                zainbox.lastTransactionAt = new Date();
                zainbox.totalTransactions = (zainbox.totalTransactions || 0) + 1;
                if (event.event === 'deposit.success') {
                    const amount = parseInt(event.data.amountAfterCharges, 10);
                    zainbox.totalVolume = (zainbox.totalVolume || 0) + amount;
                }
                await zainbox.save();
            }
            await models_1.WebhookLog.create({
                source: 'zainpay',
                eventType: event.event,
                userId: zainbox?.userId,
                zainboxCode,
                payload: event,
                signature: 'verified', // Signature is verified in middleware
                signatureValid: true,
            });
            let result;
            switch (event.event) {
                case 'deposit.success':
                    result = await this.handleDepositSuccess(event);
                    break;
                case 'transfer.success':
                    result = await this.handleTransferSuccess(event);
                    break;
                case 'transfer.failed':
                    result = await this.handleTransferFailed(event);
                    break;
                default:
                    logger_1.logger.warn(`Unknown webhook event type: ${event.event}`);
                    result = { success: false, message: `Unknown event type: ${event.event}` };
            }
            // Dispatch to tenant regardless of internal processing result (unless it was an unknown event)
            if (event.event === 'deposit.success' || event.event === 'transfer.success' || event.event === 'transfer.failed') {
                await this.dispatchWebhookToTenant(event);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error processing webhook', error);
            return { success: false, message: 'Error processing webhook' };
        }
    }
    /**
     * Dispatch webhook to tenant's callback URL
     */
    async dispatchWebhookToTenant(event) {
        try {
            const zainboxCode = event.data.zainboxCode;
            if (!zainboxCode) {
                logger_1.logger.warn('No zainboxCode in webhook event, cannot dispatch to tenant');
                return;
            }
            // Find Zainbox and its owner
            const zainbox = await models_1.Zainbox.findOne({ zainboxCode });
            if (!zainbox) {
                logger_1.logger.warn(`No Zainbox found for code: ${zainboxCode}`);
                return;
            }
            const user = await models_1.User.findById(zainbox.userId);
            if (!user) {
                logger_1.logger.warn(`No User found for Zainbox: ${zainboxCode}`);
                return;
            }
            if (!user.webhookUrl) {
                logger_1.logger.info(`User ${user.email} has no webhook URL configured, skipping dispatch`);
                return;
            }
            const payload = JSON.stringify(event);
            const signature = crypto_1.default
                .createHmac('sha256', this.vtpayWebhookSecret)
                .update(payload)
                .digest('hex');
            const log = await models_1.WebhookLog.create({
                source: 'vtpay',
                eventType: event.event,
                userId: user._id,
                zainboxCode,
                payload: event,
                signature,
                signatureValid: true,
                dispatchStatus: 'pending',
                dispatchAttempts: 1,
            });
            try {
                logger_1.logger.info(`Forwarding webhook to tenant ${user.email} at ${user.webhookUrl}`);
                const response = await axios_1.default.post(user.webhookUrl, event, {
                    headers: {
                        'Content-Type': 'application/json',
                        'VTPay-Signature': signature,
                        'User-Agent': 'VTPay-Webhook-Dispatcher/1.0',
                    },
                    timeout: 10000, // 10 seconds timeout
                });
                log.dispatchStatus = 'success';
                log.responseStatus = response.status;
                log.responseBody = typeof response.data === 'object' ? JSON.stringify(response.data) : String(response.data);
                await log.save();
                logger_1.logger.info(`Webhook successfully dispatched to ${user.webhookUrl}`);
            }
            catch (error) {
                log.dispatchStatus = 'failed';
                log.responseStatus = error.response?.status;
                log.responseBody = error.response?.data ?
                    (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data))
                    : error.message;
                await log.save();
                logger_1.logger.error(`Failed to dispatch webhook to ${user.webhookUrl}`, error.message);
                // Send failure notification email
                await EmailService_1.emailService.sendWebhookFailureNotification(user.email, user.firstName || 'User', user.webhookUrl, error.message);
            }
        }
        catch (error) {
            logger_1.logger.error('Error in dispatchWebhookToTenant', error.message);
        }
    }
    /**
     * Handle deposit success event
     */
    async handleDepositSuccess(event) {
        const { data } = event;
        // Find the virtual account by account number
        const virtualAccount = await models_1.VirtualAccount.findOne({
            accountNumber: data.beneficiaryAccountNumber,
        });
        if (!virtualAccount) {
            logger_1.logger.error(`Virtual account not found: ${data.beneficiaryAccountNumber}`);
            return { success: false, message: 'Virtual account not found' };
        }
        // Check if this transaction has already been processed (Idempotency)
        const existingTransaction = await WalletService_1.walletService.getTransactionByExternalRef(data.txnRef);
        if (existingTransaction) {
            logger_1.logger.info(`Transaction already processed: ${data.txnRef}`);
            return { success: true, message: 'Transaction already processed' };
        }
        const depositedAmount = parseInt(data.depositedAmount, 10);
        // Fetch system settings for fee configuration
        const { SystemSetting } = await Promise.resolve().then(() => __importStar(require('../models/SystemSetting')));
        const settings = await SystemSetting.findOne();
        // Default to 2.0% if not set
        const userFeePercent = settings?.deposit?.vtpayFeePercent ?? 2.0;
        // Calculate fees
        // Zainpay fee is fixed at 1.4% (Cost to VTPay)
        const zainpayFee = Math.floor(depositedAmount * 0.014);
        // User fee is what the user sees deducted (e.g. 2%)
        const userFee = Math.floor(depositedAmount * (userFeePercent / 100));
        // VTPay Revenue = User Fee - Zainpay Cost
        // If User Fee < Zainpay Cost, this will be negative (subsidized)
        const vtpayFee = userFee - zainpayFee;
        const amountToCredit = depositedAmount - userFee;
        const zainpaySettlement = depositedAmount - zainpayFee;
        const transaction = await WalletService_1.walletService.creditWallet(virtualAccount.userId.toString(), amountToCredit, 'deposit', data.narration || `Deposit from ${data.senderName}`, data.txnRef, {
            sender: data.sender,
            senderName: data.senderName,
            bankName: data.bankName,
            paymentRef: data.paymentRef,
            depositedAmount: data.depositedAmount,
            txnChargesAmount: data.txnChargesAmount,
            zainboxCode: data.zainboxCode,
            paymentDate: data.paymentDate,
            originalAmountAfterCharges: data.amountAfterCharges,
            vtpayFee: vtpayFee,
            zainpayFee: zainpayFee,
            zainpaySettlement: zainpaySettlement,
            grossInflow: depositedAmount,
            breakdown: {
                grossInflow: depositedAmount,
                zainpayFee: zainpayFee,
                vtpayFee: vtpayFee,
                userCredit: amountToCredit,
                zainpaySettlement: zainpaySettlement,
                vtpayRevenue: vtpayFee
            }
        }, virtualAccount.reference, // Pass the customer reference
        userFee, // Pass the total fee deducted (User Fee)
        false // isCleared = false for deposits (settlement rule)
        );
        // Send email notification to user
        const user = await models_1.User.findById(virtualAccount.userId);
        if (user) {
            await EmailService_1.emailService.sendTransactionNotification(user.email, user.firstName || 'User', transaction);
        }
        logger_1.logger.info(`Successfully credited wallet for user ${virtualAccount.userId} with ${amountToCredit} kobo (Fees: Zainpay=${zainpayFee}, VTpay=${vtpayFee})`);
        return { success: true, message: 'Deposit processed successfully' };
    }
    /**
     * Handle transfer success event
     */
    async handleTransferSuccess(event) {
        const { data } = event;
        // 1. Check if it's a payout
        const payout = await models_1.Payout.findOne({ reference: data.txnRef });
        if (payout) {
            // Defensive Check: Amount validation
            const externalAmount = data.amount.amount;
            await PayoutService_1.payoutService.handlePayoutSuccess(payout, externalAmount);
            return { success: true, message: 'Payout success processed' };
        }
        // 2. Handle other transfers (if any)
        const virtualAccount = await models_1.VirtualAccount.findOne({
            accountNumber: data.accountNumber,
        });
        if (!virtualAccount) {
            logger_1.logger.error(`Virtual account not found: ${data.accountNumber}`);
            return { success: false, message: 'Virtual account not found' };
        }
        // Update the pending transaction status to success
        const transaction = await WalletService_1.walletService.getTransactionByExternalRef(data.txnRef);
        if (transaction) {
            await WalletService_1.walletService.updateTransactionStatus(transaction.reference, 'success', {
                paymentRef: data.paymentRef,
                beneficiaryAccountNumber: data.beneficiaryAccountNumber,
                beneficiaryBankCode: data.beneficiaryBankCode,
                txnDate: data.txnDate,
            });
        }
        logger_1.logger.info(`Transfer success processed for txnRef: ${data.txnRef}`);
        return { success: true, message: 'Transfer success processed' };
    }
    /**
     * Handle transfer failed event
     */
    async handleTransferFailed(event) {
        const { data } = event;
        // 1. Check if it's a payout
        const payout = await models_1.Payout.findOne({ reference: data.internalTxnRef });
        if (payout) {
            await PayoutService_1.payoutService.handlePayoutFailure(payout, 'Transfer failed via webhook');
            return { success: true, message: 'Payout failure processed' };
        }
        // 2. Handle other transfers
        const virtualAccount = await models_1.VirtualAccount.findOne({
            accountNumber: data.accountNumber,
        });
        if (!virtualAccount) {
            logger_1.logger.error(`Virtual account not found: ${data.accountNumber}`);
            return { success: false, message: 'Virtual account not found' };
        }
        // Find the pending transaction and refund
        const transaction = await WalletService_1.walletService.getTransactionByExternalRef(data.internalTxnRef);
        if (transaction && transaction.status === 'pending') {
            // Update transaction status to failed
            await WalletService_1.walletService.updateTransactionStatus(transaction.reference, 'failed', {
                failureReason: 'Transfer failed',
                beneficiaryAccountNumber: data.beneficiaryAccountNumber,
                beneficiaryBankCode: data.beneficiaryBankCode,
                txnDate: data.txnDate,
            });
            // Refund the amount to the user's wallet
            const refundAmount = data.amount.amount;
            await WalletService_1.walletService.creditWallet(virtualAccount.userId.toString(), refundAmount, 'refund', `Refund for failed transfer to ${data.beneficiaryAccountNumber}`, `REFUND-${data.internalTxnRef}`, {
                originalTxnRef: data.internalTxnRef,
                beneficiaryAccountNumber: data.beneficiaryAccountNumber,
                beneficiaryBankCode: data.beneficiaryBankCode,
            });
            logger_1.logger.info(`Refunded ${refundAmount} kobo for failed transfer: ${data.internalTxnRef}`);
        }
        return { success: true, message: 'Transfer failure processed and refunded' };
    }
    /**
     * Handle Payrant inbound webhook (Virtual Account & Checkout)
     */
    async handlePayrantInbound(payload) {
        logger_1.logger.info(`Processing Payrant inbound webhook: ${payload.status}`);
        logger_1.logger.debug('Payrant payload', payload);
        try {
            const { status, transaction } = payload;
            if (status !== 'success') {
                logger_1.logger.warn(`Payrant inbound webhook status is not success: ${status}`);
                return { success: false, message: `Status is ${status}` };
            }
            if (!transaction || !transaction.reference) {
                logger_1.logger.error('Invalid Payrant payload: missing transaction or reference');
                return { success: false, message: 'Invalid payload' };
            }
            // Find the virtual account by reference (metadata.account_reference)
            const accountReference = transaction.metadata?.account_reference;
            if (!accountReference) {
                logger_1.logger.error('Payrant inbound webhook missing account_reference in metadata');
                return { success: false, message: 'Missing account_reference' };
            }
            const virtualAccount = await models_1.VirtualAccount.findOne({ reference: accountReference });
            if (!virtualAccount) {
                logger_1.logger.error(`Virtual account not found for reference: ${accountReference}`);
                return { success: false, message: 'Virtual account not found' };
            }
            // Check if this transaction has already been processed (Idempotency)
            const existingTransaction = await WalletService_1.walletService.getTransactionByExternalRef(transaction.reference);
            if (existingTransaction) {
                logger_1.logger.info(`Payrant transaction already processed: ${transaction.reference}`);
                return { success: true, message: 'Transaction already processed' };
            }
            // Amounts in Payrant are in NGN, our system uses kobo
            const grossAmount = Math.round(transaction.amount * 100);
            const payrantNetAmount = Math.round(transaction.net_amount * 100);
            const payrantFee = Math.round(transaction.fee * 100);
            // Calculate our own fee (0.6% of gross amount)
            const vtpayFee = Math.floor(grossAmount * 0.006);
            const amountToCredit = payrantNetAmount - vtpayFee;
            const txn = await WalletService_1.walletService.creditWallet(virtualAccount.userId.toString(), amountToCredit, 'deposit', `Deposit from ${transaction.payer_details?.account_name || 'Payrant'}`, transaction.reference, {
                source: 'payrant',
                payerName: transaction.payer_details?.account_name,
                payerAccountNumber: transaction.payer_details?.account_number,
                payerBankName: transaction.payer_details?.bank_name,
                grossAmount: grossAmount,
                payrantFee: payrantFee,
                vtpayFee: vtpayFee,
                payrantNetAmount: payrantNetAmount,
                metadata: transaction.metadata,
                breakdown: {
                    grossInflow: grossAmount,
                    payrantFee: payrantFee,
                    vtpayFee: vtpayFee,
                    userCredit: amountToCredit,
                    vtpayRevenue: vtpayFee
                }
            }, virtualAccount.reference, vtpayFee + payrantFee, false // isCleared = false for deposits
            );
            // Send email notification to user
            const user = await models_1.User.findById(virtualAccount.userId);
            if (user) {
                await EmailService_1.emailService.sendTransactionNotification(user.email, user.firstName || 'User', txn);
            }
            // Log the webhook
            await models_1.WebhookLog.create({
                source: 'payrant',
                eventType: 'deposit.success',
                userId: virtualAccount.userId,
                payload: payload,
                signature: 'verified', // Assuming verification is handled or not required for now
                signatureValid: true,
            });
            logger_1.logger.info(`Successfully processed Payrant inbound payment for user ${virtualAccount.userId}: ${amountToCredit} kobo`);
            return { success: true, message: 'Payment processed successfully' };
        }
        catch (error) {
            logger_1.logger.error('Error processing Payrant inbound webhook', error);
            return { success: false, message: 'Error processing webhook' };
        }
    }
    /**
     * Retry a failed webhook dispatch
     */
    async retryDispatch(logId) {
        try {
            const log = await models_1.WebhookLog.findById(logId);
            if (!log) {
                return { success: false, message: 'Webhook log not found' };
            }
            if (log.source !== 'vtpay') {
                return { success: false, message: 'Only outbound webhooks can be retried' };
            }
            const user = await models_1.User.findById(log.userId);
            if (!user || !user.webhookUrl) {
                return { success: false, message: 'User or webhook URL not found' };
            }
            log.dispatchAttempts = (log.dispatchAttempts || 0) + 1;
            log.dispatchStatus = 'pending';
            await log.save();
            try {
                logger_1.logger.info(`Retrying webhook dispatch to ${user.webhookUrl} (Attempt ${log.dispatchAttempts})`);
                const response = await axios_1.default.post(user.webhookUrl, log.payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'VTPay-Signature': log.signature,
                        'User-Agent': 'VTPay-Webhook-Dispatcher/1.0',
                    },
                    timeout: 10000,
                });
                log.dispatchStatus = 'success';
                log.responseStatus = response.status;
                log.responseBody = typeof response.data === 'object' ? JSON.stringify(response.data) : String(response.data);
                await log.save();
                return { success: true, message: 'Webhook successfully retried' };
            }
            catch (error) {
                log.dispatchStatus = 'failed';
                log.responseStatus = error.response?.status;
                log.responseBody = error.response?.data ?
                    (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data))
                    : error.message;
                await log.save();
                return { success: false, message: `Retry failed: ${error.message}` };
            }
        }
        catch (error) {
            logger_1.logger.error('Error in retryDispatch', error.message);
            return { success: false, message: 'Internal error during retry' };
        }
    }
}
exports.WebhookService = WebhookService;
exports.webhookService = new WebhookService();
exports.default = exports.webhookService;
//# sourceMappingURL=WebhookService.js.map