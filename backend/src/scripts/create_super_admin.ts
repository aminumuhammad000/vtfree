import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import SuperAdmin from '../models/super_admin.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/connecta_vtu';

async function createSuperAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to database.');

        const email = 'superadmin@vtfree.com';
        const password = 'password123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const existingAdmin = await SuperAdmin.findOne({ email });
        if (existingAdmin) {
            console.log('Super Admin already exists. Updating password...');
            existingAdmin.password = hashedPassword;
            existingAdmin.name = 'Super Admin';
            await existingAdmin.save();
            console.log(`✅ Super Admin updated successfully.`);
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            process.exit(0);
        }

        const newAdmin = new SuperAdmin({
            email,
            password: hashedPassword,
            name: 'Super Admin',
            role: 'super_admin',
            permissions: ['all']
        });

        await newAdmin.save();

        console.log('✅ Super Admin created successfully.');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error('Error creating super admin:', error);
        process.exit(1);
    }
}

createSuperAdmin();
