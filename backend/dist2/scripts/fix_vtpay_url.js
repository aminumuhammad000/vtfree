import { configService } from '../services/config.service.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
async function fixVTStackURL() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vtfree';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        await configService.set('VTSTACK_BASE_URL', 'http://localhost:3000/api');
        console.log('VTSTACK_BASE_URL set to http://localhost:3000/api');
        const apiKey = await configService.get('VTSTACK_API_KEY');
        if (!apiKey || apiKey === 'your_vtstack_api_key_here') {
            // If it's not set, we might need to set a real one or at least something that looks valid
            // But for now let's just fix the URL.
            console.log('Warning: VTSTACK_API_KEY is not set or is default.');
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await mongoose.disconnect();
    }
}
fixVTStackURL();
