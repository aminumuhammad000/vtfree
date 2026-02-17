import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import CreatedApp from '../models/created_app.model.js';
import AppAdmin from '../models/app_admin.model.js';

async function registerDadsub() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        const app_id = 'DADSUB';
        const app_name = 'DADSUB';
        const package_name = 'com.dadsub.app';
        const owner_email = 'dadsub@gmail.com';
        const password = 'Admin@123456';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('\n🚀 Registering DADSUB App for Online Connectivity...');

        // 1. Create/Update Owner
        let owner = await VTfreeUser.findOne({ email: owner_email });
        if (!owner) {
            owner = await VTfreeUser.create({
                email: owner_email,
                password: hashedPassword,
                first_name: 'Dadsub',
                last_name: 'Admin',
                phone_number: '08000000000',
                status: 'active',
                email_verified: true,
                wallet_balance: 100000 // Give some starting balance for testing
            });
            console.log('✅ Owner created.');
        }

        // 2. Create/Update App
        let app = await CreatedApp.findOne({ app_id });
        if (!app) {
            app = await CreatedApp.create({
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
                    default_gateway: 'vtpay'
                },
                version: '1.0.0'
            });
            console.log('✅ App record created.');
        } else {
            app.status = 'live';
            app.branding = {
                ...app.branding,
                primary_color: '#e0b105',
                secondary_color: '#F4C20D',
                app_display_name: 'DADSUB'
            };
            app.services = ['airtime', 'data', 'cable', 'electricity'];
            await app.save();
            console.log('✅ App record updated.');
        }

        // 3. Create/Update Admin access
        let admin = await AppAdmin.findOne({ app_id, email: owner_email });
        if (!admin) {
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
            console.log('✅ Admin access granted.');
        }

        console.log('\n✨ DADSUB IS NOW CONNECTED ✨');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🆔 App ID:        ${app_id}`);
        console.log(`📧 Admin Email:   ${owner_email}`);
        console.log(`🔑 Password:      ${password}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Registration Error:', error);
        process.exit(1);
    }
}

registerDadsub();
