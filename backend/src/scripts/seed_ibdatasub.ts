
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import CreatedApp from '../models/created_app.model.ts';
import VTfreeUser from '../models/vtfree_user.model.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedApp = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Find a user to be the owner (or create one)
        let owner = await VTfreeUser.findOne();
        if (!owner) {
            console.log('No user found, creating a dummy owner...');
            owner = await VTfreeUser.create({
                email: 'owner@ibdatasub.com',
                password_hash: 'dummyhash',
                first_name: 'Owner',
                last_name: 'User',
                phone_number: '08000000000'
            });
        }

        const appId = 'IBDataSub';
        const appData = {
            app_id: appId,
            owner_id: owner._id,
            app_name: 'IBDataSub',
            package_name: 'com.ibdatasub.app',
            platforms: { android: true, ios: false, web: true },
            status: 'live',
            admin_email: 'admin@ibdatasub.com',
            admin_password_hash: 'hashedpassword',
            branding: {
                primary_color: '#166534', // Green 700
                secondary_color: '#22c55e', // Green 500
                accent_color: '#15803d', // Green 800
                background_color: '#FFFFFF', // White
                app_display_name: 'IBDataSub',
                sidebar_bg_start: '#14532d', // Green 900
                sidebar_bg_end: '#166534'  // Green 700
            }
        };

        const existingApp = await CreatedApp.findOne({ app_id: appId });
        if (existingApp) {
            console.log('Updating existing app...');
            Object.assign(existingApp, appData);
            await existingApp.save();
            console.log('App updated successfully.');
        } else {
            console.log('Creating new app...');
            await CreatedApp.create(appData);
            console.log('App created successfully.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding app:', error);
        process.exit(1);
    }
};

seedApp();
