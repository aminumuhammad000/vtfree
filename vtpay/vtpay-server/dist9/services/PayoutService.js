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
        // Ensure amount is a number
        const safeAmount = Number(amount);
        if (isNaN(safeAmount)) {
            return {
                fee: 0,
                payrantFee: 0,
                totalDebit: 0,
                vtpayFee: 0,
                zainpayPercentFee: 0,
                zainpayFixedFee: 0,
                totalDeducted: 0,
                netAmount: 0
            };
        }
        const settings = await models_1.SystemSetting.findOne();
        const payoutSettings = settings?.payout || {
            vtpayFeePercent: 0.6,
            bankSettlementFee: 2500,
            bankSettlementThreshold: 0
        };
        let fee = 0; // VTPay fee
        let payrantFee = 0;
        let netAmount = 0;
        if (isInternal) {
            fee = 0;
            payrantFee = 0;
            netAmount = safeAmount;
        }
        else {
            // Bank Settlement Fee (Fixed)
            let bankSettlementFee = Number(payoutSettings.bankSettlementFee);
            if (isNaN(bankSettlementFee))
                bankSettlementFee = 2500;
            let threshold = Number(payoutSettings.bankSettlementThreshold);
            if (isNaN(threshold))
                threshold = 0;
            if (safeAmount >= threshold) {
                payrantFee = bankSettlementFee;
            }
            else {
                payrantFee = 0;
            }
            // VTPay fee (Percentage)
            let vtpayFeePercent = Number(payoutSettings.vtpayFeePercent);
            if (isNaN(vtpayFeePercent))
                vtpayFeePercent = 0.6;
            // Calculate Net Amount: Net = (Total - Fixed) / (1 + Rate)
            const remaining = safeAmount - payrantFee;
            if (remaining > 0) {
                netAmount = Math.floor(remaining / (1 + vtpayFeePercent / 100));
                // Fee is the difference to ensure Total = Input
                fee = safeAmount - netAmount - payrantFee;
            }
            else {
                netAmount = 0;
                fee = 0;
                payrantFee = 0; // Cannot afford fixed fee
            }
        }
        const totalDebit = safeAmount;
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
            netAmount: netAmount
        };
    }
    /**
     * Initiate a payout request
     */
    async initiatePayout(userId, amount, details) {
        // 1. Validation
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (user.status === 'suspended') {
            throw new Error('Your account is suspended. Please contact support.');
        }
        if (user.status === 'pending') {
            throw new Error('Your account is pending verification.');
        }
        // KYC Check (Level 2 or 3 required for payouts)
        if (user.kycLevel < 2) {
            throw new Error('Please complete your KYC verification to enable withdrawals.');
        }
        if (amount < 10000) { // 100 Naira
            throw new Error('Minimum withdrawal amount is ₦100.00');
        }
        // 2. Fees & Internal Check
        const isInternal = await models_1.VirtualAccount.exists({ accountNumber: details.accountNumber });
        const fees = await this.calculateFees(amount, !!isInternal);
        const totalDeducted = amount;
        // 3. Check Balance & Deduct (Without Transaction for Standalone Support)
        const wallet = await models_1.Wallet.findOne({ userId });
        if (!wallet)
            throw new Error('Wallet not found');
        if (wallet.clearedBalance < totalDeducted) {
            throw new Error('Insufficient cleared balance for this withdrawal');
        }
        // Optimistic locking / atomic update could be better here, but simple deduction for now
        wallet.clearedBalance -= totalDeducted;
        wallet.balance -= totalDeducted;
        await wallet.save();
        try {
            // Create Payout Record
            const payout = new models_1.Payout({
                userId,
                amount: fees.netAmount,
                fee: fees.fee,
                payrantFee: fees.payrantFee,
                totalDebit: totalDeducted,
                bankCode: details.bankCode,
                accountNumber: details.accountNumber,
                accountName: details.accountName,
                payoutType: isInternal ? 'internal' : 'external',
                reference: `PAYOUT-${(0, uuid_1.v4)()}`,
                status: 'INITIATED',
                retryCount: 0,
            });
            await payout.save();
            // Transaction record creation deferred to handlePayoutSuccess
            // This ensures that only successful external payouts (or finalized internal ones) appear in the transaction history.
            // await Transaction.create({ ... });
            // 4. Process with Payrant (Sync for immediate feedback)
            // We await it here so if it fails, we catch it below and refund the user immediately.
            await this.processPayout(payout.id, true);
            return payout;
        }
        catch (error) {
            // Manually rollback wallet if payout save failed OR if processPayout failed
            wallet.clearedBalance += totalDeducted;
            wallet.balance += totalDeducted;
            await wallet.save().catch(e => logger_1.logger.error('CRITICAL: Failed to rollback wallet', e));
            // If we created a payout record, mark it as FAILED so we have a record of the attempt
            // We can't easily access 'payout' here if it was defined in the try block, 
            // but the transaction rollbacks are handled by the wallet refund above.
            throw error;
        }
    }
    /**
     * Process a payout (send to Payrant)
     * @param payoutId The ID of the payout
     * @param throwOnError If true, wil re-throw errors instead of just logging them (used for synchronous API calls)
     */
    async processPayout(payoutId, throwOnError = false) {
        const payout = await models_1.Payout.findById(payoutId);
        if (!payout || payout.status !== 'INITIATED')
            return;
        try {
            if (payout.payoutType === 'internal') {
                // Handle internal transfer (wallet to wallet)
                await this.handlePayoutSuccess(payout);
                return;
            }
            const payload = {
                bank_code: payout.bankCode,
                account_number: payout.accountNumber,
                account_name: payout.accountName,
                amount: payout.amount / 100,
                description: `Withdrawal from VTPay wallet: ${payout.reference}`,
                notify_url: `${config_1.default.webhookBaseUrl}/api/webhooks/payrant`
            };
            logger_1.logger.info(`Initiating Payrant Transfer for ${payout.reference}`, payload);
            const response = await PayrantService_1.payrantService.transfer(payload);
            payout.status = 'PROCESSING';
            // Store the full reference string (e.g. TRANSFER_1756818101_77) not just ID
            payout.externalRef = response.data?.reference || String(response.data?.transfer_id);
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
            // Mark as FAILED immediately if it's a provider rejection
            const errorMessage = error.response?.data?.message || error.message || 'Provider rejected request';
            await this.handlePayoutFailure(payout, errorMessage, throwOnError);
            if (throwOnError) {
                // Re-throw so the caller (initiatePayout) can refund the wallet
                throw new Error(errorMessage);
            }
        }
    }
    /**
     * Handle Payout Success (Webhook or Polling)
     */
    async handlePayoutSuccess(payout, amount) {
        if (payout.status === 'COMPLETED')
            return; // Already processed
        payout.status = 'COMPLETED';
        await payout.save();
        // Create the Transaction Record NOW (on success)
        const wallet = await models_1.Wallet.findOne({ userId: payout.userId });
        if (wallet) {
            await models_1.Transaction.create({
                userId: payout.userId,
                walletId: wallet._id,
                type: 'debit',
                category: 'withdrawal',
                amount: payout.totalDebit,
                reference: payout.reference,
                description: `Payout to ${payout.accountNumber} (${payout.bankCode})`,
                status: 'success',
                balanceBefore: wallet.balance + payout.totalDebit, // Reconstructed balance before (approximate)
                balanceAfter: wallet.balance,
                payoutId: payout._id,
                metadata: {
                    fees: {
                        fee: payout.fee,
                        payrantFee: payout.payrantFee,
                        totalDebit: payout.totalDebit,
                        netAmount: payout.amount
                    },
                    beneficiary: {
                        accountNumber: payout.accountNumber,
                        accountName: payout.accountName,
                        bankCode: payout.bankCode
                    }
                }
            });
        }
        logger_1.logger.info(`Payout ${payout.reference} marked as COMPLETED and transaction recorded.`);
        // Notify user via email if needed
        const user = await models_1.User.findById(payout.userId);
        if (user) {
            // Email notification logic
        }
    }
    /**
     * Handle Payout Failure (Webhook or Polling)
     */
    async handlePayoutFailure(payout, reason, skipRefund = false) {
        if (payout.status === 'FAILED')
            return; // Already processed
        payout.status = 'FAILED';
        payout.failureReason = reason;
        await payout.save();
        // Update transaction status
        // No transaction to update
        // await Transaction.updateMany(...)
        if (skipRefund) {
            logger_1.logger.info(`Payout ${payout.reference} failed. Refund skipped (handled by caller). Reason: ${reason}`);
            return;
        }
        // REFUND LOGIC
        // We need to credit the wallet back
        const wallet = await models_1.Wallet.findOne({ userId: payout.userId });
        if (wallet) {
            // Refund the TOTAL debit (amount + fees)
            const refundAmount = payout.totalDebit;
            wallet.clearedBalance += refundAmount;
            wallet.balance += refundAmount;
            await wallet.save();
            // No Transaction needed if we never created the debit.
            // Just silently refund the wallet.
            // await Transaction.create({ ... });
            logger_1.logger.info(`Payout ${payout.reference} failed. Wallet refunded. Reason: ${reason}`);
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