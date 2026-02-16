import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import AppAdmin from '../models/app_admin.model.js';
import CreatedApp from '../models/created_app.model.js';
async function resetAlkaliAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB at:', config.mongoUri);
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        const email = 'alkali@gmail.com';
        const targetAppId = 'app_f985f726'; // From the failed request logs
        const newPassword = 'Admin@123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // 1. Check if Admin exists
        let admin = await AppAdmin.findOne({ email });
        if (admin) {
            console.log(`✅ Found Admin with email: ${email}`);
            console.log(`   Current App ID: ${admin.app_id}`);
            console.log(`   Current Role: ${admin.role}`);
            admin.password = hashedPassword;
            // Ensure app_id matches what they are trying to login with, or warn
            if (admin.app_id !== targetAppId) {
                console.log(`⚠️  WARNING: Admin exists but has different App ID: ${admin.app_id}. The login request used: ${targetAppId}`);
                console.log(`   Updating App ID to match request: ${targetAppId}`);
                admin.app_id = targetAppId;
            }
            await admin.save();
            console.log(`✅ Password reset to: ${newPassword}`);
        }
        else {
            console.log(`❌ Admin not found: ${email}`);
            console.log('   Creating new admin...');
            admin = await AppAdmin.create({
                app_id: targetAppId,
                email: email,
                password: hashedPassword,
                role: 'owner',
                permissions: ['all'],
                status: 'active',
                created_by: 'system_recovery',
            });
            console.log(`✅ Admin created with password: ${newPassword} and App ID: ${targetAppId}`);
        }
        // 2. Ensure the App itself exists in CreatedApp, otherwise they might have issues later
        let app = await CreatedApp.findOne({ app_id: admin.app_id });
        if (!app) {
            console.log(`⚠️  App ${admin.app_id} not found in CreatedApp. Creating placeholder...`);
            await CreatedApp.create({
                app_id: admin.app_id,
                owner_id: new mongoose.Types.ObjectId(), // Placeholder
                app_name: 'Recovered App',
                package_name: 'com.recovered.app',
                platforms: { android: true, web: true },
                branding: { primary_color: '#000000', secondary_color: '#ffffff' },
                status: 'live',
                payment_status: 'paid',
                admin_email: email,
                admin_password_hash: hashedPassword,
            });
            console.log('✅ Placeholder App created');
        }
        else {
            console.log(`✅ App ${admin.app_id} exists in CreatedApp`);
        }
        await mongoose.disconnect();
        console.log('\n✅ Done!');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
resetAlkaliAdmin();
