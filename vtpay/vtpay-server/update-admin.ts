import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './src/models';
import { connectDatabase } from './src/config/database';

const updateAdminProfile = async () => {
    try {
        await connectDatabase();

        const email = 'admin@vtfree.com';
        let user = await User.findOne({ email });

        if (user) {
            console.log('Updating admin profile...');
            user.firstName = 'Admin';
            user.lastName = 'User';
            user.phone = '08012345678';
            user.status = 'active';
            user.kycLevel = 3;
            user.role = 'admin';
            await user.save();
            console.log('Admin profile updated successfully.');
        } else {
            console.log('Admin user not found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error updating admin:', error);
        process.exit(1);
    }
};

updateAdminProfile();
