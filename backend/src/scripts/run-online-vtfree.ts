
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';

async function runOnlineVTfree() {
    try {
        console.log('🚀 [VTfree] Starting Online Deployment Setup...');
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        const { default: Admin } = await import('../models/super_admin.model.js');
        const { default: VTfreeUser } = await import('../models/vtfree_user.model.js');
        const { default: CreatedApp } = await import('../models/created_app.model.js');
        const { default: AppAdmin } = await import('../models/app_admin.model.js');

        const SUPER_ADMIN_EMAIL = 'superadmin@vtfree.com';
        const OWNER_EMAIL = 'owner@vtfree.com';
        const APP_ID = 'vtfree_demo';
        const APP_ADMIN_EMAIL = 'admin@vtfree_demo.com';
        const DEFAULT_PASSWORD = 'password123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

        // 1. Ensure Super Admin (Platform Owner)
        console.log('Step 1: Ensuring Super Admin exists...');
        let superAdmin = await Admin.findOne({ email: SUPER_ADMIN_EMAIL.toLowerCase() });
        if (!superAdmin) {
            superAdmin = await Admin.create({
                email: SUPER_ADMIN_EMAIL.toLowerCase(),
                password: hashedPassword,
                role: 'super_admin',
                first_name: 'Super',
                last_name: 'Admin',
                status: 'active'
            });
            console.log(`✅ Super Admin created: ${SUPER_ADMIN_EMAIL}`);
        } else {
            console.log(`✅ Super Admin already exists: ${SUPER_ADMIN_EMAIL}`);
        }

        // 2. Ensure VTfree Platform User (The "Owner" who can create apps)
        console.log('Step 2: Ensuring VTfree Platform Owner exists...');
        let platformOwner = await VTfreeUser.findOne({ email: OWNER_EMAIL.toLowerCase() });
        if (!platformOwner) {
            platformOwner = await VTfreeUser.create({
                email: OWNER_EMAIL.toLowerCase(),
                password: hashedPassword,
                first_name: 'Platform',
                last_name: 'Owner',
                phone_number: '08100000000',
                company_name: 'VTfree Solutions',
                status: 'active'
            });
            console.log(`✅ Platform Owner created: ${OWNER_EMAIL}`);
        } else {
            console.log(`✅ Platform Owner already exists: ${OWNER_EMAIL}`);
        }

        // 3. Ensure the Managed App exists
        console.log(`Step 3: Ensuring Managed App (${APP_ID}) exists...`);
        let managedApp = await CreatedApp.findOne({ app_id: APP_ID });
        if (!managedApp) {
            managedApp = await CreatedApp.create({
                app_id: APP_ID,
                owner_id: platformOwner._id,
                app_name: 'VTfree Demo App',
                package_name: 'com.vtfree.demo',
                admin_email: APP_ADMIN_EMAIL,
                admin_password_hash: hashedPassword,
                status: 'live',
                require_approval: true, // New feature enabled by default for demo
                platforms: { web: true, android: true, ios: true },
                branding: {
                    primary_color: '#16a34a',
                    secondary_color: '#22c55e'
                }
            });
            console.log(`✅ Managed App created: ${APP_ID}`);
        } else {
            console.log(`✅ Managed App already exists: ${APP_ID}`);
        }

        // 4. Ensure App Admin exists for the managed app
        console.log(`Step 4: Ensuring App Admin (${APP_ADMIN_EMAIL}) exists for app ${APP_ID}...`);
        let appAdmin = await AppAdmin.findOne({ email: APP_ADMIN_EMAIL.toLowerCase(), app_id: APP_ID });
        if (!appAdmin) {
            appAdmin = await AppAdmin.create({
                app_id: APP_ID,
                email: APP_ADMIN_EMAIL.toLowerCase(),
                password: hashedPassword,
                role: 'owner',
                first_name: 'App',
                last_name: 'Admin',
                status: 'active'
            });
            console.log(`✅ App Admin created: ${APP_ADMIN_EMAIL}`);
        } else {
            console.log(`✅ App Admin already exists: ${APP_ADMIN_EMAIL}`);
        }

        console.log('\n--- DEPLOYMENT SUMMARY ---');
        console.log(`Super Admin: ${SUPER_ADMIN_EMAIL} / ${DEFAULT_PASSWORD}`);
        console.log(`Platform Owner: ${OWNER_EMAIL} / ${DEFAULT_PASSWORD}`);
        console.log(`App ID: ${APP_ID}`);
        console.log(`App Admin: ${APP_ADMIN_EMAIL} / ${DEFAULT_PASSWORD}`);
        console.log('--------------------------\n');

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        console.log('✅ Setup Completed Successfully!');
    } catch (error) {
        console.error('❌ Error during setup:', error);
        process.exit(1);
    }
}

runOnlineVTfree();
