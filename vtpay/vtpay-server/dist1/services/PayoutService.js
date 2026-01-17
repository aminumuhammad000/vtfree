"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutService = exports.PayoutService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const models_1 = require("../models");
const ZainpayService_1 = require("./ZainpayService");
const EmailService_1 = require("./EmailService");
const logger_1 = require("../utils/logger");
const config_1 = __importDefault(require("../config"));
const MAX_RECONCILE_RETRIES = 5;
const RECONCILE_INTERVAL_MINUTES = 15;
class PayoutService {
    /**
     * Initiate a payout request
     */
    async initiatePayout(userId, amount, bankDetails) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // 1. Validate & Lock Funds
            const wallet = await models_1.Wallet.findOne({ userId: new mongoose_1.default.Types.ObjectId(userId) }).session(session);
            if (!wallet) {
                throw new Error('Wallet not found');
            }
            if (wallet.clearedBalance < amount) {
                throw new Error('Insufficient cleared balance');
            }
            // Move funds to locked
            wallet.clearedBalance -= amount;
            wallet.lockedBalance += amount;
            await wallet.save({ session });
            // 2. Create Payout Record
            const payout = new models_1.Payout({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                amount,
                totalDeducted: amount,
                ...bankDetails,
                status: 'INITIATED',
                reference: `PAY-${(0, uuid_1.v4)()}`,
                retryCount: 0
            });
            await payout.save({ session });
            // 3. Create PENDING Ledger Entry (The "Lock" record)
            await models_1.Transaction.create([{
                    walletId: wallet._id,
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    type: 'debit',
                    category: 'withdrawal',
                    amount: amount,
                    fee: 0,
                    balanceBefore: wallet.balance,
                    balanceAfter: wallet.balance, // Balance doesn't change yet, only lockedBalance
                    reference: payout.reference,
                    narration: `Payout Lock: ${bankDetails.accountNumber} (${bankDetails.bankCode})`,
                    status: 'pending',
                    isCleared: true,
                    metadata: { payoutId: payout._id }
                }], { session });
            await session.commitTransaction();
            // 4. Trigger Async Processing
            this.processPayout(payout._id.toString()).catch(err => {
                logger_1.logger.error(`Error processing payout ${payout._id}`, err);
            });
            return payout;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    /**
     * Process a payout (send to Zainpay)
     */
    async processPayout(payoutId) {
        const payout = await models_1.Payout.findById(payoutId);
        if (!payout || payout.status !== 'INITIATED')
            return;
        try {
            const zainbox = await models_1.Zainbox.findOne({ isActive: true });
            if (!zainbox || !zainbox.zainboxCode) {
                throw new Error('No active Zainbox found for payout');
            }
            const accountsResponse = await ZainpayService_1.zainpayService.getZainboxAccounts(zainbox.zainboxCode);
            const sourceAccount = accountsResponse.data?.[0];
            if (!sourceAccount) {
                throw new Error('No source account found in Zainbox');
            }
            const response = await ZainpayService_1.zainpayService.fundTransfer({
                amount: payout.amount.toString(),
                destinationAccountNumber: payout.accountNumber,
                destinationBankCode: payout.bankCode,
                sourceAccountNumber: sourceAccount.bankAccount,
                sourceBankCode: '000',
                zainboxCode: zainbox.zainboxCode,
                txnRef: payout.reference,
                narration: `Payout to ${payout.accountName}`,
                callbackUrl: `${config_1.default.webhookBaseUrl}/api/webhooks/zainpay`
            });
            payout.status = 'PROCESSING';
            payout.externalRef = response.data?.txnRef || response.data?.paymentRef;
            await payout.save();
            logger_1.logger.info(`Payout ${payout.reference} processed to Zainpay. Ref: ${payout.externalRef}`);
        }
        catch (error) {
            logger_1.logger.error(`Payout processing failed for ${payout.reference}`, error);
            // Only fail if it's a definitive error from the provider, not a network timeout
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                await this.handlePayoutFailure(payout, error.message || 'Provider rejected request');
            }
            else {
                // For 5xx or network errors, keep in INITIATED or move to PROCESSING to be picked up by reconciliation
                payout.status = 'PROCESSING';
                payout.failureReason = error.message;
                await payout.save();
            }
        }
    }
    /**
     * Handle payout failure (refund funds)
     */
    async handlePayoutFailure(payout, reason) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Defensive Check: Status Transition
            const currentPayout = await models_1.Payout.findById(payout._id).session(session);
            if (!currentPayout || ['COMPLETED', 'FAILED', 'MANUAL_REVIEW'].includes(currentPayout.status)) {
                logger_1.logger.warn(`Payout ${payout.reference} already in terminal state: ${currentPayout?.status}`);
                await session.abortTransaction();
                return;
            }
            currentPayout.status = 'FAILED';
            currentPayout.failureReason = reason;
            await currentPayout.save({ session });
            const wallet = await models_1.Wallet.findOne({ userId: currentPayout.userId }).session(session);
            if (wallet) {
                wallet.lockedBalance -= currentPayout.amount;
                wallet.clearedBalance += currentPayout.amount; // Refund to cleared
                await wallet.save({ session });
            }
            // Update Ledger Entry
            await models_1.Transaction.findOneAndUpdate({ reference: currentPayout.reference, status: 'pending' }, {
                status: 'failed',
                metadata: { ...payout.metadata, failureReason: reason }
            }, { session });
            await session.commitTransaction();
            logger_1.logger.info(`Payout ${currentPayout.reference} failed and refunded. Reason: ${reason}`);
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.logger.error(`Error handling payout failure for ${payout.reference}`, error);
        }
        finally {
            session.endSession();
        }
    }
    /**
     * Handle payout success (finalize)
     */
    async handlePayoutSuccess(payout, externalAmount) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Defensive Check: Status Transition
            const currentPayout = await models_1.Payout.findById(payout._id).session(session);
            if (!currentPayout || ['COMPLETED', 'FAILED', 'MANUAL_REVIEW'].includes(currentPayout.status)) {
                logger_1.logger.warn(`Payout ${payout.reference} already in terminal state: ${currentPayout?.status}`);
                await session.abortTransaction();
                return;
            }
            // Defensive Check: Amount Matching
            if (externalAmount !== undefined && externalAmount !== currentPayout.amount) {
                logger_1.logger.error(`CRITICAL: Payout ${payout.reference} amount mismatch! Expected ${currentPayout.amount}, got ${externalAmount}`);
                currentPayout.status = 'MANUAL_REVIEW';
                currentPayout.failureReason = `Amount mismatch: expected ${currentPayout.amount}, got ${externalAmount}`;
                await currentPayout.save({ session });
                await session.commitTransaction();
                return;
            }
            currentPayout.status = 'COMPLETED';
            currentPayout.completedAt = new Date();
            await currentPayout.save({ session });
            const wallet = await models_1.Wallet.findOne({ userId: currentPayout.userId }).session(session);
            if (wallet) {
                const balanceBefore = wallet.balance;
                wallet.lockedBalance -= currentPayout.amount;
                wallet.balance -= currentPayout.amount; // Permanently reduce total balance
                await wallet.save({ session });
                // Update Ledger Entry
                await models_1.Transaction.findOneAndUpdate({ reference: currentPayout.reference, status: 'pending' }, {
                    status: 'success',
                    balanceBefore: balanceBefore,
                    balanceAfter: wallet.balance,
                    clearedAt: new Date()
                }, { session });
            }
            await session.commitTransaction();
            logger_1.logger.info(`Payout ${currentPayout.reference} completed successfully.`);
            // Trigger Email Notification (outside transaction)
            this.sendPayoutSuccessNotification(currentPayout).catch(err => {
                logger_1.logger.error(`Failed to send payout success email for ${currentPayout.reference}`, err);
            });
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.logger.error(`Error handling payout success for ${payout.reference}`, error);
        }
        finally {
            session.endSession();
        }
    }
    /**
     * Process Settlements (Pending -> Cleared)
     */
    async processSettlements() {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
            // Use a query that is safe for multiple runs (idempotent)
            const transactions = await models_1.Transaction.find({
                status: 'success',
                category: 'deposit',
                isCleared: false,
                createdAt: { $lte: cutoffTime }
            }).session(session);
            if (transactions.length === 0) {
                await session.abortTransaction();
                return;
            }
            logger_1.logger.info(`Found ${transactions.length} transactions to settle.`);
            for (const txn of transactions) {
                const wallet = await models_1.Wallet.findOne({ userId: txn.userId }).session(session);
                if (wallet) {
                    wallet.clearedBalance += txn.amount;
                    await wallet.save({ session });
                }
                txn.isCleared = true;
                txn.clearedAt = new Date();
                await txn.save({ session });
            }
            await session.commitTransaction();
            logger_1.logger.info(`Successfully settled ${transactions.length} transactions.`);
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.logger.error("Settlement job failed", error);
        }
        finally {
            session.endSession();
        }
    }
    /**
     * Reconcile Payouts (Bounded Polling)
     */
    async reconcilePayouts() {
        try {
            const cutoffTime = new Date(Date.now() - RECONCILE_INTERVAL_MINUTES * 60 * 1000);
            const processingPayouts = await models_1.Payout.find({
                status: 'PROCESSING',
                retryCount: { $lt: MAX_RECONCILE_RETRIES },
                $or: [
                    { lastReconciledAt: { $exists: false } },
                    { lastReconciledAt: { $lte: cutoffTime } }
                ]
            });
            if (processingPayouts.length === 0)
                return;
            logger_1.logger.info(`Reconciling ${processingPayouts.length} processing payouts.`);
            for (const payout of processingPayouts) {
                try {
                    payout.retryCount += 1;
                    payout.lastReconciledAt = new Date();
                    const response = await ZainpayService_1.zainpayService.verifyTransfer(payout.reference);
                    if (response.code === '00') {
                        const status = response.data?.txnStatus;
                        const amount = response.data?.amount;
                        if (status === 'success') {
                            await this.handlePayoutSuccess(payout, amount ? parseInt(amount, 10) : undefined);
                        }
                        else if (status === 'failed') {
                            await this.handlePayoutFailure(payout, 'Zainpay reported failure');
                        }
                        else {
                            // Still pending, do nothing
                            logger_1.logger.info(`Payout ${payout.reference} still pending at provider.`);
                            if (payout.retryCount >= MAX_RECONCILE_RETRIES) {
                                payout.status = 'MANUAL_REVIEW';
                                payout.failureReason = `Max reconciliation retries reached. Last status: ${status}`;
                            }
                            await payout.save();
                        }
                    }
                    else {
                        // Error from verify API or non-00 code
                        if (payout.retryCount >= MAX_RECONCILE_RETRIES) {
                            payout.status = 'MANUAL_REVIEW';
                            payout.failureReason = `Max reconciliation retries reached. Verify API error: ${response.description}`;
                        }
                        await payout.save();
                    }
                }
                catch (error) {
                    logger_1.logger.error(`Error reconciling payout ${payout.reference}`, error);
                    if (payout.retryCount >= MAX_RECONCILE_RETRIES) {
                        payout.status = 'MANUAL_REVIEW';
                        payout.failureReason = `Max reconciliation retries reached. Last error: ${error.message}`;
                        await payout.save();
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Reconciliation job failed', error);
        }
    }
    /**
     * Send payout success notification email
     */
    async sendPayoutSuccessNotification(payout) {
        try {
            const user = await models_1.User.findById(payout.userId);
            if (!user) {
                logger_1.logger.warn(`User not found for payout notification: ${payout.userId}`);
                return;
            }
            await EmailService_1.emailService.sendPayoutSuccessEmail(user.email, user.firstName || 'User', payout);
        }
        catch (error) {
            logger_1.logger.error(`Error sending payout success notification for ${payout.reference}`, error);
        }
    }
}
exports.PayoutService = PayoutService;
exports.payoutService = new PayoutService();
exports.default = exports.payoutService;
//# sourceMappingURL=PayoutService.js.map