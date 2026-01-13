
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CreatedApp from '../models/created_app.model.js';
import VTfreeUser from '../models/vtfree_user.model.js';

dotenv.config();

const findUserApp = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(mongoUri!);
        console.log('Connected to MongoDB');

        const email = 'alkali@gmail.com';
        const user = await VTfreeUser.findOne({ email });

        if (!user) {
            console.log(`User ${email} NOT FOUND.`);
            process.exit(1);
        }

        const apps = await CreatedApp.find({ owner_id: user._id });
        console.log(`Found ${apps.length} apps for ${email}:`);
        apps.forEach(app => {
            console.log(`- App Name: ${app.app_name}`);
            console.log(`  App ID: ${app.app_id}`);
            console.log(`  Package: ${app.package_name}`);
            console.log(`  Admin Login URL: http://localhost:5173/login?app=${app.app_id}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

findUserApp();
