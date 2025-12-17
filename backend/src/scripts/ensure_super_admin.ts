import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';

async function ensureSuperAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        const email = 'admin@vtuapp.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check SuperAdmin
        try {
            const { default: SuperAdmin } = await import('../models/super_admin.model.js');
            let superAdmin = await SuperAdmin.findOne({ email });

            if (superAdmin) {
                console.log('Found existing SuperAdmin. Updating...');
                superAdmin.password = hashedPassword;
                superAdmin.status = 'active';
                superAdmin.role = 'super_admin';
                await superAdmin.save();
                console.log('✅ SuperAdmin updated successfully.');
            } else {
                console.log('SuperAdmin not found. Creating...');
                superAdmin = await SuperAdmin.create({
                    email,
                    password: hashedPassword,
                    name: 'Super Admin',
                    role: 'super_admin',
                    status: 'active',
                    permissions: ['all']
                });
                console.log('✅ SuperAdmin created successfully.');
            }
        } catch (e) {
            console.error('❌ Error handling SuperAdmin:', e);
        }

        await mongoose.disconnect();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error ensuring super admin:', error);
        process.exit(1);
    }
}

ensureSuperAdmin();
