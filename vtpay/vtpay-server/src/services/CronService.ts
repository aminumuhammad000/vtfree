import cron from 'node-cron';
import { Transaction } from '../models/Transaction';
import { Wallet } from '../models/Wallet';
import { logger } from '../utils/logger';

export class CronService {
    /**
     * Start the deposit clearance job
     * Checks every minute for transactions that have matured (24h)
     */
    public startDepositClearanceJob() {
        // Run every minute
        cron.schedule('* * * * *', async () => {
            try {
                // logger.info('Running Deposit Clearance Job...');

                // 24 Hours Ago (plus small buffer if needed, e.g. 1 minute to avoid race conditions with exact ms)
                // User asked for "24 hour and 5 minute"
                const clearanceThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000 - 5 * 60 * 1000);

                const transactionsToClear = await Transaction.find({
                    type: 'credit', // Deposits are credits
                    category: { $in: ['deposit', 'transfer'] }, // Only deposits (and pending transfers if applicable)
                    status: 'success', // Must be successful
                    isCleared: false, // Not yet cleared
                    createdAt: { $lte: clearanceThreshold } // Older than 24h 5m
                }).limit(50); // Process in batches of 50 to avoid locking

                if (transactionsToClear.length === 0) return;

                logger.info(`Found ${transactionsToClear.length} pending deposits to clear.`);

                for (const txn of transactionsToClear) {
                    try {
                        // 1. Mark Transaction as Cleared
                        txn.isCleared = true;
                        txn.clearedAt = new Date();
                        await txn.save();

                        // 2. Credit the Wallet's Cleared Balance
                        const result = await Wallet.findOneAndUpdate(
                            { _id: txn.walletId },
                            { $inc: { clearedBalance: txn.amount } },
                            { new: true }
                        );

                        if (result) {
                            logger.info(`Cleared Deposit ${txn.reference}: ₦${txn.amount / 100} released to wallet.`);
                        } else {
                            logger.error(`Critical: Wallet not found for transaction ${txn.reference}`);
                        }

                    } catch (err) {
                        logger.error(`Failed to clear transaction ${txn.reference}`, err);
                    }
                }

            } catch (error) {
                logger.error('Error in Deposit Clearance Job', error);
            }
        });

        logger.info('Cron Service: Deposit Clearance Job scheduled (Every Minute).Checking for deposits older than 24h 5m.');
    }
}

export const cronService = new CronService();
export default cronService;
