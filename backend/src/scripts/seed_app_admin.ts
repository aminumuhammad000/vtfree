import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import AppAdmin from '../models/app_admin.model.js';
import CreatedApp from '../models/created_app.model.js';

async function seedAppAdmin() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        const app_id = 'vtu_app_001';
        const email = 'admin@testvtuapp.com';
        const password = 'Admin@123456';

        // Ensure the app exists
        let app = await CreatedApp.findOne({ app_id });
        if (!app) {
            console.log(`Creating app ${app_id}...`);
            app = await CreatedApp.create({
                app_id,
                app_name: 'Test VTU App',
                owner_id: new mongoose.Types.ObjectId(), // Dummy owner
                package_name: 'com.test.vtu',
                branding: {
                    logo_url: '',
                    primary_color: '#000000',
                    secondary_color: '#ffffff'
                },
                status: 'active'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create or update AppAdmin
        const existingAdmin = await AppAdmin.findOne({ app_id, email });
        if (existingAdmin) {
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log(`Updated existing AppAdmin: ${email}`);
        } else {
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
    } catch (err) {
        console.error(err);
    }
}

seedAppAdmin();
