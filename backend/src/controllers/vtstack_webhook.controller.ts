import { Request, Response } from 'express';
import { User, CreatedApp, VirtualAccount, Wallet, Transaction } from '../models/index.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
import { WalletService } from '../services/wallet.service.js';
import logger from '../utils/logger.js';

/**
 * Handle VTStack Webhooks for both platform users and app users
 * 
 * Sample Payload:
 * {
 *   "event": "payment.success",
 *   "data": {
 *     "amount": 5000,
 *     "reference": "unique_ref_001",
 *     "accountNumber": "1234567890",
 *     "customer": "John Doe",
 *     "timestamp": "2024-01-15T12:00:00.000Z"
 *   }
 * }
 */
export const handleVTStackWebhook = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        logger.info('Received VTStack Webhook:', JSON.stringify(payload, null, 2));

        // 1. Basic Validation
        if (!payload || !payload.data) {
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }

        // Check if it's a successful payment event
        if (payload.event !== 'payment.success') {
            return res.status(200).json({ success: true, message: 'Event ignored' });
        }

        const data = payload.data;
        const { reference, accountNumber, amount } = data;

        // Treat as Naira based on provided documentation example (5000 Naira vs 50 Naira if kobo)
        const creditAmount = Number(amount);

        if (!reference || !accountNumber || !creditAmount || creditAmount <= 0) {
            logger.warn('VTStack Webhook: Missing reference, account number or valid amount', { reference, accountNumber, amount });
            return res.status(400).json({ success: false, message: 'Incomplete data' });
        }

        // Idempotency check 1: App User Transactions
        const existingTx1 = await Transaction.findOne({ reference_number: reference });
        if (existingTx1) {
            return res.status(200).json({ success: true, message: 'Already processed (App User)' });
        }

        // Idempotency check 2: VTFree User Transactions
        const existingTx2 = await VTfreeTransaction.findOne({ reference });
        if (existingTx2) {
            return res.status(200).json({ success: true, message: 'Already processed (Platform Owner)' });
        }

        // 2. Try to find an App User (Customer of a created app)
        const appUser = await User.findOne({ 'virtual_account.account_number': accountNumber });

        if (appUser) {
            // Find or create wallet for app user
            let wallet = await Wallet.findOne({ user_id: appUser._id });
            if (!wallet) {
                wallet = await WalletService.createWallet(appUser._id as any);
            }

            // Credit wallet
            await WalletService.creditWallet(appUser._id as any, creditAmount);

            // Record transaction
            await Transaction.create({
                user_id: appUser._id,
                wallet_id: wallet._id,
                type: 'wallet_topup',
                amount: creditAmount,
                status: 'successful',
                reference_number: reference,
                payment_method: 'vtstack',
                description: `Wallet funding via VTStack (${data.bankName || 'PalmPay'})`,
                app_id: appUser.app_id,
                metadata: data
            });

            logger.info(`VTStack Webhook: Credited App User ${appUser.email} with ${creditAmount}`);
            return res.status(200).json({ success: true, message: 'Webhook processed (App User)' });
        }

        // 3. Try to find a VTFree (Platform Owner) user
        const vtUser = await VTfreeUser.findOne({ 'virtual_account.account_number': accountNumber });
        if (vtUser) {
            // Credit VTFree user's wallet_balance
            vtUser.wallet_balance = (vtUser.wallet_balance || 0) + creditAmount;
            await vtUser.save();

            // Record VTFree transaction
            await VTfreeTransaction.create({
                user_id: vtUser._id,
                type: 'credit',
                amount: creditAmount,
                reference,
                description: `Platform wallet funding via VTStack (${data.bankName || 'PalmPay'})`,
                status: 'success',
                metadata: data,
                created_at: new Date()
            });

            logger.info(`VTStack Webhook: Credited VTFree User ${vtUser.email} with ${creditAmount}`);
            return res.status(200).json({ success: true, message: 'Webhook processed (Platform Owner)' });
        }

        logger.warn(`VTStack Webhook: No user found for account number ${accountNumber}`);
        return res.status(200).json({ success: true, message: 'User not found' });

    } catch (error: any) {
        logger.error('VTStack Webhook processing error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
