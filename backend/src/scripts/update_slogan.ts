import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
import CreatedApp from '../models/created_app.model.js';

async function updateSlogan() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        const app_id = 'DADSUB';

        const app = await CreatedApp.findOne({ app_id });
        if (app) {
            app.branding = {
                ...app.branding,
                app_tagline: 'dada-app'
            };
            await app.save();
            console.log('✅ Tagline (Slogan) updated to "dada-app" in database.');
        } else {
            console.log('❌ App DADSUB not found in database.');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating tagline:', error);
        process.exit(1);
    }
}

updateSlogan();
