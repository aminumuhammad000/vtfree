import { zainpayService } from './src/services/ZainpayService';
import dotenv from 'dotenv';
dotenv.config();

const testCreateZainbox = async () => {
    try {
        console.log('Testing Zainbox creation...');
        const payload = {
            name: 'Test Zainbox ' + Date.now(),
            callbackUrl: 'https://example.com/webhook',
            emailNotification: 'test@example.com',
            tags: 'test_tag'
        };

        const response = await zainpayService.createZainbox(payload);
        console.log('Response:', JSON.stringify(response, null, 2));
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
};

testCreateZainbox();
