import { VTStackService } from '../services/vtstack.service.js';
import dotenv from 'dotenv';
dotenv.config();
async function testVirtualAccountGeneration() {
    const customApiKey = process.env.TEST_VTSTACK_KEY || "sk_live_placeholder";
    console.log('🚀 Testing VTStack Virtual Account Generation...');
    console.log('Using API Key: ' + customApiKey.substring(0, 10) + '...');
    const testData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser' + Date.now() + '@example.com',
        phone: '0' + Math.floor(Math.random() * 9000000000 + 1000000000),
        bvn: String(Math.floor(Math.random() * 90000000000 + 10000000000)),
        reference: 'TEST_VTSTACK_V3_' + Date.now()
    };
    console.log('Data:', JSON.stringify(testData, null, 2));
    try {
        const result = await VTStackService.createVirtualAccount(testData, customApiKey);
        console.log('✅ Success! Response:');
        console.log(JSON.stringify(result, null, 2));
    }
    catch (error) {
        console.error('❌ Failed! Error:');
        console.error(error.message);
        if (error.response?.data) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}
testVirtualAccountGeneration();
