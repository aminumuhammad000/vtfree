import { User, Wallet, Transaction } from '../models/index.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
import { WalletService } from '../services/wallet.service.js';
import { NotificationService } from '../services/notification.service.js';
import logger from '../utils/logger.js';
/**
 * Handle VTStack Webhooks for both platform users and app users
 */
export const handleVTStackWebhook = async (req, res) => {
    try {
        const payload = req.body;
        logger.info('Received VTStack Webhook:', JSON.stringify(payload, null, 2));
        if (!payload || !payload.data) {
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }
        const { event, data } = payload;
        const { reference, accountNumber, amount, status } = data;
        // 1. Handle Payment Success (Funding)
        if (event === 'payment.success') {
            const creditAmount = Number(amount);
            if (!accountNumber || !creditAmount || creditAmount <= 0) {
                return res.status(400).json({ success: false, message: 'Incomplete payment data' });
            }
            // Check if processed
            const appTx = await Transaction.findOne({ reference_number: reference });
            const platformTx = await VTfreeTransaction.findOne({ reference });
            if (appTx || platformTx) {
                return res.status(200).json({ success: true, message: 'Already processed' });
            }
            // A. Check for App User
            const appUser = await User.findOne({ 'virtual_account.account_number': accountNumber });
            if (appUser) {
                let wallet = await Wallet.findOne({ user_id: appUser._id });
                if (!wallet)
                    wallet = await WalletService.createWallet(appUser._id);
                await WalletService.creditWallet(appUser._id, creditAmount);
                const tx = await Transaction.create({
                    user_id: appUser._id,
                    wallet_id: wallet._id,
                    type: 'wallet_topup',
                    amount: creditAmount,
                    status: 'successful',
                    reference_number: reference,
                    payment_method: 'vtstack',
                    description: `Wallet funding via VTStack (${data.bankName || 'Virtual Account'})`,
                    app_id: appUser.app_id,
                    metadata: data
                });
                // Send real-time notification
                await NotificationService.createNotification({
                    user_id: appUser._id,
                    type: 'wallet_funding',
                    title: 'Wallet Funded Successfully',
                    message: `Your wallet has been credited with ₦${creditAmount.toLocaleString()}. Ref: ${reference}`,
                    action_link: '/(tabs)/wallet'
                });
                logger.info(`VTStack Funding: Credited App User ${appUser.email}`);
                return res.status(200).json({ success: true });
            }
            // B. Check for Platform Owner
            const vtUser = await VTfreeUser.findOne({ 'virtual_account.account_number': accountNumber });
            if (vtUser) {
                vtUser.wallet_balance = (vtUser.wallet_balance || 0) + creditAmount;
                await vtUser.save();
                await VTfreeTransaction.create({
                    user_id: vtUser._id,
                    type: 'credit',
                    amount: creditAmount,
                    reference,
                    description: `Platform wallet funding via VTStack`,
                    status: 'success',
                    metadata: data
                });
                logger.info(`VTStack Funding: Credited Platform Owner ${vtUser.email}`);
                return res.status(200).json({ success: true });
            }
        }
        // 2. Handle Transfer (Payout) Updates
        if (event === 'transfer.success' || event === 'transfer.failed') {
            const isSuccess = event === 'transfer.success';
            // Look for the transaction by reference
            const tx = await Transaction.findOne({ reference_number: reference });
            if (tx) {
                tx.status = isSuccess ? 'successful' : 'failed';
                if (data.reason || data.message) {
                    tx.description = `${tx.description} - ${data.reason || data.message}`;
                }
                await tx.save();
                // If failed, refund the user
                if (!isSuccess) {
                    await WalletService.creditWallet(tx.user_id, tx.amount + (tx.fee || 0));
                    logger.info(`VTStack Payout: Refunded ${tx.amount} to user ${tx.user_id} due to failure`);
                }
                // Notify User
                await NotificationService.createNotification({
                    user_id: tx.user_id,
                    type: 'payout_update',
                    title: isSuccess ? 'Transfer Successful' : 'Transfer Failed',
                    message: isSuccess
                        ? `Your transfer of ₦${tx.amount.toLocaleString()} was successful.`
                        : `Your transfer of ₦${tx.amount.toLocaleString()} failed. Amount has been refunded to your wallet.`,
                    action_link: '/(tabs)/transactions'
                });
                return res.status(200).json({ success: true });
            }
        }
        return res.status(200).json({ success: true, message: 'Event received but no action taken' });
    }
    catch (error) {
        logger.error('VTStack Webhook processing error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
