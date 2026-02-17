import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import SuperAdmin from '../models/super_admin.model.js';
async function ensureSuperAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB at:', config.mongoUri);
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        const email = 'superadmin@vtfree.com';
        const password = 'Admin@123456';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Check if admin exists
        let admin = await SuperAdmin.findOne({ email });
        if (!admin) {
            console.log('Creating Super Admin...');
            admin = await SuperAdmin.create({
                email,
                password: hashedPassword,
                first_name: 'Super',
                last_name: 'Admin',
                role: 'super_admin',
                permissions: ['all'],
                status: 'active'
            });
            console.log('✅ Super Admin created');
        }
        else {
            console.log('Super Admin exists. Updating password...');
            admin.password = hashedPassword;
            admin.status = 'active';
            await admin.save();
            console.log('✅ Super Admin password updated');
        }
        console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: ${email}
🔑 Password: ${password}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
        await mongoose.disconnect();
        console.log('\n✅ Done!');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
ensureSuperAdmin();
