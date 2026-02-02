
import { zainpayService } from '../services/ZainpayService';
import { connectDatabase } from '../config/database';

async function testService() {
    try {
        await connectDatabase();

        console.log('Initial BaseURL:', (zainpayService as any).baseUrl);

        await zainpayService.refreshConfig();
        console.log('Refreshed BaseURL:', (zainpayService as any).baseUrl);

        console.log('Calling listZainboxes...');
        const response = await zainpayService.listZainboxes();
        console.log('Response Status:', response.code);
        console.log('Data Length:', Array.isArray(response.data) ? response.data.length : 'N/A');

        process.exit(0);
    } catch (error: any) {
        console.error('Service Test Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        process.exit(1);
    }
}

testService();
