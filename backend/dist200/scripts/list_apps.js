import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import CreatedApp from '../models/created_app.model.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');
        console.log('Connected to DB');
        const apps = await CreatedApp.find({}).sort({ createdAt: -1 }).limit(5);
        console.log(`Found ${apps.length} apps:`);
        apps.forEach(app => {
            console.log(`- ID: ${app.app_id} | Name: ${app.app_name} | Status: ${app.status} | Paid: ${app.payment_status} | Owner: ${app.owner_id}`);
        });
        if (apps.length > 0) {
            console.log(`\nTo trigger build for the first app: ${apps[0].app_id}`);
        }
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await mongoose.disconnect();
    }
};
run();
