import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Wallet, Payout, Transaction, User, VirtualAccount, SystemSetting, ParentAccountLedger } from '../models';
import { payrantService } from './PayrantService';
import { emailService } from './EmailService';
import { logger } from '../utils/logger';
import config from '../config';

const MAX_RECONCILE_RETRIES = 5;
const RECONCILE_INTERVAL_MINUTES = 15;

export class PayoutService {
    /**
     * Calculate payout fees
     */
    async calculateFees(amount: number, isInternal: boolean) {
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

        const settings = await SystemSetting.findOne();
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
        } else {
            // Bank Settlement Fee (Fixed)
            let bankSettlementFee = Number(payoutSettings.bankSettlementFee);
            if (isNaN(bankSettlementFee)) bankSettlementFee = 2500;

            let threshold = Number(payoutSettings.bankSettlementThreshold);
            if (isNaN(threshold)) threshold = 0;

            if (safeAmount >= threshold) {
                payrantFee = bankSettlementFee;
            } else {
                payrantFee = 0;
            }

            // VTPay fee (Percentage)
            let vtpayFeePercent = Number(payoutSettings.vtpayFeePercent);
            if (isNaN(vtpayFeePercent)) vtpayFeePercent = 0.6;

            // Calculate Net Amount: Net = (Total - Fixed) / (1 + Rate)
            const remaining = safeAmount - payrantFee;
            if (remaining > 0) {
                netAmount = Math.floor(remaining / (1 + vtpayFeePercent / 100));
                // Fee is the difference to ensure Total = Input
                fee = safeAmount - netAmount - payrantFee;
            } else {
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
    async initiatePayout(
        userId: string,
        amount: number,
        details: { bankCode: string; accountNumber: string; accountName: string }
    ): Promise<any> {
        // 1. Validation
        const user = await User.findById(userId);
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
        const isInternal = await VirtualAccount.exists({ accountNumber: details.accountNumber });
        const fees = await this.calculateFees(amount, !!isInternal);
        const totalDeducted = amount;

        // 3. Check Balance & Deduct (Without Transaction for Standalone Support)
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) throw new Error('Wallet not found');

        if (wallet.clearedBalance < totalDeducted) {
            throw new Error('Insufficient cleared balance for this withdrawal');
        }

        // Optimistic locking / atomic update could be better here, but simple deduction for now
        wallet.clearedBalance -= totalDeducted;
        wallet.balance -= totalDeducted;
        await wallet.save();

        try {
            // Create Payout Record
            const payout = new Payout({
                userId,
                amount: fees.netAmount,
                fee: fees.fee,
                payrantFee: fees.payrantFee,
                totalDebit: totalDeducted,
                bankCode: details.bankCode,
                accountNumber: details.accountNumber,
                accountName: details.accountName,
                payoutType: isInternal ? 'internal' : 'external',
                reference: `PAYOUT-${uuidv4()}`,
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

        } catch (error) {
            // Manually rollback wallet if payout save failed OR if processPayout failed
            wallet.clearedBalance += totalDeducted;
            wallet.balance += totalDeducted;
            await wallet.save().catch(e => logger.error('CRITICAL: Failed to rollback wallet', e));

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
    async processPayout(payoutId: string, throwOnError: boolean = false): Promise<void> {
        const payout = await Payout.findById(payoutId);
        if (!payout || payout.status !== 'INITIATED') return;

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
                notify_url: `${config.webhookBaseUrl}/api/webhooks/payrant`
            };
            logger.info(`Initiating Payrant Transfer for ${payout.reference}`, payload);

            const response = await payrantService.transfer(payload);

            payout.status = 'PROCESSING';
            // Store the full reference string (e.g. TRANSFER_1756818101_77) not just ID
            payout.externalRef = response.data?.reference || String(response.data?.transfer_id);

            // Update payrant fee if returned
            if (response.data?.fee) {
                payout.payrantFee = response.data.fee;
                payout.totalDebit = payout.amount + payout.fee + payout.payrantFee;
            }
            await payout.save();

            logger.info(`Payout ${payout.reference} processed to Payrant. Ref: ${payout.externalRef}`);

        } catch (error: any) {
            logger.error(`Payout processing failed for ${payout.reference}`, error);

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
    async handlePayoutSuccess(payout: any): Promise<void> {
        if (payout.status === 'COMPLETED') return; // Already processed

        payout.status = 'COMPLETED';
        await payout.save();

        // Create the Transaction Record NOW (on success)
        const wallet = await Wallet.findOne({ userId: payout.userId });
        if (wallet) {
            await Transaction.create({
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

        logger.info(`Payout ${payout.reference} marked as COMPLETED and transaction recorded.`);

        // Notify user via email if needed
        const user = await User.findById(payout.userId);
        if (user) {
            // Email notification logic
        }
    }

    /**
     * Handle Payout Failure (Webhook or Polling)
     */
    async handlePayoutFailure(payout: any, reason: string, skipRefund: boolean = false): Promise<void> {
        if (payout.status === 'FAILED') return; // Already processed

        payout.status = 'FAILED';
        payout.failureReason = reason;
        await payout.save();

        // Update transaction status
        // No transaction to update
        // await Transaction.updateMany(...)

        if (skipRefund) {
            logger.info(`Payout ${payout.reference} failed. Refund skipped (handled by caller). Reason: ${reason}`);
            return;
        }

        // REFUND LOGIC
        // We need to credit the wallet back
        const wallet = await Wallet.findOne({ userId: payout.userId });
        if (wallet) {
            // Refund the TOTAL debit (amount + fees)
            const refundAmount = payout.totalDebit;

            wallet.clearedBalance += refundAmount;
            wallet.balance += refundAmount;
            await wallet.save();

            // No Transaction needed if we never created the debit.
            // Just silently refund the wallet.

            // await Transaction.create({ ... });

            logger.info(`Payout ${payout.reference} failed. Wallet refunded. Reason: ${reason}`);
        }
    }


    /**
     * Process Settlements (Pending -> Cleared)
     */
    async processSettlements(): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Use a query that is safe for multiple runs (idempotent)
            const transactions = await Transaction.find({
                status: 'success',
                category: 'deposit',
                isCleared: false,
                createdAt: { $lte: cutoffTime }
            }).session(session);

            if (transactions.length === 0) {
                await session.abortTransaction();
                return;
            }

            logger.info(`Found ${transactions.length} transactions to settle.`);

            for (const txn of transactions) {
                const wallet = await Wallet.findOne({ userId: txn.userId }).session(session);
                if (wallet) {
                    wallet.clearedBalance += txn.amount;
                    await wallet.save({ session });
                }
                txn.isCleared = true;
                txn.clearedAt = new Date();
                await txn.save({ session });
            }

            await session.commitTransaction();
            logger.info(`Successfully settled ${transactions.length} transactions.`);
        } catch (error) {
            await session.abortTransaction();
            logger.error("Settlement job failed", error);
        } finally {
            session.endSession();
        }
    }

    /**
     * Reconcile Payouts (Bounded Polling)
     */
    async reconcilePayouts(): Promise<void> {
        try {
            const cutoffTime = new Date(Date.now() - RECONCILE_INTERVAL_MINUTES * 60 * 1000);

            const processingPayouts = await Payout.find({
                status: 'PROCESSING',
                retryCount: { $lt: MAX_RECONCILE_RETRIES },
                $or: [
                    { lastReconciledAt: { $exists: false } },
                    { lastReconciledAt: { $lte: cutoffTime } }
                ]
            });

            if (processingPayouts.length === 0) return;

            logger.info(`Reconciling ${processingPayouts.length} processing payouts.`);

            for (const payout of processingPayouts) {
                try {
                    payout.retryCount += 1;
                    payout.lastReconciledAt = new Date();

                    const response = await payrantService.verifyTransfer(payout.externalRef || payout.reference);

                    if (response.status === 'success') {
                        const status = response.data?.status;
                        const amount = response.data?.amount;

                        if (status === 'success') {
                            await this.handlePayoutSuccess(payout, amount ? amount : undefined);
                        } else if (status === 'failed') {
                            await this.handlePayoutFailure(payout, 'Payrant reported failure');
                        } else {
                            // Still pending, do nothing
                            logger.info(`Payout ${payout.reference} still pending at provider.`);
                            if (payout.retryCount >= MAX_RECONCILE_RETRIES) {
                                payout.status = 'MANUAL_REVIEW';
                                payout.failureReason = `Max reconciliation retries reached. Last status: ${status}`;
                            }
                            await payout.save();
                        }
                    } else {
                        // Error from verify API
                        if (payout.retryCount >= MAX_RECONCILE_RETRIES) {
                            payout.status = 'MANUAL_REVIEW';
                            payout.failureReason = `Max reconciliation retries reached. Verify API error: ${response.message}`;
                        }
                        await payout.save();
                    }
                } catch (error: any) {
                    logger.error(`Error reconciling payout ${payout.reference}`, error);
                    if (payout.retryCount >= MAX_RECONCILE_RETRIES) {
                        payout.status = 'MANUAL_REVIEW';
                        payout.failureReason = `Max reconciliation retries reached. Last error: ${error.message}`;
                        await payout.save();
                    }
                }
            }
        } catch (error) {
            logger.error('Reconciliation job failed', error);
        }
    }
    /**
     * Send payout success notification email
     */
    private async sendPayoutSuccessNotification(payout: any): Promise<void> {
        try {
            const user = await User.findById(payout.userId);
            if (!user) {
                logger.warn(`User not found for payout notification: ${payout.userId}`);
                return;
            }

            await emailService.sendPayoutSuccessEmail(
                user.email,
                user.firstName || 'User',
                payout
            );
        } catch (error) {
            logger.error(`Error sending payout success notification for ${payout.reference}`, error);
        }
    }
}

export const payoutService = new PayoutService();
export default payoutService;
