import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import config from '../config';
import { connectDatabase } from '../config/database';

const createAdmin = async () => {
    try {
        await connectDatabase();

        const email = 'admin@vtfree.com';
        const password = 'password123';

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            console.log('User already exists. Updating password...');
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(password, salt);
            user.status = 'active';
            user.role = 'admin';
            await user.save();
            console.log('Password updated successfully.');
        } else {
            console.log('Creating new admin user...');
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            user = new User({
                email,
                passwordHash,
                firstName: 'Admin',
                lastName: 'User',
                fullName: 'Admin User',
                phone: '08012345678',
                status: 'active',
                kycLevel: 3,
                businessName: 'VTFree Admin',
                role: 'admin',
            });

            await user.save();
            console.log('Admin user created successfully.');
        }

        console.log('Credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
