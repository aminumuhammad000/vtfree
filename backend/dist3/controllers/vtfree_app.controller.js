import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import CreatedApp from '../models/created_app.model.js';
import AppAdmin from '../models/app_admin.model.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AppCreationService } from '../services/app_creation.service.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
// import { PaystackService } from '../services/paystack.service.js';
import { PricingService } from '../services/pricing.service.js';
import { GitHubAutomationService } from '../services/github_automation.service.js';
import { AppGeneratorService } from '../services/app_generator.service.js';
import { addBuildJob } from '../queues/app_build.queue.js';
import { cloudinaryService } from '../services/cloudinary.service.js';
import { EmailService } from '../services/email.service.js';
export const createApp = async (req, res) => {
    try {
        const { app_name, package_name, platforms, branding, services, publish_play_store, publish_app_store, publish_web, payment_method, company } = req.body;
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
        if (publish_web)
            totalAmount += PRICES.PUBLISH_WEB;
        if (services && services.includes('bills'))
            totalAmount += PRICES.SERVICE_BILLS;
        if (services && services.includes('giftcard'))
            totalAmount += PRICES.SERVICE_GIFTCARD;
        // 3. Handle Payment Method Checks
        // If Card payment, initiate Paystack transaction
        if (payment_method === 'card') {
            return res.status(400).json({ success: false, message: 'Card payment is temporarily unavailable. Please use Wallet.' });
            /*
            const vtpayService = new VtpayService();
            const transactionRecord = await vtpayService.initializeTransaction(
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
            // INSUFFICIENT FUNDS: Save app as pending instead of failing
            const result = await AppCreationService.createNewApp({
                owner_id,
                owner_email,
                app_name,
                package_name,
                platforms,
                branding,
                services: services || [],
                company,
                admin_credentials: req.body.admin_credentials || undefined,
                payment_status: 'pending',
                publish_play_store,
                publish_app_store,
                publish_web
            });
            return res.status(201).json({
                success: true,
                message: 'App details saved. Please fund your wallet to complete the build.',
                code: 'INSUFFICIENT_FUNDS_SAVED',
                saved_offline: true,
                data: result
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
            admin_credentials: req.body.admin_credentials || undefined,
            publish_play_store,
            publish_app_store,
            publish_web
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
            services: services || [],
            publish_play_store: appPayload.publish_play_store,
            publish_app_store: appPayload.publish_app_store,
            publish_web: appPayload.publish_web
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
        const admins = await AppAdmin.find({ app_id: appId }).select('email first_name last_name role status app_id');
        res.json({
            success: true,
            data: { app, admins }
        });
    }
    catch (error) {
        console.error('Get app details error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const addAppAdmin = async (req, res) => {
    try {
        const { appId } = req.params;
        const owner_id = req.user.id;
        const { email, password, first_name, last_name, role = 'admin' } = req.body;
        // Verify App Ownership
        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        // Check if admin exists
        const existingAdmin = await AppAdmin.findOne({ app_id: appId, email });
        if (existingAdmin) {
            return res.status(400).json({ success: false, message: 'Admin with this email already exists for this app.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await AppAdmin.create({
            app_id: appId,
            email,
            password: hashedPassword,
            first_name,
            last_name,
            role,
            status: 'active',
            created_by: owner_id
        });
        res.status(201).json({
            success: true,
            message: 'Admin added successfully',
            data: {
                id: newAdmin._id,
                email: newAdmin.email,
                role: newAdmin.role,
                status: newAdmin.status,
                app_id: newAdmin.app_id
            }
        });
    }
    catch (error) {
        console.error('Add app admin error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
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
        const user = req.user;
        const owner_id = user.id;
        const { target = 'android_apk' } = req.body || {};
        // Find app
        const app = await CreatedApp.findOne({ app_id: appId });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        // Check ownership or super admin
        const isOwner = app.owner_id.toString() === owner_id.toString();
        const isSuperAdmin = user.type === 'super_admin' || user.role === 'admin';
        if (!isOwner && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }
        // Check if already building
        // if (app.status === 'building') {
        //     return res.status(409).json({ success: false, message: 'A build is already in progress for this app.' });
        // }
        const targets = [];
        if (app.platforms.android)
            targets.push('android_apk');
        if (app.platforms.web)
            targets.push('web');
        if (targets.length === 0)
            targets.push('android_apk');
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
            targets: targets,
            target: targets[0],
            user_email: req.user.email,
            retry: app.status === 'failed' || req.body.retry === true
        };
        // Enqueue Build Job
        await addBuildJob(appId, { appId, options });
        // Update status in DB
        await CreatedApp.updateOne({ app_id: appId }, {
            status: 'building',
            build_status_full: 'queued',
            build_progress: 0,
            build_stage: 'Queued',
            build_error: '' // Clear previous error
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
        const user = req.user;
        const owner_id = user.id;
        const app = await CreatedApp.findOne({ app_id: appId })
            .select('owner_id status build_status build_progress build_stage download_links build_error payment_status total_paid estimated_finish_at');
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        const isOwner = app.owner_id.toString() === owner_id.toString();
        const isSuperAdmin = user.type === 'super_admin' || user.role === 'admin';
        if (!isOwner && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }
        res.json({
            success: true,
            data: {
                status: app.status,
                progress: app.build_progress,
                stage: app.build_stage,
                links: app.download_links,
                error: app.build_error,
                payment_status: app.payment_status,
                total_paid: app.total_paid,
                estimated_finish_at: app.estimated_finish_at
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
export const downloadArtifact = async (req, res) => {
    try {
        const { appId, target } = req.params; // target: 'android' | 'web'
        const owner_id = req.user.id;
        // Verify ownership
        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found or unauthorized' });
        }
        // Check if we have a GitHub Asset for this target
        // github_assets stores the Asset ID
        const assetIdStr = app.github_assets?.[target];
        if (assetIdStr) {
            try {
                const githubService = new GitHubAutomationService();
                const repoName = `vtfree-app-${appId}`; // Assuming naming convention
                // Fetch the asset buffer
                // For large files, buffer might be memory intensive. 
                // But AppGenerator builds are < 50MB typically.
                const buffer = await githubService.streamAsset(repoName, parseInt(assetIdStr));
                // Set headers
                const fileExt = target === 'web' ? 'zip' : 'apk';
                const contentType = target === 'web' ? 'application/zip' : 'application/vnd.android.package-archive';
                const fileName = `${app.package_name}_${target}.${fileExt}`;
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.send(Buffer.from(buffer));
                return;
            }
            catch (ghError) {
                console.error('GitHub Asset Stream Failed:', ghError);
                // Fallback to local check below?
            }
        }
        // FALLBACK: Local File Check (Legacy or if GitHub failed)
        // Check for real path locally
        let realPath = '';
        if (target === 'android') {
            realPath = path.resolve(__dirname, '../../../generated_apps', appId, 'android/app/build/outputs/apk/release/app-release.apk');
        }
        else if (target === 'web') {
            realPath = path.resolve(__dirname, '../../../generated_apps', appId, 'web-build.zip'); // adjust path if needed
        }
        if (realPath && await fs.pathExists(realPath)) {
            const fileName = `${app.package_name}_${target}.${target === 'web' ? 'zip' : 'apk'}`;
            return res.download(realPath, fileName);
        }
        res.status(404).json({ success: false, message: 'Artifact not found. Please build it first.' });
    }
    catch (error) {
        console.error('Download Artifact error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const getPublicAppDetails = async (req, res) => {
    try {
        const { appId } = req.params;
        // Find app by app_id only, no owner check needed for public info
        const app = await CreatedApp.findOne({ app_id: appId }).select('app_name package_name branding services status company payment_settings.default_gateway');
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
export const uploadLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        const userId = req.user.id;
        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadImage(req.file.path, `vtfree/logos/users/${userId}`);
        // Clean up local file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.json({
            success: true,
            message: 'Logo uploaded successfully',
            data: {
                logo_url: uploadResult.secure_url
            }
        });
    }
    catch (error) {
        console.error('Upload logo error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
export const payAndStartBuild = async (req, res) => {
    try {
        const { appId } = req.params;
        const authUser = req.user;
        const app = await CreatedApp.findOne({ app_id: appId });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        // Check ownership or super admin
        const isOwner = app.owner_id.toString() === authUser.id.toString();
        const isSuperAdmin = authUser.type === 'super_admin' || authUser.role === 'admin';
        if (!isOwner && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }
        // IMPORTANT: For the rest of the logic, use the APP'S OWNER for payment deduction
        const owner_id = app.owner_id;
        const actualOwner = await VTfreeUser.findById(owner_id);
        if (!actualOwner) {
            return res.status(404).json({ success: false, message: 'App owner not found' });
        }
        const owner_email = actualOwner.email;
        let message = 'Payment successful. App build started.';
        if (app.payment_status !== 'paid') {
            // 1. Recalculate Total Cost
            const PRICES = await PricingService.getAppCreationPrices();
            let totalAmount = 0;
            if (app.platforms.android)
                totalAmount += PRICES.PLATFORM_ANDROID;
            if (app.platforms.ios)
                totalAmount += PRICES.PLATFORM_IOS;
            if (app.platforms.web)
                totalAmount += PRICES.PLATFORM_WEB;
            if (app.publish_play_store)
                totalAmount += PRICES.PUBLISH_PLAY_STORE;
            if (app.publish_app_store)
                totalAmount += PRICES.PUBLISH_APP_STORE;
            if (app.publish_web)
                totalAmount += PRICES.PUBLISH_WEB;
            if (app.services && app.services.includes('bills'))
                totalAmount += PRICES.SERVICE_BILLS;
            if (app.services && app.services.includes('giftcard'))
                totalAmount += PRICES.SERVICE_GIFTCARD;
            // 2. Check Balance
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
            // 3. Process Wallet Payment
            user.wallet_balance -= totalAmount;
            await user.save();
            await VTfreeTransaction.create({
                user_id: owner_id,
                type: 'debit',
                amount: totalAmount,
                reference: `PAY-${uuidv4()}`,
                description: `Payment for App Creation (Finalizing): ${app.app_name}`,
                status: 'success',
                metadata: { app_name: app.app_name, package_name: app.package_name, method: 'wallet' }
            });
            // 4. Update App Status
            app.payment_status = 'paid';
            app.total_paid = totalAmount;
        }
        else {
            message = 'App is already paid. Build restarted.';
        }
        app.status = 'building';
        app.build_status_full = 'queued';
        app.build_progress = 0;
        app.build_stage = 'Queued';
        app.build_error = ''; // Clear previous error
        await app.save();
        if (req.body.build_type === 'custom') {
            app.status = 'building';
            app.build_status_full = 'custom_pending';
            app.build_progress = 0;
            app.build_stage = 'Waiting for Manual Build';
            app.build_error = '';
            await app.save();
            // Send Email to Super Admin (Hardcoded or configured)
            const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'support@vtfree.com';
            await EmailService.sendCustomBuildRequest(SUPER_ADMIN_EMAIL, app, actualOwner);
            res.json({
                success: true,
                message: 'Payment successful. Custom build request sent to admin.',
                data: { app }
            });
            return;
        }
        // 5. Trigger App Generation (Automated)
        const targets = [];
        if (app.platforms.android)
            targets.push('android_apk');
        if (app.platforms.web)
            targets.push('web');
        // Default to android if none (should unlikely happen if valid app)
        if (targets.length === 0)
            targets.push('android_apk');
        await addBuildJob(appId, {
            appId: appId,
            options: {
                app_id: appId,
                app_name: app.app_name,
                package_name: app.package_name,
                branding: app.branding,
                server_url: process.env.API_BASE_URL || 'https://vua.vtfree.com/api',
                targets: targets,
                target: targets[0], // backward compatibility
                user_email: owner_email
            }
        });
        res.json({
            success: true,
            message: message,
            data: { app }
        });
    }
    catch (error) {
        console.error('Pay and build error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const updateAppDetails = async (req, res) => {
    try {
        const { appId } = req.params;
        const owner_id = req.user.id;
        const { app_name, branding, services, company, rebuild = false, payment_settings, email_settings, referral_settings } = req.body;
        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        // 1. Update Basic Info
        if (app_name)
            app.app_name = app_name;
        if (branding) {
            app.branding = { ...app.branding, ...branding };
        }
        if (services)
            app.services = services;
        if (company) {
            app.company = { ...app.company, ...company };
        }
        // 2. Update Advanced Settings
        if (payment_settings) {
            app.payment_settings = { ...app.payment_settings, ...payment_settings };
        }
        if (email_settings) {
            app.email_settings = { ...app.email_settings, ...email_settings };
        }
        if (referral_settings) {
            app.referral_settings = { ...app.referral_settings, ...referral_settings };
        }
        await app.save();
        // 3. Trigger Rebuild if requested (and if paid)
        if (rebuild && app.payment_status === 'paid') {
            const options = {
                app_id: app.app_id,
                app_name: app.app_name,
                package_name: app.package_name,
                branding: app.branding,
                server_url: process.env.API_BASE_URL || 'https://vua.vtfree.com/api',
                target: app.platforms.android ? 'android_apk' : (app.platforms.web ? 'web' : 'android_apk')
            };
            await addBuildJob(appId, { appId, options });
            // Update status to building
            app.status = 'building';
            await app.save();
        }
        res.json({
            success: true,
            message: 'App details updated successfully' + (rebuild ? ' and build triggered.' : '.'),
            data: { app }
        });
    }
    catch (error) {
        console.error('Update app error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
const LATEST_TEMPLATE_VERSION = '2.0.0';
export const upgradeApp = async (req, res) => {
    try {
        const { appId } = req.params;
        const owner_id = req.user.id;
        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        if (app.payment_status !== 'paid') {
            return res.status(403).json({ success: false, message: 'Please complete payment before upgrading.' });
        }
        // 1. Fetch Dynamic Upgrade Config
        const CONFIG = await PricingService.getAppCreationPrices();
        const LATEST_VERSION = CONFIG.LATEST_TEMPLATE_VERSION || '2.0.0'; // Fallback
        const UPGRADE_FEE = CONFIG.APP_UPGRADE_FEE || 0;
        if (!CONFIG.APP_UPGRADE_ENABLED) {
            return res.status(403).json({ success: false, message: 'App upgrades are currently disabled by admin.' });
        }
        // Check if already on latest version
        if (app.version === LATEST_VERSION) {
            return res.status(400).json({ success: false, message: 'App is already on the latest version.' });
        }
        // 2. Check & Deduct Balance if Fee > 0
        if (UPGRADE_FEE > 0) {
            const user = await VTfreeUser.findById(owner_id);
            if (!user)
                return res.status(404).json({ success: false, message: 'User not found' });
            if (user.wallet_balance < UPGRADE_FEE) {
                return res.status(402).json({
                    success: false,
                    message: `Insufficient wallet balance. Upgrade fee is ₦${UPGRADE_FEE.toLocaleString()}`,
                    code: 'INSUFFICIENT_FUNDS',
                    data: {
                        required: UPGRADE_FEE,
                        current: user.wallet_balance,
                        shortfall: UPGRADE_FEE - user.wallet_balance
                    }
                });
            }
            // Deduct & Transact
            user.wallet_balance -= UPGRADE_FEE;
            await user.save();
            await VTfreeTransaction.create({
                user_id: owner_id,
                type: 'debit',
                amount: UPGRADE_FEE,
                reference: `UPGRADE-${uuidv4()}`,
                description: `App Upgrade to v${LATEST_VERSION}: ${app.app_name}`,
                status: 'success',
                metadata: { app_name: app.app_name, version: LATEST_VERSION, old_version: app.version }
            });
        }
        // 3. Update version in DB
        const oldVersion = app.version;
        app.version = LATEST_VERSION;
        app.status = 'building';
        await app.save();
        // 4. Trigger Rebuild
        const options = {
            app_id: app.app_id,
            app_name: app.app_name,
            package_name: app.package_name,
            branding: app.branding,
            server_url: process.env.API_BASE_URL || 'https://vua.vtfree.com/api',
            target: app.platforms.android ? 'android_apk' : (app.platforms.web ? 'web' : 'android_apk')
        };
        await addBuildJob(appId, { appId, options });
        res.json({
            success: true,
            message: `App upgraded from v${oldVersion} to v${LATEST_VERSION}.`,
            data: { app, fee_deducted: UPGRADE_FEE }
        });
    }
    catch (error) {
        console.error('Upgrade app error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const deleteApp = async (req, res) => {
    try {
        const { appId } = req.params;
        const user = req.user;
        const owner_id = user.id;
        const app = await CreatedApp.findOne({ app_id: appId });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        // Check ownership: must be the owner OR a super admin/admin
        const isOwner = app.owner_id.toString() === owner_id.toString();
        const isSuperAdmin = user.type === 'super_admin' || user.role === 'admin';
        if (!isOwner && !isSuperAdmin) {
            console.warn(`[DeleteApp] Unauthorized deletion attempt by user ${owner_id} for app ${appId}`);
            return res.status(403).json({ success: false, message: 'Unauthorized: You do not have permission to delete this app' });
        }
        // Delete associated admins
        await AppAdmin.deleteMany({ app_id: appId });
        // Delete the app
        await CreatedApp.deleteOne({ app_id: appId });
        // CLEANUP: Delete app folder and zip files from server
        const appFolderPath = path.resolve(__dirname, '../../../generated_apps', appId);
        const appsFolderPath = path.resolve(__dirname, '../../../apps', appId);
        const appZipPath = path.resolve(__dirname, '../../../generated_apps', `${appId}.zip`);
        try {
            if (await fs.pathExists(appFolderPath)) {
                await fs.remove(appFolderPath);
                console.log(`[DeleteApp] Deleted app files at: ${appFolderPath}`);
            }
            if (await fs.pathExists(appsFolderPath)) {
                await fs.remove(appsFolderPath);
                console.log(`[DeleteApp] Deleted app files at: ${appsFolderPath}`);
            }
            if (await fs.pathExists(appZipPath)) {
                await fs.remove(appZipPath);
                console.log(`[DeleteApp] Deleted app zip at: ${appZipPath}`);
            }
        }
        catch (cleanupError) {
            console.error('[DeleteApp] Failed to cleanup files:', cleanupError);
            // Don't fail the request since DB deletion was successful
        }
        res.json({ success: true, message: 'App deleted successfully' });
    }
    catch (error) {
        console.error('Delete app error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
