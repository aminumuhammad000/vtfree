import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import CreatedApp from '../models/created_app.model.js';
import AppAdmin from '../models/app_admin.model.js';
async function createAppSetup() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        // Get arguments from command line or use defaults
        const args = process.argv.slice(2);
        const params = {};
        args.forEach(arg => {
            const [key, value] = arg.split('=');
            if (key.startsWith('--')) {
                params[key.slice(2)] = value;
            }
        });
        const owner_email = params.email || 'owner@example.com';
        const password = params.password || 'Admin@123456';
        const app_name = params.name || 'My VTU App';
        const app_id = params.id || `app_${Date.now()}`;
        const package_name = params.package || `com.vtfree.${app_id}`;
        const first_name = params.fname || 'Store';
        const last_name = params.lname || 'Owner';
        const phone_number = params.phone || '08000000000';
        console.log('\n🚀 Starting App & Owner Creation...');
        console.log(`📧 Owner Email: ${owner_email}`);
        console.log(`👤 Name:        ${first_name} ${last_name}`);
        console.log(`📱 App Name:   ${app_name}`);
        console.log(`🆔 App ID:     ${app_id}`);
        console.log(`📦 Package:    ${package_name}\n`);
        const hashedPassword = await bcrypt.hash(password, 10);
        // 1. Create/Update VTfreeUser (Owner)
        let owner = await VTfreeUser.findOne({ email: owner_email });
        if (!owner) {
            console.log('👤 Creating VTfreeUser (Owner)...');
            owner = await VTfreeUser.create({
                email: owner_email,
                password: hashedPassword,
                first_name,
                last_name,
                phone_number,
                status: 'active',
                email_verified: true,
                wallet_balance: 0
            });
            console.log('✅ Owner created.');
        }
        else {
            console.log('👤 Owner already exists, updating profile...');
            owner.password = hashedPassword;
            owner.first_name = first_name;
            owner.last_name = last_name;
            owner.phone_number = phone_number;
            owner.status = 'active';
            await owner.save();
        }
        // 2. Create/Update CreatedApp
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
                    primary_color: '#16a34a',
                    secondary_color: '#22c55e',
                    app_display_name: app_name
                },
                admin_email: owner_email,
                admin_password_hash: hashedPassword,
                payment_status: 'paid',
                total_paid: 0,
                version: '1.0.0'
            });
            console.log('✅ App record created.');
        }
        else {
            console.log(`📱 App ${app_id} already exists, updating...`);
            app.owner_id = owner._id;
            app.app_name = app_name;
            app.admin_email = owner_email;
            app.admin_password_hash = hashedPassword;
            await app.save();
        }
        // 3. Create/Update AppAdmin
        let admin = await AppAdmin.findOne({ app_id, email: owner_email });
        if (!admin) {
            console.log('🔑 Creating AppAdmin access...');
            admin = await AppAdmin.create({
                app_id,
                email: owner_email,
                password: hashedPassword,
                first_name: 'App',
                last_name: 'Owner',
                role: 'owner',
                status: 'active',
                permissions: ['all']
            });
            console.log('✅ Admin access created.');
        }
        else {
            console.log('🔑 Updating existing AppAdmin access...');
            admin.password = hashedPassword;
            admin.status = 'active';
            await admin.save();
        }
        console.log('\n✨ SETUP COMPLETE ✨');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🌐 App Admin URL: http://app-admin.vtfree.com/login (or your domain)`);
        console.log(`🆔 App ID:        ${app_id}`);
        logCredentials('Owner & Admin', owner_email, password);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        await mongoose.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during setup:', error);
        process.exit(1);
    }
}
function logCredentials(label, email, pass) {
    console.log(`🔐 ${label} Credentials:`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${pass}`);
}
createAppSetup();
