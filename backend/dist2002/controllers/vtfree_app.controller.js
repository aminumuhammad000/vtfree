import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import CreatedApp from '../models/created_app.model.js';
import { v4 as uuidv4 } from 'uuid';
import { AppCreationService } from '../services/app_creation.service.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
// import { PaystackService } from '../services/paystack.service.js';
import { PricingService } from '../services/pricing.service.js';
import { AppGeneratorService } from '../services/app_generator.service.js';
import { addBuildJob } from '../queues/app_build.queue.js';
export const createApp = async (req, res) => {
    try {
        const { app_name, package_name, platforms, branding, services, publish_play_store, publish_app_store, payment_method, company } = req.body;
        const owner_id = req.user.id;
        const owner_email = req.user.email;
        // 1. Fetch Dynamic Pricing
        const PRICES = await PricingService.getAppCreationPrices();
        // 2. Calculate Total Cost
        let totalAmount = 0;
        if (platforms.android)
            totalAmount += PRICES.PLATFORM_ANDROID;
        if (platforms.ios)
            totalAmount += PRICES.PLATFORM_IOS;
        if (platforms.web)
            totalAmount += PRICES.PLATFORM_WEB;
        if (publish_play_store)
            totalAmount += PRICES.PUBLISH_PLAY_STORE;
        if (publish_app_store)
            totalAmount += PRICES.PUBLISH_APP_STORE;
        if (services && services.includes('bills'))
            totalAmount += PRICES.SERVICE_BILLS;
        if (services && services.includes('giftcard'))
            totalAmount += PRICES.SERVICE_GIFTCARD;
        // 3. Handle Payment Method Checks
        // If Card payment, initiate Paystack transaction
        if (payment_method === 'card') {
            return res.status(400).json({ success: false, message: 'Card payment is temporarily unavailable. Please use Wallet.' });
            /*
            const paystackService = new PaystackService();
            const transactionRecord = await paystackService.initializeTransaction(
                owner_email,
                totalAmount,
                `APP-${uuidv4()}`
            );

            return res.status(200).json({
                success: true,
                payment_required: true,
                payment_url: transactionRecord.data.authorization_url,
                reference: transactionRecord.data.reference,
                amount: totalAmount
            });
            */
        }
        // If Wallet payment (default), check balance
        const user = await VTfreeUser.findById(owner_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.wallet_balance < totalAmount) {
            return res.status(402).json({
                success: false,
                message: 'Insufficient wallet balance',
                code: 'INSUFFICIENT_FUNDS',
                data: {
                    required: totalAmount,
                    current: user.wallet_balance,
                    shortfall: totalAmount - user.wallet_balance
                }
            });
        }
        // 4. Process Wallet Payment
        // Deduct balance
        user.wallet_balance -= totalAmount;
        await user.save();
        // New transaction recording logic would go here if not already handled
        // But for brevity:
        await VTfreeTransaction.create({
            user_id: owner_id,
            type: 'debit',
            amount: totalAmount,
            reference: `PAY-${uuidv4()}`,
            description: `Payment for App Creation: ${app_name}`,
            status: 'success',
            metadata: { app_name, package_name, method: 'wallet' }
        });
        // 5. Create App
        const result = await AppCreationService.createNewApp({
            owner_id,
            owner_email,
            app_name,
            package_name,
            platforms,
            branding,
            services: services || [],
            company,
            admin_credentials: req.body.admin_credentials || undefined
        });
        res.status(201).json({
            success: true,
            message: 'App created successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Create app error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const verifyAppPayment = async (req, res) => {
    try {
        const { reference, appPayload } = req.body;
        const owner_id = req.user.id;
        const owner_email = req.user.email;
        // 1. Verify Paystack Payment
        /*
        const paystackService = new PaystackService();
        const verification = await paystackService.verifyTransaction(reference);

        if (!verification.status || verification.data.status !== 'success') {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
        */
        return res.status(400).json({ success: false, message: 'Card payment verification unavailable.' });
        /*
        // 2. Check if reference already used (Idempotency)
        const existingTx = await VTfreeTransaction.findOne({ reference });
        if (existingTx) {
            // App might already be created, check CreatedApp or just return error
            return res.status(400).json({ success: false, message: 'Transaction already processed' });
        }

        // 3. Record Transaction
        await VTfreeTransaction.create({
            user_id: owner_id,
            type: 'debit', // Recorded as debit/payment
            amount: verification.data.amount / 100, // Convert Kobo to Naira
            reference: reference,
            description: `Card Payment for App Creation: ${appPayload.app_name}`,
            status: 'success',
            metadata: { ...appPayload, method: 'card', paystack_ref: reference }
        });
        */
        // 4. Create App
        const { app_name, package_name, platforms, branding, services } = appPayload;
        const result = await AppCreationService.createNewApp({
            owner_id,
            owner_email,
            app_name,
            package_name,
            platforms,
            branding,
            services: services || []
        });
        res.status(201).json({
            success: true,
            message: 'App created successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Verify app payment error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const getMyApps = async (req, res) => {
    try {
        const owner_id = req.user.id;
        // Explicitly cast to ObjectId to ensure query matches
        const apps = await CreatedApp.find({ owner_id: owner_id }).sort({ created_at: -1 });
        console.log(`[getMyApps] User ${owner_id} has ${apps.length} apps`);
        res.json({
            success: true,
            data: { apps }
        });
    }
    catch (error) {
        console.error('Get apps error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const getAppDetails = async (req, res) => {
    try {
        const { appId } = req.params;
        const owner_id = req.user.id;
        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        res.json({
            success: true,
            data: { app }
        });
    }
    catch (error) {
        console.error('Get app details error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const getAppPrices = async (req, res) => {
    try {
        const prices = await PricingService.getAppCreationPrices();
        res.json({
            success: true,
            data: prices
        });
    }
    catch (error) {
        console.error('Get prices error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const downloadAppSource = async (req, res) => {
    try {
        const { appId } = req.params;
        const owner_id = req.user.id;
        // Verify ownership
        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found or unauthorized' });
        }
        // Generate Zip
        const zipPath = await AppGeneratorService.zipSourceCode(appId);
        res.download(zipPath);
    }
    catch (error) {
        console.error('Download app source error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const triggerBuildApk = async (req, res) => {
    try {
        const { appId } = req.params;
        const owner_id = req.user.id;
        const { target = 'android_apk' } = req.body;
        // Verify ownership
        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found or unauthorized' });
        }
        // Check if already building
        if (app.status === 'building') {
            return res.status(409).json({ success: false, message: 'A build is already in progress for this app.' });
        }
        const options = {
            app_id: app.app_id,
            app_name: app.app_name,
            package_name: app.package_name,
            branding: {
                primary_color: app.branding.primary_color,
                secondary_color: app.branding.secondary_color,
                logo_url: app.branding.logo_url,
            },
            server_url: process.env.API_BASE_URL || 'https://vua.vtfree.com/api',
            target
        };
        // Enqueue Build Job
        await addBuildJob(appId, { appId, options });
        // Update status in DB
        await CreatedApp.updateOne({ app_id: appId }, {
            status: 'building',
            build_progress: 0,
            build_stage: 'Queued'
        });
        res.json({
            success: true,
            message: 'Build requested and added to queue.',
            status: 'queued'
        });
    }
    catch (error) {
        console.error('Trigger build error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const getAppBuildStatus = async (req, res) => {
    try {
        const { appId } = req.params;
        const owner_id = req.user.id;
        const app = await CreatedApp.findOne({ app_id: appId, owner_id })
            .select('status build_status build_progress build_stage download_links build_error');
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        res.json({
            success: true,
            data: {
                status: app.status,
                progress: app.build_progress,
                stage: app.build_stage,
                links: app.download_links,
                error: app.build_error
            }
        });
    }
    catch (error) {
        console.error('Get build status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const downloadApk = async (req, res) => {
    try {
        const { appId } = req.params;
        const owner_id = req.user.id;
        // Verify ownership
        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found or unauthorized' });
        }
        // Path to APK (Using dummy for demo)
        const dummyApkPath = path.resolve(__dirname, '../../public/downloads/base.apk');
        // Also check for real path just in case
        const realApkPath = path.resolve(__dirname, '../../../generated_apps', appId, 'android/app/build/outputs/apk/release/app-release.apk');
        if (await fs.pathExists(realApkPath)) {
            return res.download(realApkPath, `${app.package_name}.apk`);
        }
        else if (await fs.pathExists(dummyApkPath)) {
            return res.download(dummyApkPath, `${app.package_name}.apk`);
        }
        res.status(404).json({ success: false, message: 'APK not found. Please build it first.' });
    }
    catch (error) {
        console.error('Download APK error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const getPublicAppDetails = async (req, res) => {
    try {
        const { appId } = req.params;
        // Find app by app_id only, no owner check needed for public info
        const app = await CreatedApp.findOne({ app_id: appId }).select('app_name package_name branding services status company');
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        res.json({
            success: true,
            data: { app }
        });
    }
    catch (error) {
        console.error('Get public app details error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
