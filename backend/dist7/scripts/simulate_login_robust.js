import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
async function simulateLoginRobust() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        const email = '  admin@vtuapp.com  '; // Spaces
        const password = 'password123';
        const appId = '  VTU_APP_001  '; // Spaces + Caps
        console.log(`Attempting login with: Email='${email}', AppID='${appId}'`);
        // Simulate Controller Logic
        let sanitizedEmail = email.trim().toLowerCase();
        let sanitizedAppId = appId.trim();
        console.log(`Sanitized: Email='${sanitizedEmail}', AppID='${sanitizedAppId}'`);
        const { default: AppAdmin } = await import('../models/app_admin.model.js');
        // 1. Exact Match
        let admin = await AppAdmin.findOne({ app_id: sanitizedAppId, email: sanitizedEmail });
        // 2. Case-insensitive Fallback
        if (!admin) {
            console.log('Exact match not found, trying case-insensitive App ID...');
            admin = await AppAdmin.findOne({
                app_id: { $regex: new RegExp(`^${sanitizedAppId}$`, 'i') },
                email: sanitizedEmail
            });
        }
        if (!admin) {
            console.error('❌ Admin not found even with robust check.');
        }
        else {
            console.log(`✅ Admin found! ID: ${admin._id}, AppID: ${admin.app_id}`);
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
simulateLoginRobust();
