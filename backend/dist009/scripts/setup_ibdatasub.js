import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const setupIBDataSub = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
        // Define schemas
        const vtfreeUserSchema = new mongoose.Schema({
            email: String,
            password_hash: String,
            first_name: String,
            last_name: String,
            phone_number: String,
        }, { collection: 'vtfree_users' });
        const createdAppSchema = new mongoose.Schema({
            app_id: String,
            owner_id: mongoose.Schema.Types.ObjectId,
            app_name: String,
            package_name: String,
            platforms: Object,
            status: String,
            admin_email: String,
            admin_password_hash: String,
            branding: Object,
        }, { collection: 'created_apps' });
        const appAdminSchema = new mongoose.Schema({
            email: String,
            password_hash: String,
            app_id: String,
            first_name: String,
            last_name: String,
            role: { type: String, default: 'admin' },
            is_active: { type: Boolean, default: true },
        }, { collection: 'app_admins' });
        const VTfreeUser = mongoose.models.VTfreeUser || mongoose.model('VTfreeUser', vtfreeUserSchema);
        const CreatedApp = mongoose.models.CreatedApp || mongoose.model('CreatedApp', createdAppSchema);
        const AppAdmin = mongoose.models.AppAdmin || mongoose.model('AppAdmin', appAdminSchema);
        // Step 1: Create or find owner
        let owner = await VTfreeUser.findOne({ email: 'owner@ibdatasub.com' });
        if (!owner) {
            console.log('📝 Creating owner user...');
            owner = await VTfreeUser.create({
                email: 'owner@ibdatasub.com',
                password_hash: await bcrypt.hash('password123', 10),
                first_name: 'IBData',
                last_name: 'Owner',
                phone_number: '08000000000'
            });
            console.log('✅ Owner created');
        }
        else {
            console.log('✅ Owner already exists');
        }
        // Step 2: Create or update app
        const appId = 'IBDataSub';
        const appData = {
            app_id: appId,
            owner_id: owner._id,
            app_name: 'IBDataSub',
            package_name: 'com.ibdatasub.app',
            platforms: { android: true, ios: false, web: true },
            status: 'live',
            admin_email: 'admin@ibdatasub.com',
            admin_password_hash: await bcrypt.hash('Admin@123456', 10),
            branding: {
                primary_color: '#166534',
                secondary_color: '#22c55e',
                accent_color: '#15803d',
                background_color: '#FFFFFF',
                app_display_name: 'IBDataSub',
                sidebar_bg_start: '#14532d',
                sidebar_bg_end: '#166534'
            }
        };
        const existingApp = await CreatedApp.findOne({ app_id: appId });
        if (existingApp) {
            console.log('📝 Updating existing app...');
            Object.assign(existingApp, appData);
            await existingApp.save();
            console.log('✅ App updated');
        }
        else {
            console.log('📝 Creating new app...');
            await CreatedApp.create(appData);
            console.log('✅ App created');
        }
        // Step 3: Create or update admin user
        const adminEmail = 'admin@ibdatasub.com';
        const adminPassword = 'Admin@123456';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const existingAdmin = await AppAdmin.findOne({ email: adminEmail, app_id: appId });
        if (existingAdmin) {
            console.log('📝 Updating existing admin...');
            existingAdmin.password_hash = hashedPassword;
            existingAdmin.is_active = true;
            await existingAdmin.save();
            console.log('✅ Admin updated');
        }
        else {
            console.log('📝 Creating new admin...');
            await AppAdmin.create({
                email: adminEmail,
                password_hash: hashedPassword,
                app_id: appId,
                first_name: 'Admin',
                last_name: 'User',
                role: 'admin',
                is_active: true,
            });
            console.log('✅ Admin created');
        }
        console.log('\n🎉 IBDataSub setup complete!\n');
        console.log('📝 Login credentials:');
        console.log('   Email:    admin@ibdatasub.com');
        console.log('   Password: Admin@123456');
        console.log('   App ID:   IBDataSub');
        console.log('\n🌐 Login URL: http://localhost:5173\n');
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error setting up IBDataSub:', error);
        process.exit(1);
    }
};
setupIBDataSub();
