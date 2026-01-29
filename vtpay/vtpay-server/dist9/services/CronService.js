"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronService = exports.CronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Transaction_1 = require("../models/Transaction");
const Wallet_1 = require("../models/Wallet");
const logger_1 = require("../utils/logger");
class CronService {
    /**
     * Start the deposit clearance job
     * Checks every minute for transactions that have matured (24h)
     */
    startDepositClearanceJob() {
        // Run every minute
        node_cron_1.default.schedule('* * * * *', async () => {
            try {
                // logger.info('Running Deposit Clearance Job...');
                // 24 Hours Ago (plus small buffer if needed, e.g. 1 minute to avoid race conditions with exact ms)
                // User asked for "24 hour and 5 minute"
                const clearanceThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000 - 5 * 60 * 1000);
                const transactionsToClear = await Transaction_1.Transaction.find({
                    type: 'credit', // Deposits are credits
                    category: { $in: ['deposit', 'transfer'] }, // Only deposits (and pending transfers if applicable)
                    status: 'success', // Must be successful
                    isCleared: false, // Not yet cleared
                    createdAt: { $lte: clearanceThreshold } // Older than 24h 5m
                }).limit(50); // Process in batches of 50 to avoid locking
                if (transactionsToClear.length === 0)
                    return;
                logger_1.logger.info(`Found ${transactionsToClear.length} pending deposits to clear.`);
                for (const txn of transactionsToClear) {
                    try {
                        // 1. Mark Transaction as Cleared
                        txn.isCleared = true;
                        txn.clearedAt = new Date();
                        await txn.save();
                        // 2. Credit the Wallet's Cleared Balance
                        const result = await Wallet_1.Wallet.findOneAndUpdate({ _id: txn.walletId }, { $inc: { clearedBalance: txn.amount } }, { new: true });
                        if (result) {
                            logger_1.logger.info(`Cleared Deposit ${txn.reference}: ₦${txn.amount / 100} released to wallet.`);
                        }
                        else {
                            logger_1.logger.error(`Critical: Wallet not found for transaction ${txn.reference}`);
                        }
                    }
                    catch (err) {
                        logger_1.logger.error(`Failed to clear transaction ${txn.reference}`, err);
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Error in Deposit Clearance Job', error);
            }
        });
        logger_1.logger.info('Cron Service: Deposit Clearance Job scheduled (Every Minute).Checking for deposits older than 24h 5m.');
    }
}
exports.CronService = CronService;
exports.cronService = new CronService();
exports.default = exports.cronService;
//# sourceMappingURL=CronService.js.map