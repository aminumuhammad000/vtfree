import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const baseUrl = process.env.ZAINPAY_BASE_URL || 'https://sandbox.zainpay.ng';
const publicKey = process.env.ZAINPAY_PUBLIC_KEY;

console.log('Testing Zainpay Connection...');
console.log('Base URL:', baseUrl);
console.log('Public Key:', publicKey ? `${publicKey.substring(0, 10)}...` : 'Missing');

const endpoints = [
    { method: 'GET', path: '/bank/list' },
    { method: 'GET', path: '/zainbox/list' },
    { method: 'POST', path: '/zainbox/create/request', data: { name: 'Test', callbackUrl: 'https://example.com' } },
    // Try some variations
    { method: 'GET', path: '/api/bank/list' },
    { method: 'GET', path: '/v1/bank/list' },
];

const runTests = async () => {
    for (const endpoint of endpoints) {
        try {
            console.log(`\nTesting ${endpoint.method} ${baseUrl}${endpoint.path}...`);
            const response = await axios({
                method: endpoint.method,
                url: `${baseUrl}${endpoint.path}`,
                headers: {
                    'Authorization': `Bearer ${publicKey}`,
                    'Content-Type': 'application/json',
                },
                data: endpoint.data,
                validateStatus: () => true, // Don't throw on error status
            });

            console.log(`Status: ${response.status} ${response.statusText}`);
            if (response.status === 200) {
                console.log('Success!');
            } else {
                console.log('Response:', JSON.stringify(response.data).substring(0, 200));
                console.log('Headers:', JSON.stringify(response.headers));
            }
        } catch (error: any) {
            console.error('Error:', error.message);
        }
    }
};

runTests();
