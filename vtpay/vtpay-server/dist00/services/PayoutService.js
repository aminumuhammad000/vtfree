"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutService = exports.PayoutService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const models_1 = require("../models");
const PayrantService_1 = require("./PayrantService");
const EmailService_1 = require("./EmailService");
const logger_1 = require("../utils/logger");
const config_1 = __importDefault(require("../config"));
const MAX_RECONCILE_RETRIES = 5;
const RECONCILE_INTERVAL_MINUTES = 15;
class PayoutService {
    /**
     * Calculate payout fees
     */
    async calculateFees(amount, isInternal) {
        const settings = await models_1.SystemSetting.findOne();
        const payoutSettings = settings?.payout || {
            vtpayFeePercent: 0.6,
            bankSettlementFee: 2500,
            bankSettlementThreshold: 0
        };
        let fee = 0; // VTPay fee
        let payrantFee = 0;
        if (isInternal) {
            fee = 0;
            payrantFee = 0;
        }
        else {
            // VTPay fee (Percentage)
            const vtpayFeePercent = payoutSettings.vtpayFeePercent ?? 0.6;
            fee = Math.ceil(amount * (vtpayFeePercent / 100));
            // Bank Settlement Fee (Fixed)
            // Apply only if amount is greater than or equal to threshold
            // If threshold is 0, it applies to all amounts (or we can interpret 0 as 'always apply')
            const threshold = payoutSettings.bankSettlementThreshold ?? 0;
            if (amount >= threshold) {
                payrantFee = payoutSettings.bankSettlementFee ?? 2500;
            }
            else {
                payrantFee = 0;
            }
        }
        const totalDebit = amount + fee + payrantFee;
        return {
            // Backend fields
            fee,
            payrantFee,
            totalDebit,
            // Frontend compatibility fields
            vtpayFee: fee,
            zainpayPercentFee: 0,
            zainpayFixedFee: payrantFee,
            totalDeducted: totalDebit,
            netAmount: amount
        };
    }
    /**
     * Initiate a payout request
     */
    async initiatePayout(userId, amount, bankDetails) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // 1. Determine if Internal or External
            const isInternal = await models_1.VirtualAccount.exists({ accountNumber: bankDetails.accountNumber });
            const fees = await this.calculateFees(amount, !!isInternal);
            if (amount <= 0) {
                throw new Error('Payout amount must be greater than zero');
            }
            // 2. Validate & Lock Funds
            const wallet = await models_1.Wallet.findOne({ userId: new mongoose_1.default.Types.ObjectId(userId) }).session(session);
            if (!wallet) {
                throw new Error('Wallet not found');
            }
            if (wallet.clearedBalance < fees.totalDebit) {
                throw new Error('Insufficient cleared balance');
            }
            // Move funds to locked
            wallet.clearedBalance -= fees.totalDebit;
            wallet.lockedBalance += fees.totalDebit;
            await wallet.save({ session });
            // 3. Create Payout Record
            const payout = new models_1.Payout({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                amount,
                fee: fees.fee,
                payrantFee: fees.payrantFee,
                totalDebit: fees.totalDebit,
                ...bankDetails,
                payoutType: isInternal ? 'internal' : 'external',
                status: 'INITIATED',
                reference: `PAY-${(0, uuid_1.v4)()}`,
                retryCount: 0
            });
            await payout.save({ session });
            // 4. Create PENDING Ledger Entry (The "Lock" record)
            await models_1.Transaction.create([{
                    walletId: wallet._id,
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    type: 'debit',
                    category: 'withdrawal',
                    amount: fees.totalDebit,
                    fee: fees.fee + fees.payrantFee,
                    balanceBefore: wallet.balance,
                    balanceAfter: wallet.balance, // Balance doesn't change yet, only lockedBalance
                    reference: payout.reference,
                    narration: `Payout Lock: ${bankDetails.accountNumber} (${bankDetails.bankCode})`,
                    status: 'pending',
                    isCleared: true,
                    metadata: {
                        payoutId: payout._id,
                        fee: fees.fee,
                        payrantFee: fees.payrantFee,
                        requestedAmount: amount
                    }
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
            if (payout.payoutType === 'internal') {
                // Handle internal transfer (wallet to wallet)
                // For now, we'll just mark as completed if it's internal
                // In a real scenario, we'd credit the destination wallet
                await this.handlePayoutSuccess(payout);
                return;
            }
            const response = await PayrantService_1.payrantService.transfer({
                bank_code: payout.bankCode,
                account_number: payout.accountNumber,
                account_name: payout.accountName,
                amount: payout.amount,
                description: `Withdrawal from VTPay wallet: ${payout.reference}`,
                notify_url: `${config_1.default.webhookBaseUrl}/api/webhooks/payrant`
            });
            payout.status = 'PROCESSING';
            payout.externalRef = response.data?.transfer_id;
            // Update payrant fee if returned
            if (response.data?.fee) {
                payout.payrantFee = response.data.fee;
                payout.totalDebit = payout.amount + payout.fee + payout.payrantFee;
            }
            await payout.save();
            logger_1.logger.info(`Payout ${payout.reference} processed to Payrant. Ref: ${payout.externalRef}`);
        }
        catch (error) {
            logger_1.logger.error(`Payout processing failed for ${payout.reference}`, error);
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                await this.handlePayoutFailure(payout, error.response.data?.message || error.message || 'Provider rejected request');
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
                wallet.lockedBalance -= currentPayout.totalDebit;
                wallet.clearedBalance += currentPayout.totalDebit; // Refund to cleared
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
                wallet.lockedBalance -= currentPayout.totalDebit;
                wallet.balance -= currentPayout.totalDebit; // Permanently reduce total balance
                await wallet.save({ session });
                // Create Parent Account Ledger Entry
                await models_1.ParentAccountLedger.create([{
                        payoutId: currentPayout._id,
                        amount: currentPayout.amount,
                        fee: currentPayout.payrantFee,
                        totalDebit: currentPayout.amount + currentPayout.payrantFee,
                        status: 'SUCCESS',
                        transferId: currentPayout.externalRef,
                        description: `Payout to ${currentPayout.accountName} (${currentPayout.accountNumber})`
                    }], { session });
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
                    const response = await PayrantService_1.payrantService.verifyTransfer(payout.externalRef || payout.reference);
                    if (response.status === 'success') {
                        const status = response.data?.status;
                        const amount = response.data?.amount;
                        if (status === 'success') {
                            await this.handlePayoutSuccess(payout, amount ? amount : undefined);
                        }
                        else if (status === 'failed') {
                            await this.handlePayoutFailure(payout, 'Payrant reported failure');
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
                        // Error from verify API
                        if (payout.retryCount >= MAX_RECONCILE_RETRIES) {
                            payout.status = 'MANUAL_REVIEW';
                            payout.failureReason = `Max reconciliation retries reached. Verify API error: ${response.message}`;
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