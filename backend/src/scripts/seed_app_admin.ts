import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import AppAdmin from '../models/app_admin.model.js';
import CreatedApp from '../models/created_app.model.js';
import VTfreeUser from '../models/vtfree_user.model.js';

async function seedAppAdmin() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        const app_id = 'vtu_app_001';
        const email = 'admin@testvtuapp.com';
        const password = 'Admin@123456';
        const ownerEmail = 'owner@testvtuapp.com';

        // 1. Ensure VTfreeUser (Owner) exists
        let owner = await VTfreeUser.findOne({ email: ownerEmail });
        if (!owner) {
            console.log(`Creating VTfreeUser (Owner): ${ownerEmail}...`);
            const hashedOwnerPassword = await bcrypt.hash('Owner@123456', 10);
            owner = await VTfreeUser.create({
                email: ownerEmail,
                password: hashedOwnerPassword,
                first_name: 'Test',
                last_name: 'Owner',
                phone_number: '08012345678',
                status: 'active',
                email_verified: true
            });
        }

        // 2. Ensure the app exists and is linked to the owner
        let app = await CreatedApp.findOne({ app_id });
        if (!app) {
            console.log(`Creating app ${app_id}...`);
            app = await CreatedApp.create({
                app_id,
                app_name: 'Test VTU App',
                owner_id: owner._id,
                package_name: 'com.test.vtu',
                branding: {
                    logo_url: '',
                    primary_color: '#000000',
                    secondary_color: '#ffffff'
                },
                status: 'active',
                admin_email: email,
                admin_password_hash: await bcrypt.hash(password, 10)
            });
        } else {
            // Update owner_id if it's different (e.g. if it was a dummy ID)
            if (app.owner_id.toString() !== owner._id.toString()) {
                console.log(`Updating app ${app_id} owner_id...`);
                app.owner_id = owner._id as any;
                await app.save();
            }
        }

        // 3. Hash password for AppAdmin
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create or update AppAdmin
        const existingAdmin = await AppAdmin.findOne({ app_id, email });
        if (existingAdmin) {
            existingAdmin.password = hashedPassword;
            existingAdmin.first_name = 'Test';
            existingAdmin.last_name = 'Admin';
            await existingAdmin.save();
            console.log(`Updated existing AppAdmin: ${email}`);
        } else {
            await AppAdmin.create({
                app_id,
                email,
                password: hashedPassword,
                first_name: 'Test',
                last_name: 'Admin',
                role: 'owner',
                status: 'active'
            });
            console.log(`Created new AppAdmin: ${email}`);
        }

        console.log('\n--- Credentials ---');
        console.log(`App ID: ${app_id}`);
        console.log(`Admin Email: ${email}`);
        console.log(`Admin Password: ${password}`);
        console.log(`Owner Email: ${ownerEmail}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

seedAppAdmin();
