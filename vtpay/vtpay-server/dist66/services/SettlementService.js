"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settlementService = exports.SettlementService = void 0;
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
class SettlementService {
    /**
     * Handle Zainpay settlement webhook
     * This clears pending balances for all users whose transactions were part of this settlement.
     */
    async handleSettlementWebhook(payload) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const { zainboxCode, amount, settlementId, status } = payload;
            // Only process completed settlements
            if (status !== 'completed' && status !== 'Successful') {
                logger_1.logger.info(`Settlement ${settlementId} status is ${status}, skipping balance clearing.`);
                await session.abortTransaction();
                return;
            }
            // 1. Create settlement ledger entry
            const ledger = new models_1.ZainboxSettlementLedger({
                zainboxCode,
                amount: parseFloat(amount),
                settlementId,
                status: 'completed',
                settledAt: new Date(),
            });
            // 2. Find all successful but uncleared transactions
            // In a real scenario, we might want to filter by date or specific transaction IDs if provided by Zainpay.
            // For T1, we clear everything that was successful and not yet cleared.
            const transactions = await models_1.Transaction.find({
                status: 'success',
                isCleared: false,
                type: 'credit', // Only credits (deposits) are cleared
                category: 'deposit',
            }).session(session);
            if (transactions.length === 0) {
                logger_1.logger.info(`No uncleared transactions found for settlement ${settlementId}`);
                ledger.status = 'completed';
                await ledger.save({ session });
                await session.commitTransaction();
                return;
            }
            const transactionIds = transactions.map(t => t._id);
            ledger.transactionIds = transactionIds;
            await ledger.save({ session });
            // 3. Update transactions and wallet balances
            for (const txn of transactions) {
                txn.isCleared = true;
                txn.clearedAt = new Date();
                await txn.save({ session });
                // Update user's cleared balance
                const wallet = await models_1.Wallet.findOne({ userId: txn.userId }).session(session);
                if (wallet) {
                    wallet.clearedBalance += txn.amount;
                    await wallet.save({ session });
                    logger_1.logger.info(`Cleared ${txn.amount} for user ${txn.userId} from transaction ${txn.reference}`);
                }
                else {
                    logger_1.logger.warn(`Wallet not found for user ${txn.userId} during settlement ${settlementId}`);
                }
            }
            await session.commitTransaction();
            logger_1.logger.info(`Settlement ${settlementId} processed successfully. ${transactions.length} transactions cleared.`);
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.logger.error('Failed to process settlement webhook', error);
            throw error;
        }
        finally {
            session.endSession();
        }
    }
}
exports.SettlementService = SettlementService;
exports.settlementService = new SettlementService();
exports.default = exports.settlementService;
//# sourceMappingURL=SettlementService.js.map