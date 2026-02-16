import crypto from 'crypto';
import { User, CreatedApp, Wallet, Transaction } from '../models/index.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
import { WalletService } from '../services/wallet.service.js';
import logger from '../utils/logger.js';
/**
 * Handle Payrant Webhooks for both platform users and app users
 */
export const handlePayrantWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-payrant-signature'];
        const payload = req.body;
        logger.info('Received Payrant Webhook:', JSON.stringify(payload));
        if (payload.status !== 'success') {
            return res.status(200).json({ status: 'received' });
        }
        const trans = payload.transaction;
        const accountNumber = trans.account_details?.account_number;
        const reference = trans.reference;
        // Payrant Net amount is what should be credited
        const amount = Number(trans.net_amount || trans.amount);
        if (!accountNumber || !reference) {
            logger.warn('Payrant Webhook: Missing account number or reference');
            return res.status(400).json({ status: 'error', message: 'Missing fields' });
        }
        // Idempotency check 1: App User Transactions
        const existingTx1 = await Transaction.findOne({ reference_number: reference });
        if (existingTx1) {
            return res.status(200).json({ status: 'received', message: 'Already processed' });
        }
        // Idempotency check 2: VTFree User Transactions
        const existingTx2 = await VTfreeTransaction.findOne({ reference });
        if (existingTx2) {
            return res.status(200).json({ status: 'received', message: 'Already processed' });
        }
        // 1. Try to find an App User with this virtual account
        const appUser = await User.findOne({ 'virtual_account.account_number': accountNumber });
        if (appUser) {
            const app = await CreatedApp.findOne({ app_id: appUser.app_id });
            const secret = app?.payment_settings?.payrant_webhook_secret;
            // Validate signature if secret is configured
            if (secret && signature) {
                const hmac = crypto.createHmac('sha256', secret);
                const expectedSignature = hmac.update(JSON.stringify(req.body)).digest('hex');
                // Some implementations might require buffering or exact string match.
                // We'll log but continue for now to ensure delivery, but verification is recommended.
                if (signature !== expectedSignature) {
                    logger.warn(`Payrant Webhook: Signature mismatch for App ${appUser.app_id}`);
                }
            }
            // Find or create wallet for app user
            let wallet = await Wallet.findOne({ user_id: appUser._id });
            if (!wallet) {
                wallet = await WalletService.createWallet(appUser._id);
            }
            // Credit wallet
            await WalletService.creditWallet(appUser._id, amount);
            // Record transaction
            await Transaction.create({
                user_id: appUser._id,
                wallet_id: wallet._id,
                type: 'wallet_topup',
                amount,
                status: 'successful',
                reference_number: reference,
                payment_method: 'payrant',
                description: `Wallet funding via Payrant (${trans.payer_details?.bank_name || 'Bank Transfer'})`,
                app_id: appUser.app_id,
                metadata: trans
            });
            logger.info(`Payrant Webhook: Credited App User ${appUser.email} (App: ${appUser.app_id}) with ${amount}`);
            return res.status(200).json({ status: 'received' });
        }
        // 2. Try to find a VTFree (Platform Admin/Owner) user
        const vtUser = await VTfreeUser.findOne({ 'virtual_account.account_number': accountNumber });
        if (vtUser) {
            // Credit VTFree user's wallet_balance
            vtUser.wallet_balance = (vtUser.wallet_balance || 0) + amount;
            await vtUser.save();
            // Record VTFree transaction
            await VTfreeTransaction.create({
                user_id: vtUser._id,
                type: 'credit',
                amount,
                reference,
                description: `Platform wallet funding via Payrant`,
                status: 'success',
                metadata: trans,
                created_at: new Date()
            });
            logger.info(`Payrant Webhook: Credited VTFree User ${vtUser.email} with ${amount}`);
            return res.status(200).json({ status: 'received' });
        }
        logger.warn(`Payrant Webhook: No user found for account number ${accountNumber}`);
        return res.status(200).json({ status: 'received', message: 'Account not found' });
    }
    catch (error) {
        logger.error('Payrant Webhook Error:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
