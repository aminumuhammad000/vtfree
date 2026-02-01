import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
async function simulateLogin() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        const email = 'admin@vtuapp.com';
        const password = 'password123';
        const appId = 'vtu_app_001';
        console.log(`Attempting login with: Email=${email}, AppID=${appId}, Password=${password}`);
        const { default: AppAdmin } = await import('../models/app_admin.model.js');
        // 1. Find Admin
        const admin = await AppAdmin.findOne({ app_id: appId, email });
        if (!admin) {
            console.error('❌ Admin not found with these credentials.');
            // Debug: Check if partial match exists
            const byEmail = await AppAdmin.findOne({ email });
            if (byEmail) {
                console.log(`Found admin by email only. Stored AppID: '${byEmail.app_id}'`);
            }
            else {
                console.log('No admin found with this email.');
            }
        }
        else {
            console.log('✅ Admin found.');
            // 2. Check Password
            const isMatch = await bcrypt.compare(password, admin.password);
            if (isMatch) {
                console.log('✅ Password match. Login successful!');
            }
            else {
                console.error('❌ Password mismatch.');
            }
        }
        await mongoose.disconnect();
        console.log('\n✅ Done!');
    }
    catch (error) {
        console.error('❌ Error simulating login:', error);
    }
}
simulateLogin();
