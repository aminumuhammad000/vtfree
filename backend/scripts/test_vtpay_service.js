import { VTPayService } from '../src/services/vtpay.service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');

        console.log('Testing VTPayService.createVirtualAccount...');
        try {
            const result = await VTPayService.createVirtualAccount({
                bankType: 'moniepoint',
                accountName: 'Test Admin',
                email: 'testadmin@example.com',
                reference: 'TEST-' + Date.now(),
                phone: '08012345678'
            });
            console.log('Result:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Caught Error:', error.message);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Setup Error:', error);
    }
}

test();
