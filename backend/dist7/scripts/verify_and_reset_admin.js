import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import AppAdmin from '../models/app_admin.model.js';
/**
 * Verify admin exists and reset password to a known value
 */
async function verifyAndResetAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB\n');
        // Find the admin
        const admin = await AppAdmin.findOne({
            app_id: 'vtu_app_001',
            email: 'admin@vtuapp.com'
        });
        if (!admin) {
            console.log('❌ Admin not found!');
            console.log('\nSearching for any admin with email admin@vtuapp.com...');
            const anyAdmin = await AppAdmin.findOne({ email: 'admin@vtuapp.com' });
            if (anyAdmin) {
                console.log('✅ Found admin with different app_id:');
                console.log(`   App ID: ${anyAdmin.app_id}`);
                console.log(`   Email: ${anyAdmin.email}`);
                console.log(`   Role: ${anyAdmin.role}`);
            }
            else {
                console.log('❌ No admin found with email admin@vtuapp.com');
            }
            return;
        }
        console.log('✅ Admin found!');
        console.log(`   App ID: ${admin.app_id}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Status: ${admin.status}\n`);
        // Reset password
        const newPassword = 'Test@123456';
        console.log('🔧 Resetting password to: Test@123456\n');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        await admin.save();
        console.log('✅ Password reset successful!\n');
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║              🔐 LOGIN CREDENTIALS 🔐                        ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        console.log(`App ID:       ${admin.app_id}`);
        console.log(`Email:        ${admin.email}`);
        console.log(`Password:     Test@123456`);
        console.log('\n──────────────────────────────────────────────────────────────\n');
        console.log('🧪 TEST WITH CURL:');
        console.log('\ncurl -X POST http://localhost:5000/api/app-admin/login \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log(`  -d '${JSON.stringify({
            app_id: admin.app_id,
            email: admin.email,
            password: newPassword
        })}'`);
        console.log('\n');
        // Verify the password by checking if it matches
        const isMatch = await bcrypt.compare(newPassword, admin.password);
        console.log(`✅ Password verification: ${isMatch ? 'PASSED' : 'FAILED'}\n`);
    }
    catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
    finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB\n');
    }
}
verifyAndResetAdmin();
