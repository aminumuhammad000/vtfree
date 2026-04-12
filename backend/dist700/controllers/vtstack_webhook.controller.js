import crypto from 'crypto';
import { User, CreatedApp, Wallet, Transaction } from '../models/index.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
import { WalletService } from '../services/wallet.service.js';
import { NotificationService } from '../services/notification.service.js';
import { configService } from '../services/config.service.js';
import logger from '../utils/logger.js';
/**
 * Handle VTStack Webhooks for both platform users and app users
 */
export const handleVTStackWebhook = async (req, res) => {
    try {
        const appIdFromUrl = req.params.appId;
        const secretHeader = req.headers['x-vtstack-secret'];
        const signatureHeader = req.headers['x-vtstack-signature'];
        logger.info("HEADERS: " + JSON.stringify(req.headers));
        const rawBody = req.rawBody;
        if (!rawBody) {
            logger.error('[VTStack Webhook] req.rawBody is missing! Express middleware not configured correctly.');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }
        const payload = req.body;
        // --- SECURITY VERIFICATION ---
        // 1. Check for required headers
        if (!secretHeader || !signatureHeader) {
            logger.warn(`[VTStack Webhook] Missing security headers for appId: ${appIdFromUrl || 'platform'}`);
            return res.status(401).json({ success: false, message: 'Missing security headers' });
        }
        let expectedSecret = '';
        if (appIdFromUrl) {
            // Get that specific app's secret strictly from the database
            const app = await CreatedApp.findOne({ app_id: appIdFromUrl });
            if (!app) {
                logger.warn(`[VTStack Webhook] App not found for appId: ${appIdFromUrl}`);
                return res.status(404).json({ success: false, message: 'App not found' });
            }
            // Prioritize secret key if available, fallback to api_key
            expectedSecret = (app.payment_settings?.vtstack_secret_key || app.payment_settings?.vtstack_api_key || '').trim();
            if (!expectedSecret) {
                logger.warn(`[VTStack Webhook] No vtstack credentials configured for appId: ${appIdFromUrl}`);
                return res.status(403).json({ success: false, message: 'Webhook secret not configured for app' });
            }
        }
        else {
            // Global/Platform webhook fallback logic - ONLY from database via configService
            const userWebhookSecret = await configService.get('USER_WEBHOOK_SECRET');
            const vtstackSecretKey = await configService.get('VTSTACK_SECRET_KEY');
            expectedSecret = (userWebhookSecret || vtstackSecretKey || '').trim();
            if (!expectedSecret) {
                logger.error('[VTStack Webhook] No global webhook secret found in database!');
                return res.status(403).json({ success: false, message: 'Global webhook secret not configured' });
            }
        }
        // --- DUAL MODE VERIFICATION ---
        let isValid = false;
        let verificationMode = 'NONE';
        // 1. HMAC Mode (VTStack standard)
        if (signatureHeader) {
            verificationMode = 'HMAC-SHA256';
            const hmac = crypto.createHmac('sha256', expectedSecret);
            hmac.update(rawBody);
            const calculatedSignature = hmac.digest('hex');
            isValid = (signatureHeader === calculatedSignature);
            logger.info(`[VTStack Webhook] Mode: ${verificationMode} | Valid: ${isValid}`);
            if (!isValid) {
                logger.warn(`[VTStack Webhook] Signature mismatch. Expected: ${calculatedSignature.substring(0, 8)}... Received: ${signatureHeader.substring(0, 8)}...`);
            }
        }
        // 2. RSA Mode (PalmPay / Legacy)
        else if (payload.sign) {
            verificationMode = 'RSA-SHA1'; // Common for PalmPay
            logger.info(`[VTStack Webhook] Mode: ${verificationMode} | Checking signature in payload.sign`);
            // RSA logic would go here once Public Key is available
            // For now, we'll mark it as potentially valid if bypassed
            isValid = false;
        }
        // --- SECURITY ENFORCEMENT (Bypassed for testing as per user request) ---
        if (secretHeader !== expectedSecret) {
            logger.warn(`[VTStack Webhook] Secret Header Mismatch! Header: ${secretHeader}, DB: ${expectedSecret}`);
            logger.warn(`[VTStack Webhook] BYPASS: Proceeding despite secret mismatch...`);
        }
        if (!isValid) {
            logger.warn(`[VTStack Webhook] BYPASS: Proceeding despite ${verificationMode} validation failure...`);
            // In production, you would: return res.status(403).json({ success: false, message: 'Invalid signature' });
        }
        logger.info(`[VTStack Webhook] Received Event: ${payload?.event}${appIdFromUrl ? ` | AppId: ${appIdFromUrl}` : ''}`);
        // Detailed log for debugging
        logger.debug(`[VTStack Webhook] Full Payload: ${JSON.stringify(payload)}`);
        if (!payload || !payload.data) {
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }
        const { event, data } = payload;
        const reference = data?.reference;
        const amount = data?.amount;
        // Prioritize virtualAccount as it typically represents the receiving account
        const accountNumber = data?.virtualAccount || data?.customer?.accountNumber;
        logger.info(`[VTStack Webhook] Received Event: ${event}${appIdFromUrl ? ` | AppId: ${appIdFromUrl}` : ''} | Ref: ${reference} | Account: ${accountNumber}`);
        // Handle both standard VTStack event and any legacy 'payment.success'
        if (event !== 'transaction.deposit' && event !== 'payment.success') {
            logger.info(`[VTStack Webhook] Ignoring non-payment event: ${event}`);
            return res.status(200).json({ success: true, message: 'Event ignored' });
        }
        const creditAmount = Number(amount) / 100;
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
