import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import CreatedApp from '../models/created_app.model.js';
import AppAdmin from '../models/app_admin.model.js';

async function resetAndRegisterDadsub() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        const app_id = 'DADSUB';
        const app_name = 'DADSUB';
        const package_name = 'com.dadsub.app';
        const owner_email = 'dadsub@gmail.com';
        const password = 'Admin@123456';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('\n🗑️  Cleaning up old DADSUB data...');

        // Delete existing App, Admins, and Owner to ensure a fresh start
        const deletedApp = await CreatedApp.deleteMany({
            $or: [
                { app_id: app_id },
                { package_name: package_name }
            ]
        });
        console.log(`❌ Deleted ${deletedApp.deletedCount} app records.`);

        const deletedAdmins = await AppAdmin.deleteMany({ app_id });
        console.log(`❌ Deleted ${deletedAdmins.deletedCount} admin records.`);

        const deletedOwner = await VTfreeUser.deleteMany({ email: owner_email });
        console.log(`❌ Deleted ${deletedOwner.deletedCount} owner records.`);

        console.log('\n🚀 Creating Fresh DADSUB App...');

        // 1. Create Owner
        const owner = await VTfreeUser.create({
            email: owner_email,
            password: hashedPassword,
            first_name: 'Dadsub',
            last_name: 'Admin',
            phone_number: '08000000000',
            status: 'active',
            email_verified: true,
            wallet_balance: 100000 // Test balance
        });
        console.log('✅ Fresh Owner created.');

        // 2. Create App
        const app = await CreatedApp.create({
            app_id,
            app_name,
            owner_id: owner._id,
            package_name,
            status: 'live',
            platforms: { android: true, ios: false, web: true },
            branding: {
                primary_color: '#e0b105',
                secondary_color: '#F4C20D',
                app_display_name: 'DADSUB',
                app_tagline: 'Quality Data & Airtime'
            },
            services: ['airtime', 'data', 'cable', 'electricity'],
            admin_email: owner_email,
            admin_password_hash: hashedPassword,
            payment_status: 'paid',
            total_paid: 0,
            payment_settings: {
                default_gateway: 'vtstack'
            },
            version: '1.0.0'
        });
        console.log('✅ Fresh App record created.');

        // 3. Create Admin access
        await AppAdmin.create({
            app_id,
            email: owner_email,
            password: hashedPassword,
            first_name: 'Dadsub',
            last_name: 'Admin',
            role: 'owner',
            status: 'active',
            permissions: ['all']
        });
        console.log('✅ Fresh Admin access granted.');

        console.log('\n✨ DADSUB RESET & REGISTERED SUCCESSFULLY ✨');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🆔 App ID:        ${app_id}`);
        console.log(`📧 Admin Email:   ${owner_email}`);
        console.log(`🔑 Password:      ${password}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Reset/Registration Error:', error);
        process.exit(1);
    }
}

resetAndRegisterDadsub();
