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
        const appIdFromUrl = req.params.appId;
        logger.info(`[VTStack Webhook] Received Event: ${payload?.event}${appIdFromUrl ? ` | AppId: ${appIdFromUrl}` : ''}`);
        // Detailed log for debugging
        logger.debug(`[VTStack Webhook] Full Payload: ${JSON.stringify(payload)}`);
        if (!payload || !payload.data) {
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }
        const { event, data } = payload;
        const { reference, accountNumber, amount } = data;
        // VTStack documentation says event is 'payment.success' for completions
        if (event !== 'payment.success') {
            logger.info(`[VTStack Webhook] Ignoring non-payment event: ${event}`);
            return res.status(200).json({ success: true, message: 'Event ignored' });
        }
        const creditAmount = Number(amount);
        if (!accountNumber || !creditAmount || creditAmount <= 0) {
            logger.warn(`[VTStack Webhook] Incomplete data: account=${accountNumber}, amount=${amount}`);
            return res.status(400).json({ success: false, message: 'Incomplete payment data' });
        }
        // Idempotency: Check if already processed
        const [appTx, platformTx] = await Promise.all([
            Transaction.findOne({ reference_number: reference }),
            VTfreeTransaction.findOne({ reference })
        ]);
        if (appTx || platformTx) {
            logger.info(`[VTStack Webhook] Reference already processed: ${reference}`);
            return res.status(200).json({ success: true, message: 'Already processed' });
        }
        // FIND THE RECIPIENT
        // Priority 1: Check App User (User model)
        let userQuery = { 'virtual_account.account_number': accountNumber };
        // If appId is in URL, we prioritize searching within that app for speed, but fallback to global search if not found
        if (appIdFromUrl) {
            userQuery.app_id = appIdFromUrl;
        }
        let appUser = await User.findOne(userQuery);
        // Fallback: If not found with specific appId (or no appId provided), search all app users by account number
        if (!appUser && appIdFromUrl) {
            appUser = await User.findOne({ 'virtual_account.account_number': accountNumber });
        }
        if (appUser) {
            logger.info(`[VTStack Webhook] Processing funding for App User: ${appUser.email} (App: ${appUser.app_id})`);
            let wallet = await Wallet.findOne({ user_id: appUser._id });
            if (!wallet)
                wallet = await WalletService.createWallet(appUser._id);
            await WalletService.creditWallet(appUser._id, creditAmount);
            await Transaction.create({
                user_id: appUser._id,
                wallet_id: wallet._id,
                type: 'wallet_topup',
                amount: creditAmount,
                fee: 0,
                total_charged: creditAmount,
                status: 'successful',
                reference_number: reference,
                payment_method: 'vtstack',
                description: `Wallet funding via VTStack (${data.bankName || 'PalmPay'})`,
                app_id: appUser.app_id,
                metadata: data
            });
            // Send notification
            await NotificationService.createNotification({
                user_id: appUser._id,
                type: 'wallet_funding',
                title: 'Wallet Funded Successfully',
                message: `Your wallet has been credited with ₦${creditAmount.toLocaleString()}. Ref: ${reference}`,
                action_link: '/(tabs)/wallet'
            });
            return res.status(200).json({ success: true, message: 'App user funded' });
        }
        // Priority 2: Check Platform Owner (VTfreeUser model)
        const vtUser = await VTfreeUser.findOne({ 'virtual_account.account_number': accountNumber });
        if (vtUser) {
            logger.info(`[VTStack Webhook] Processing funding for Platform Owner: ${vtUser.email}`);
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
            return res.status(200).json({ success: true, message: 'Platform owner funded' });
        }
        logger.warn(`[VTStack Webhook] No user found for account number: ${accountNumber}`);
        return res.status(404).json({ success: false, message: 'Recipient not found' });
    }
    catch (error) {
        logger.error('[VTStack Webhook] Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
