import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import SuperAdmin from '../models/super_admin.model.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree';

async function createSuperAdmin() {
    const email = process.env.ADMIN_EMAIL || 'admin@vtfree.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const firstName = 'System';
    const lastName = 'Administrator';

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully.');

        // Check if admin already exists
        const existingAdmin = await SuperAdmin.findOne({ email });

        if (existingAdmin) {
            console.log(`Admin with email ${email} already exists.`);
            console.log('Updating password...');

            const hashedPassword = await bcrypt.hash(password, 10);
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();

            console.log('Password updated successfully.');
        } else {
            console.log(`Creating new super admin: ${email}...`);

            const hashedPassword = await bcrypt.hash(password, 10);

            await SuperAdmin.create({
                email,
                password: hashedPassword,
                first_name: firstName,
                last_name: lastName,
                role: 'super_admin',
                permissions: ['all'],
                status: 'active'
            });

            console.log('-----------------------------------');
            console.log('Super Admin Created Successfully!');
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            console.log('-----------------------------------');
        }

    } catch (error: any) {
        console.error('Error creating super admin:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createSuperAdmin();
