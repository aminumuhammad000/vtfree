"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_URL = 'http://localhost:3000/api';
async function testZainboxSync() {
    try {
        console.log('🧪 Testing Zainbox Sync Endpoint...\n');
        // Step 1: Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios_1.default.post(`${API_URL}/admin/login`, {
            email: 'admin@vtpay.com',
            password: 'Admin@123'
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful\n');
        // Step 2: Test sync endpoint
        console.log('2. Testing sync endpoint: POST /admin/zainboxes/actions/sync');
        const syncResponse = await axios_1.default.post(`${API_URL}/admin/zainboxes/actions/sync`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Sync Response:', JSON.stringify(syncResponse.data, null, 2));
        // Step 3: Verify zainboxes were synced
        console.log('\n3. Fetching zainboxes to verify sync...');
        const zainboxesResponse = await axios_1.default.get(`${API_URL}/admin/zainboxes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`✅ Total Zainboxes: ${zainboxesResponse.data.data.length}`);
        if (zainboxesResponse.data.data.length > 0) {
            console.log('\nSample Zainbox:');
            const sample = zainboxesResponse.data.data[0];
            console.log(`  - Name: ${sample.name}`);
            console.log(`  - Code: ${sample.zainboxCode}`);
            console.log(`  - Owner: ${typeof sample.userId === 'object' ? sample.userId.email : sample.userId}`);
        }
        console.log('\n✅ ALL TESTS PASSED! Zainbox sync is working correctly.');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ TEST FAILED!');
        console.error('Error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        process.exit(1);
    }
}
testZainboxSync();
//# sourceMappingURL=test-zainbox-sync.js.map