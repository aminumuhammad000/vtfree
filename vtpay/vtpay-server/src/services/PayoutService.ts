import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Wallet, Payout, Transaction, Zainbox, User } from '../models';
import { zainpayService } from './ZainpayService';
import { emailService } from './EmailService';
import { logger } from '../utils/logger';
import config from '../config';

const MAX_RECONCILE_RETRIES = 5;
const RECONCILE_INTERVAL_MINUTES = 15;

export class PayoutService {
    /**
     * Initiate a payout request
     */
    async initiatePayout(
        userId: string,
        amount: number,
        bankDetails: {
            bankCode: string;
            accountNumber: string;
            accountName: string;
        }
    ): Promise<typeof Payout.prototype> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Validate & Lock Funds
            const wallet = await Wallet.findOne({ userId: new mongoose.Types.ObjectId(userId) }).session(session);
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
            const payout = new Payout({
                userId: new mongoose.Types.ObjectId(userId),
                amount,
                totalDeducted: amount,
                ...bankDetails,
                status: 'INITIATED',
                reference: `PAY-${uuidv4()}`,
                retryCount: 0
            });
            await payout.save({ session });

            // 3. Create PENDING Ledger Entry (The "Lock" record)
            await Transaction.create([{
                walletId: wallet._id,
                userId: new mongoose.Types.ObjectId(userId),
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
                logger.error(`Error processing payout ${payout._id}`, err);
            });

            return payout;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Process a payout (send to Zainpay)
     */
    async processPayout(payoutId: string): Promise<void> {
        const payout = await Payout.findById(payoutId);
        if (!payout || payout.status !== 'INITIATED') return;

        try {
            const zainbox = await Zainbox.findOne({ isActive: true });
            if (!zainbox || !zainbox.zainboxCode) {
                throw new Error('No active Zainbox found for payout');
            }

            const accountsResponse = await zainpayService.getZainboxAccounts(zainbox.zainboxCode);
            const sourceAccount = accountsResponse.data?.[0];

            if (!sourceAccount) {
                throw new Error('No source account found in Zainbox');
            }

            const response = await zainpayService.fundTransfer({
                amount: payout.amount.toString(),
                destinationAccountNumber: payout.accountNumber,
                destinationBankCode: payout.bankCode,
                sourceAccountNumber: sourceAccount.bankAccount,
                sourceBankCode: '000',
                zainboxCode: zainbox.zainboxCode,
                txnRef: payout.reference,
                narration: `Payout to ${payout.accountName}`,
                callbackUrl: `${config.webhookBaseUrl}/api/webhooks/zainpay`
            });

            payout.status = 'PROCESSING';
            payout.externalRef = response.data?.txnRef || response.data?.paymentRef;
            await payout.save();

            logger.info(`Payout ${payout.reference} processed to Zainpay. Ref: ${payout.externalRef}`);

        } catch (error: any) {
            logger.error(`Payout processing failed for ${payout.reference}`, error);
            // Only fail if it's a definitive error from the provider, not a network timeout
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                await this.handlePayoutFailure(payout, error.message || 'Provider rejected request');
            } else {
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
    async handlePayoutFailure(payout: any, reason: string): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Defensive Check: Status Transition
            const currentPayout = await Payout.findById(payout._id).session(session);
            if (!currentPayout || ['COMPLETED', 'FAILED', 'MANUAL_REVIEW'].includes(currentPayout.status)) {
                logger.warn(`Payout ${payout.reference} already in terminal state: ${currentPayout?.status}`);
                await session.abortTransaction();
                return;
            }

            currentPayout.status = 'FAILED';
            currentPayout.failureReason = reason;
            await currentPayout.save({ session });

            const wallet = await Wallet.findOne({ userId: currentPayout.userId }).session(session);
            if (wallet) {
                wallet.lockedBalance -= currentPayout.amount;
                wallet.clearedBalance += currentPayout.amount; // Refund to cleared
                await wallet.save({ session });
            }

            // Update Ledger Entry
            await Transaction.findOneAndUpdate(
                { reference: currentPayout.reference, status: 'pending' },
                {
                    status: 'failed',
                    metadata: { ...payout.metadata, failureReason: reason }
                },
                { session }
            );

            await session.commitTransaction();
            logger.info(`Payout ${currentPayout.reference} failed and refunded. Reason: ${reason}`);
        } catch (error) {
            await session.abortTransaction();
            logger.error(`Error handling payout failure for ${payout.reference}`, error);
        } finally {
            session.endSession();
        }
    }

    /**
     * Handle payout success (finalize)
     */
    async handlePayoutSuccess(payout: any, externalAmount?: number): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Defensive Check: Status Transition
            const currentPayout = await Payout.findById(payout._id).session(session);
            if (!currentPayout || ['COMPLETED', 'FAILED', 'MANUAL_REVIEW'].includes(currentPayout.status)) {
                logger.warn(`Payout ${payout.reference} already in terminal state: ${currentPayout?.status}`);
                await session.abortTransaction();
                return;
            }

            // Defensive Check: Amount Matching
            if (externalAmount !== undefined && externalAmount !== currentPayout.amount) {
                logger.error(`CRITICAL: Payout ${payout.reference} amount mismatch! Expected ${currentPayout.amount}, got ${externalAmount}`);
                currentPayout.status = 'MANUAL_REVIEW';
                currentPayout.failureReason = `Amount mismatch: expected ${currentPayout.amount}, got ${externalAmount}`;
                await currentPayout.save({ session });
                await session.commitTransaction();
                return;
            }

            currentPayout.status = 'COMPLETED';
            currentPayout.completedAt = new Date();
            await currentPayout.save({ session });

            const wallet = await Wallet.findOne({ userId: currentPayout.userId }).session(session);
            if (wallet) {
                const balanceBefore = wallet.balance;
                wallet.lockedBalance -= currentPayout.amount;
                wallet.balance -= currentPayout.amount; // Permanently reduce total balance
                await wallet.save({ session });

                // Update Ledger Entry
                await Transaction.findOneAndUpdate(
                    { reference: currentPayout.reference, status: 'pending' },
                    {
                        status: 'success',
                        balanceBefore: balanceBefore,
                        balanceAfter: wallet.balance,
                        clearedAt: new Date()
                    },
                    { session }
                );
            }

            await session.commitTransaction();
            logger.info(`Payout ${currentPayout.reference} completed successfully.`);

            // Trigger Email Notification (outside transaction)
            this.sendPayoutSuccessNotification(currentPayout).catch(err => {
                logger.error(`Failed to send payout success email for ${currentPayout.reference}`, err);
            });
        } catch (error) {
            await session.abortTransaction();
            logger.error(`Error handling payout success for ${payout.reference}`, error);
        } finally {
            session.endSession();
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

                    const response = await zainpayService.verifyTransfer(payout.reference);

                    if (response.code === '00') {
                        const status = response.data?.txnStatus;
                        const amount = response.data?.amount;

                        if (status === 'success') {
                            await this.handlePayoutSuccess(payout, amount ? parseInt(amount, 10) : undefined);
                        } else if (status === 'failed') {
                            await this.handlePayoutFailure(payout, 'Zainpay reported failure');
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
                        // Error from verify API or non-00 code
                        if (payout.retryCount >= MAX_RECONCILE_RETRIES) {
                            payout.status = 'MANUAL_REVIEW';
                            payout.failureReason = `Max reconciliation retries reached. Verify API error: ${response.description}`;
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
