import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resetAdminPassword = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // Define AppAdmin schema inline
        const appAdminSchema = new mongoose.Schema({
            email: String,
            password_hash: String,
            app_id: String,
            first_name: String,
            last_name: String,
            role: String,
            is_active: Boolean,
        }, { collection: 'app_admins' });

        const AppAdmin = mongoose.models.AppAdmin || mongoose.model('AppAdmin', appAdminSchema);

        // Prompt for email and app_id
        console.log('\n🔍 Enter admin details to reset password:');

        // For now, let's find all admins and let you choose
        const admins = await AppAdmin.find({});

        if (admins.length === 0) {
            console.log('❌ No admins found in database');
            await mongoose.disconnect();
            return;
        }

        console.log('\n📋 Available admins:');
        admins.forEach((admin, index) => {
            console.log(`${index + 1}. Email: ${admin.email}, App ID: ${admin.app_id}`);
        });

        // For script execution, we'll reset the first admin or you can modify this
        // In a real scenario, you'd use readline to get user input
        const adminToReset = admins[0]; // Change index if needed

        console.log(`\n🔄 Resetting password for: ${adminToReset.email} (App ID: ${adminToReset.app_id})`);

        const newPassword = 'Admin@123456';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await AppAdmin.updateOne(
            { _id: adminToReset._id },
            { $set: { password_hash: hashedPassword } }
        );

        console.log('\n✅ Password reset successful!');
        console.log('\n📝 Login credentials:');
        console.log(`   Email:    ${adminToReset.email}`);
        console.log(`   Password: ${newPassword}`);
        console.log(`   App ID:   ${adminToReset.app_id}`);

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        process.exit(1);
    }
};

resetAdminPassword();
