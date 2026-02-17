import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import CreatedApp from '../models/created_app.model.js';
import SystemConfig from '../models/system_config.model.js';
// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });
async function debugVTPay() {
    try {
        console.log('--- VTPay Debug Script ---');
        // 1. Connect to DB
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in env');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        // 2. Check System Config URL
        const config = await SystemConfig.findOne({ key: 'VTPAY_BASE_URL' });
        console.log(`📌 SystemConfig VTPAY_BASE_URL: ${config?.value || 'NOT FOUND'}`);
        // 3. Get App Key
        const app = await CreatedApp.findOne({}); // Get first app
        if (!app) {
            console.log('❌ No CreatedApp found!');
            return;
        }
        console.log(`📌 Found App: ${app.app_name} (${app.app_id})`);
        const secretKey = app.payment_settings?.vtpay_secret_key;
        const apiKey = app.payment_settings?.vtpay_api_key;
        console.log(`🔑 App Secret Key: ${secretKey ? secretKey.substring(0, 10) + '...' : 'MISSING'}`);
        console.log(`🔑 App API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);
        const keyToUse = secretKey || apiKey;
        if (!keyToUse) {
            console.log('❌ No API Key found in CreatedApp');
            return;
        }
        // 4. Test Connectivity
        const baseURL = 'https://vtpayapi.vtfree.com.ng/api';
        console.log(`🚀 Testing connection to: ${baseURL}/wallet/balance`);
        try {
            const response = await axios.get(`${baseURL}/wallet/balance`, {
                headers: {
                    'x-api-key': keyToUse,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            console.log('✅ API Request SUCCESS!');
            console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
        }
        catch (error) {
            console.log('❌ API Request FAILED');
            if (error.response) {
                console.log(`STATUS: ${error.response.status}`);
                console.log('DATA:', JSON.stringify(error.response.data, null, 2));
            }
            else {
                console.log('ERROR:', error.message);
            }
        }
    }
    catch (err) {
        console.error('script error:', err);
    }
    finally {
        await mongoose.disconnect();
    }
}
debugVTPay();
