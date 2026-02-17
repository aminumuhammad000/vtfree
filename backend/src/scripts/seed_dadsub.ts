import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import CreatedApp from '../models/created_app.model.js';
import AppAdmin from '../models/app_admin.model.js';

async function seedDadSub() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        const owner_email = 'aminu@example.com';
        const password = 'Admin@123';
        const app_name = 'DADSUB';
        const app_id = 'DADSUB';
        const package_name = 'com.dadsub.app';

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Find Owner (from users.json)
        let owner = await VTfreeUser.findOne({ email: owner_email });
        if (!owner) {
            console.log('👤 Creating owner...');
            owner = await VTfreeUser.create({
                email: owner_email,
                password: hashedPassword,
                first_name: 'Aminu',
                last_name: 'Muhammad',
                phone_number: '08000000000',
                status: 'active',
                email_verified: true,
                wallet_balance: 1000000 // Give plenty of balance for dev
            });
        }

        // 2. Create/Update CreatedApp DADSUB
        let app = await CreatedApp.findOne({ app_id });
        if (!app) {
            console.log(`📱 Creating app record: ${app_name}...`);
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
                    app_display_name: app_name,
                    logo_url: 'https://res.cloudinary.com/dv8eawhgx/image/upload/v1700000000/vtfree/logos/default_logo.png'
                },
                admin_email: owner_email,
                admin_password_hash: hashedPassword,
                payment_settings: {
                    default_gateway: 'vtpay'
                },
                version: '1.0.0',
                services: ['bills', 'airtime', 'data', 'cable', 'electricity']
            });
            console.log('✅ DADSUB app record created.');
        } else {
            console.log(`📱 App ${app_id} already exists, updating branding and settings...`);
            app.branding = {
                ...app.branding,
                primary_color: '#e0b105',
                secondary_color: '#F4C20D',
                app_display_name: app_name
            };
            app.payment_settings = {
                default_gateway: 'vtpay'
            };
            app.status = 'live';
            app.payment_status = 'paid';
            await app.save();
        }

        // 3. Ensure AppAdmin exists
        let admin = await AppAdmin.findOne({ app_id, email: owner_email });
        if (!admin) {
            console.log('🔑 Creating AppAdmin access...');
            await AppAdmin.create({
                app_id,
                email: owner_email,
                password: hashedPassword,
                first_name: 'Aminu',
                last_name: 'Muhammad',
                role: 'owner',
                status: 'active',
                permissions: ['all']
            });
            console.log('✅ Admin access created.');
        }

        console.log('\n✨ DADSUB SEED COMPLETE ✨');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

seedDadSub();
