import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import AppAdmin from '../models/app_admin.model.js';
import CreatedApp from '../models/created_app.model.js';

async function ensureAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB at:', config.mongoUri);
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        const email = 'admin@testvtuapp.com';
        const appId = 'vtu_app_001';
        const password = 'Admin@123';

        // 1. Ensure App exists
        let app = await CreatedApp.findOne({ app_id: appId });
        if (!app) {
            console.log('Creating app...');
            app = await CreatedApp.create({
                app_id: appId,
                owner_id: new mongoose.Types.ObjectId(),
                app_name: 'Test VTU App',
                package_name: 'com.test.vtuapp',
                platforms: { android: true, ios: false, web: true },
                branding: { primary_color: '#16a34a', secondary_color: '#22c55e' },
                status: 'live',
                payment_status: 'paid',
                admin_email: email,
                admin_password_hash: await bcrypt.hash(password, 10),
            });
            console.log('✅ App created');
        } else {
            console.log('✅ App already exists');
        }

        // 2. Ensure Admin exists
        let admin = await AppAdmin.findOne({ email, app_id: appId });
        const hashedPassword = await bcrypt.hash(password, 10);

        if (!admin) {
            console.log('Creating admin...');
            admin = await AppAdmin.create({
                app_id: appId,
                email: email,
                password: hashedPassword,
                role: 'owner',
                permissions: ['all'],
                status: 'active',
                created_by: 'system',
            });
            console.log('✅ Admin created');
        } else {
            console.log('Updating admin password...');
            admin.password = hashedPassword;
            admin.status = 'active';
            await admin.save();
            console.log('✅ Admin password updated');
        }

        // Verify
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log('Verification match:', isMatch);

        await mongoose.disconnect();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

ensureAdmin();
