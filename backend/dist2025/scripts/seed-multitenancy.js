import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import CreatedApp from '../models/created_app.model.js';
import AppAdmin from '../models/app_admin.model.js';
import { User } from '../models/user.model.js';
import { Wallet } from '../models/wallet.model.js';
import { Transaction } from '../models/transaction.model.js';
async function seedMultiTenancy() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        // 1. Create a Platform User (Owner of Apps)
        console.log('📝 Creating Platform User...');
        const platformUserEmail = 'platform.owner@example.com';
        let platformUser = await VTfreeUser.findOne({ email: platformUserEmail });
        if (!platformUser) {
            const passwordHash = await bcrypt.hash('Password@123', 10);
            platformUser = await VTfreeUser.create({
                email: platformUserEmail,
                password: passwordHash,
                first_name: 'Platform',
                last_name: 'Owner',
                phone_number: '08012345678',
                status: 'active',
                email_verified: true
            });
            console.log('✅ Platform User created');
        }
        else {
            console.log('ℹ️ Platform User already exists');
        }
        // 2. Create 2 Apps (Tenants)
        const appsData = [
            {
                name: 'Alpha VTU',
                package: 'com.alphavtu.app',
                adminEmail: 'admin@alphavtu.com',
                appId: 'APP_ALPHA_001'
            },
            {
                name: 'Beta Data',
                package: 'com.betadata.app',
                adminEmail: 'admin@betadata.com',
                appId: 'APP_BETA_002'
            }
        ];
        for (const appData of appsData) {
            console.log(`\n📱 Processing App: ${appData.name}...`);
            let app = await CreatedApp.findOne({ app_id: appData.appId });
            if (!app) {
                const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
                app = await CreatedApp.create({
                    app_id: appData.appId,
                    owner_id: platformUser._id,
                    app_name: appData.name,
                    package_name: appData.package,
                    admin_email: appData.adminEmail,
                    admin_password_hash: adminPasswordHash,
                    status: 'live',
                    platforms: { android: true, ios: false, web: true },
                    branding: {
                        primary_color: '#000000',
                        secondary_color: '#ffffff'
                    }
                });
                console.log(`✅ App ${appData.name} created`);
            }
            else {
                console.log(`ℹ️ App ${appData.name} already exists`);
            }
            // 3. Create App Admin
            let appAdmin = await AppAdmin.findOne({ email: appData.adminEmail, app_id: appData.appId });
            if (!appAdmin) {
                const passwordHash = await bcrypt.hash('Admin@123', 10);
                appAdmin = await AppAdmin.create({
                    app_id: appData.appId,
                    email: appData.adminEmail,
                    password: passwordHash,
                    role: 'owner',
                    permissions: ['all'],
                    status: 'active'
                });
                console.log(`✅ App Admin ${appData.adminEmail} created`);
            }
            else {
                console.log(`ℹ️ App Admin ${appData.adminEmail} already exists`);
            }
            // 4. Create Users for this App
            const usersCount = 2;
            for (let i = 1; i <= usersCount; i++) {
                const userEmail = `user${i}@${appData.package.split('.')[1]}.com`;
                let user = await User.findOne({ email: userEmail, app_id: appData.appId });
                if (!user) {
                    const passwordHash = await bcrypt.hash('User@123', 10);
                    user = await User.create({
                        email: userEmail,
                        phone_number: `080${Math.floor(Math.random() * 100000000)}`,
                        password_hash: passwordHash,
                        first_name: `User${i}`,
                        last_name: `${appData.name.split(' ')[0]}`,
                        app_id: appData.appId,
                        referral_code: `REF${Math.floor(Math.random() * 10000)}`,
                        status: 'active',
                        kyc_status: 'verified'
                    });
                    console.log(`✅ User ${userEmail} created`);
                    // Create Wallet
                    await Wallet.create({
                        user_id: user._id,
                        balance: 5000,
                        currency: 'NGN'
                    });
                    // Create Transactions
                    await Transaction.create({
                        user_id: user._id,
                        wallet_id: (await Wallet.findOne({ user_id: user._id }))._id,
                        type: 'wallet_topup',
                        amount: 5000,
                        total_charged: 5000,
                        status: 'successful',
                        reference_number: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        description: 'Initial Wallet Funding',
                        payment_method: 'bank_transfer',
                        app_id: appData.appId
                    });
                    await Transaction.create({
                        user_id: user._id,
                        wallet_id: (await Wallet.findOne({ user_id: user._id }))._id,
                        type: 'data_purchase',
                        amount: 500,
                        total_charged: 500,
                        status: 'successful',
                        reference_number: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        description: '1GB Data Purchase',
                        payment_method: 'wallet',
                        app_id: appData.appId
                    });
                }
                else {
                    console.log(`ℹ️ User ${userEmail} already exists`);
                }
            }
        }
        console.log('\n🎉 Multi-tenancy Seed Completed Successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔑 Login Details:');
        console.log('1. Alpha VTU Admin:');
        console.log('   Email: admin@alphavtu.com');
        console.log('   Password: Admin@123');
        console.log('   App ID: APP_ALPHA_001');
        console.log('----------------------------------------');
        console.log('2. Beta Data Admin:');
        console.log('   Email: admin@betadata.com');
        console.log('   Password: Admin@123');
        console.log('   App ID: APP_BETA_002');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        await mongoose.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding multi-tenancy:', error);
        process.exit(1);
    }
}
seedMultiTenancy();
