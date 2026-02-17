import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import ProviderConfig from '../models/provider.model.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
const updateIBData = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');
        const key = process.env.IBDATA_API_KEY || 'sk_live_dummy_placeholder';
        // Update both system default (app_id: null)
        const filter = { code: 'ibdata', app_id: null };
        const update = {
            $set: {
                api_key: key,
                name: 'IBData', // Ensure name exists
                base_url: 'https://api.ibdata.com.ng/api',
                active: true,
                supported_services: ['airtime', 'data', 'cable', 'electricity']
            }
        };
        const options = { new: true, upsert: true };
        const result = await ProviderConfig.findOneAndUpdate(filter, update, options);
        console.log('Updated IBData Provider Config:', result);
        await mongoose.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error('Error updating key:', error);
        process.exit(1);
    }
};
updateIBData();
