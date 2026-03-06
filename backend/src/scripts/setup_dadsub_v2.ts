import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import CreatedApp from '../models/created_app.model.js';
import AppAdmin from '../models/app_admin.model.js';
import SuperAdmin from '../models/super_admin.model.js';

async function setupDadsub() {
    try {
        console.log('--- STARTING SETUP ---');
        console.log('Connecting to:', config.mongoUri);
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        const app_id = 'dadsub';
        const app_name = 'DadSub';
        const package_name = 'com.dadsub.app';
        const email = 'sadikdad3807@gmail.com';
        const password = 'Admin@123456';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`\n🚀 Setting up ${app_name} (${app_id})...`);

        // 1. Create/Update Owner User
        let owner = await VTfreeUser.findOne({ email });
        if (!owner) {
            owner = await VTfreeUser.create({
                email,
                password: hashedPassword,
                first_name: 'Sadik',
                last_name: 'Dad',
                phone_number: '08000000000',
                status: 'active',
                email_verified: true,
                wallet_balance: 50000
            });
            console.log('✅ Owner user created.');
        } else {
            owner.password = hashedPassword;
            owner.status = 'active';
            await owner.save();
            console.log('✅ Owner user updated.');
        }

        // 2. Create/Update App Record
        // First check if an app with this package name already exists with a different ID
        const existingByPackage = await CreatedApp.findOne({ package_name });
        if (existingByPackage && existingByPackage.app_id !== app_id) {
            console.log(`⚠️  Found conflicting app with same package name: ${existingByPackage.app_id}. Deleting...`);
            await CreatedApp.findByIdAndDelete(existingByPackage._id);
        }

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
                    app_display_name: app_name,
                    app_tagline: 'Quality Data & Airtime'
                },
                services: ['airtime', 'data', 'cable', 'electricity'],
                admin_email: email,
                admin_password_hash: hashedPassword,
                payment_status: 'paid',
                version: '1.0.0',
                payment_settings: {
                    default_gateway: 'vtstack'
                }
            });
            console.log('✅ App record created.');
        } else {
            app.status = 'live';
            app.owner_id = owner._id;
            app.admin_email = email;
            app.admin_password_hash = hashedPassword;
            await app.save();
            console.log('✅ App record updated.');
        }

        // 3. Create/Update App Admin
        let admin = await AppAdmin.findOne({ app_id, email });
        if (!admin) {
            await AppAdmin.create({
                app_id,
                email,
                password: hashedPassword,
                first_name: 'Sadik',
                last_name: 'Dad',
                role: 'owner',
                status: 'active',
                permissions: ['all']
            });
            console.log('✅ App admin access granted.');
        } else {
            admin.password = hashedPassword;
            admin.status = 'active';
            await admin.save();
            console.log('✅ App admin updated.');
        }

        // 4. Create/Update Super Admin (to be sure)
        let superAdmin = await SuperAdmin.findOne({ email });
        if (!superAdmin) {
            await SuperAdmin.create({
                email,
                password: hashedPassword,
                first_name: 'Sadik',
                last_name: 'Dad',
                role: 'super_admin',
                permissions: ['all'],
                status: 'active'
            });
            console.log('✅ Super admin created.');
        } else {
            superAdmin.password = hashedPassword;
            superAdmin.status = 'active';
            await superAdmin.save();
            console.log('✅ Super admin updated.');
        }

        console.log('\n✨ SETUP COMPLETE ✨');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email:      ${email}`);
        console.log(`🔑 Password:   ${password}`);
        console.log(`🆔 App ID:     ${app_id}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Setup Error:', error);
        process.exit(1);
    }
}

setupDadsub();
