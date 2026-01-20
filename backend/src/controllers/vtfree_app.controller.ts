import { Request, Response } from 'express';
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
import { PaystackService } from '../services/paystack.service.js';
import { PricingService } from '../services/pricing.service.js';
import { AppGeneratorService } from '../services/app_generator.service.js';

export const createApp = async (req: Request, res: Response) => {
    try {
        const { app_name, package_name, platforms, branding, services, publish_play_store, publish_app_store, payment_method, company } = req.body;
        const owner_id = (req as any).user.id;
        const owner_email = (req as any).user.email;

        // 1. Fetch Dynamic Pricing
        const PRICES = await PricingService.getAppCreationPrices();

        // 2. Calculate Total Cost
        let totalAmount = 0;
        if (platforms.android) totalAmount += PRICES.PLATFORM_ANDROID;
        if (platforms.ios) totalAmount += PRICES.PLATFORM_IOS;
        if (platforms.web) totalAmount += PRICES.PLATFORM_WEB;

        if (publish_play_store) totalAmount += PRICES.PUBLISH_PLAY_STORE;
        if (publish_app_store) totalAmount += PRICES.PUBLISH_APP_STORE;

        if (services && services.includes('bills')) totalAmount += PRICES.SERVICE_BILLS;
        if (services && services.includes('giftcard')) totalAmount += PRICES.SERVICE_GIFTCARD;

        // 3. Handle Payment Method Checks
        // If Card payment, initiate Paystack transaction
        if (payment_method === 'card') {
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
    } catch (error: any) {
        console.error('Create app error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const verifyAppPayment = async (req: Request, res: Response) => {
    try {
        const { reference, appPayload } = req.body;
        const owner_id = (req as any).user.id;
        const owner_email = (req as any).user.email;

        // 1. Verify Paystack Payment
        const paystackService = new PaystackService();
        const verification = await paystackService.verifyTransaction(reference);

        if (!verification.status || verification.data.status !== 'success') {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

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

    } catch (error: any) {
        console.error('Verify app payment error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const getMyApps = async (req: Request, res: Response) => {
    try {
        const owner_id = (req as any).user.id;
        // Explicitly cast to ObjectId to ensure query matches
        const apps = await CreatedApp.find({ owner_id: owner_id }).sort({ created_at: -1 });

        console.log(`[getMyApps] User ${owner_id} has ${apps.length} apps`);

        res.json({
            success: true,
            data: { apps }
        });
    } catch (error) {
        console.error('Get apps error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAppDetails = async (req: Request, res: Response) => {
    try {
        const { appId } = req.params;
        const owner_id = (req as any).user.id;

        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        res.json({
            success: true,
            data: { app }
        });
    } catch (error) {
        console.error('Get app details error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAppPrices = async (req: Request, res: Response) => {
    try {
        const prices = await PricingService.getAppCreationPrices();
        res.json({
            success: true,
            data: prices
        });
    } catch (error) {
        console.error('Get prices error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const downloadAppSource = async (req: Request, res: Response) => {
    try {
        const { appId } = req.params;
        const owner_id = (req as any).user.id;

        // Verify ownership
        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found or unauthorized' });
        }

        // Generate Zip
        const zipPath = await AppGeneratorService.zipSourceCode(appId);

        res.download(zipPath);

    } catch (error: any) {
        console.error('Download app source error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const triggerBuildApk = async (req: Request, res: Response) => {
    try {
        const { appId } = req.params;
        const owner_id = (req as any).user.id;

        // Verify ownership
        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found or unauthorized' });
        }

        // Trigger Build
        // Note: This is a heavy operation. In production, prioritize queues.
        // We will await it here to provide immediate feedback for this demo.
        const userEmail = (req as any).user.email;

        // Progress Callback
        const onProgress = async (stage: string, progress: number) => {
            await CreatedApp.updateOne(
                { app_id: appId },
                {
                    build_stage: stage,
                    build_progress: progress,
                    'build_status.android': 'building'
                }
            );
        };

        const result = await AppGeneratorService.buildApk(appId, userEmail, onProgress);

        if (result.success) {
            // Update app build status and save drive link
            app.build_status.android = 'completed';

            // Save Google Drive link if available
            if (result.driveLink) {
                if (!app.download_links) {
                    app.download_links = {};
                }
                app.download_links.android = result.driveLink;
            }

            await app.save();

            res.json({
                success: true,
                message: 'APK built successfully',
                apkPath: result.apkPath,
                driveLink: result.driveLink
            });
        } else {
            // Update build status to failed
            app.build_status.android = 'failed';
            await app.save();

            res.status(500).json({ success: false, message: result.message });
        }

    } catch (error: any) {
        console.error('Trigger build error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const downloadApk = async (req: Request, res: Response) => {
    try {
        const { appId } = req.params;
        const owner_id = (req as any).user.id;

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
        } else if (await fs.pathExists(dummyApkPath)) {
            return res.download(dummyApkPath, `${app.package_name}.apk`);
        }

        res.status(404).json({ success: false, message: 'APK not found. Please build it first.' });

    } catch (error: any) {
        console.error('Download APK error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
