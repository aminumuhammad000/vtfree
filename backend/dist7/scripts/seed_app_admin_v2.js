import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import AppAdmin from '../models/app_admin.model.js';
async function seedAppAdmin() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');
        const app_id = 'vtu_app_001';
        const email = 'admin@vtuapp.com';
        const password = 'Admin@123456';
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create or update AppAdmin
        const existingAdmin = await AppAdmin.findOne({ app_id, email });
        if (existingAdmin) {
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log(`Updated existing AppAdmin: ${email}`);
        }
        else {
            await AppAdmin.create({
                app_id,
                email,
                password: hashedPassword,
                role: 'owner',
                status: 'active'
            });
            console.log(`Created new AppAdmin: ${email}`);
        }
        console.log('\n--- Credentials ---');
        console.log(`App ID: ${app_id}`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        await mongoose.disconnect();
    }
    catch (err) {
        console.error(err);
    }
}
seedAppAdmin();
