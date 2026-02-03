"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const baseUrl = process.env.ZAINPAY_BASE_URL || 'https://api.zainpay.ng';
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
            const response = await (0, axios_1.default)({
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
            }
            else {
                console.log('Response:', JSON.stringify(response.data).substring(0, 200));
                console.log('Headers:', JSON.stringify(response.headers));
            }
        }
        catch (error) {
            console.error('Error:', error.message);
        }
    }
};
runTests();
//# sourceMappingURL=test-zainpay.js.map