
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

async function debugVTPayCreate() {
    try {
        console.log('--- VTPay Creation Debug (SYSTEM CONFIG) ---');

        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in env');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // FORCE SYSTEM CONFIG TEST
        console.log('⚠️ FORCING SYSTEM CONFIG TEST');
        let apiKey = '';

        // Fetch from systemconfigs directly
        const sysConfig = await mongoose.connection.collection('systemconfigs').findOne({ key: 'VTPAY_SECRET_KEY' });
        if (sysConfig && sysConfig.value) {
            apiKey = sysConfig.value;
            console.log(`🔑 Found System Config Key: ${apiKey.substring(0, 5)}...`);
        } else {
            console.log('❌ System Config Key NOT FOUND in DB');
        }

        if (!apiKey) {
            console.log('❌ No API Key found!');
            return;
        }

        // 3. Prepare Payload
        const payload = {
            bankType: 'moniepoint',
            accountName: 'Debug System Config User',
            email: 'debug_sys@example.com',
            phone: '08099887766',
            reference: `DBG-SYS-${Date.now()}`,
            bvn: '22222222223',
            dob: '1990-01-01'
        };

        const baseURL = 'https://vtpayapi.vtfree.com.ng/api';
        console.log(`🚀 Sending POST to ${baseURL}/virtual-accounts`);

        try {
            const response = await axios.post(`${baseURL}/virtual-accounts`, payload, {
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30s
            });
            console.log('✅ Request SUCCESS!');
            console.log('📄 Response:', JSON.stringify(response.data, null, 2));
        } catch (error: any) {
            console.log('❌ Request FAILED');
            if (error.response) {
                console.log(`STATUS: ${error.response.status}`);
                console.log('DATA:', JSON.stringify(error.response.data, null, 2));
            } else if (error.request) {
                console.log('ERROR: No Response Received (Network/Timeout)');
                console.log('CODE:', error.code);
            } else {
                console.log('ERROR:', error.message);
            }
        }

    } catch (err) {
        console.error('script error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

debugVTPayCreate();
