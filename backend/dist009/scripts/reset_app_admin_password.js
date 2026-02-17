import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
async function resetAppAdminPassword() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        const email = 'admin@vtuapp.com';
        const appId = 'vtu_app_001';
        const newPassword = 'password123';
        const { default: AppAdmin } = await import('../models/app_admin.model.js');
        const admin = await AppAdmin.findOne({ email, app_id: appId });
        if (!admin) {
            console.error('❌ AppAdmin not found! Cannot reset password.');
        }
        else {
            console.log(`Found AppAdmin: ${admin._id}`);
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            admin.password = hashedPassword;
            await admin.save();
            console.log('✅ Password reset successfully to: ' + newPassword);
            // Verify immediately
            const isMatch = await bcrypt.compare(newPassword, admin.password);
            console.log('Immediate verification match:', isMatch);
        }
        await mongoose.disconnect();
        console.log('\n✅ Done!');
    }
    catch (error) {
        console.error('❌ Error resetting password:', error);
    }
}
resetAppAdminPassword();
