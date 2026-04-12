
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CreatedApp } from './src/models/index.js';

dotenv.config();

async function checkApp() {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vtfree';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const app = await CreatedApp.findOne({ app_id: 'dadsub' });
        if (!app) {
            console.log('App dadsub not found');
        } else {
            console.log('App dadsub found');
            console.log('VTStack Secret Key:', app.payment_settings?.vtstack_secret_key);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkApp();
