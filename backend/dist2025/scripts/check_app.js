import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CreatedApp from '../models/created_app.model.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('Current directory:', process.cwd());
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Loaded' : 'Not Loaded');
const checkApp = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');
        const apps = await CreatedApp.find({}).select('app_id app_name');
        console.log('Found apps:', JSON.stringify(apps, null, 2));
        const appId = 'abbasalehsub';
        const app = await CreatedApp.findOne({ app_id: appId });
        if (app) {
            console.log('App found:', JSON.stringify(app.toJSON(), null, 2));
        }
        else {
            console.log('App not found with ID:', appId);
        }
        await mongoose.disconnect();
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};
checkApp();
