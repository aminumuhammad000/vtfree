import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './src/models';
import { connectDatabase } from './src/config/database';

const createExtraAdmin = async () => {
    try {
        await connectDatabase();

        const emails = ['admin@vtfree.com', 'admin@vtuapp.com', 'admin@example.com'];
        const password = 'password123';

        for (const email of emails) {
            let user = await User.findOne({ email });

            if (user) {
                console.log(`User ${email} already exists. Updating password...`);
                const salt = await bcrypt.genSalt(10);
                user.passwordHash = await bcrypt.hash(password, salt);
                user.status = 'active';
                user.role = 'admin';
                await user.save();
                console.log(`Password for ${email} updated successfully.`);
            } else {
                console.log(`Creating new admin user ${email}...`);
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
                console.log(`Admin user ${email} created successfully.`);
            }
        }

        console.log('\nCredentials for all admins:');
        console.log(`Password: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admins:', error);
        process.exit(1);
    }
};

createExtraAdmin();
