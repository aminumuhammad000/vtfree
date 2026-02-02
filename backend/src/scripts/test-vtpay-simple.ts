
import axios from 'axios';

// Key retrieved from previous DB query
const SECRET_KEY = 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://vtpayapi.vtfree.com.ng/api';

async function testDirect() {
    console.log(`🔑 Testing with key: ${SECRET_KEY.substring(0, 10)}... (Hardcoded from DB)`);
    console.log(`Testing GET ${BASE_URL}/wallet/balance`);

    try {
        const res = await axios.get(`${BASE_URL}/wallet/balance`, {
            headers: {
                'x-api-key': SECRET_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        console.log('✅ GET /wallet/balance SUCCESS');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
        console.log('❌ GET /wallet/balance FAILED');
        if (err.response) {
            console.log(`Status: ${err.response.status}`);
            console.log('Data:', err.response.data);
        } else {
            console.log('Error:', err.message);
        }
    }

    console.log('-------------------------------------------');
    console.log(`Testing POST ${BASE_URL}/virtual-accounts`);

    // Using random ref to avoid conflict if uniqueness is enforced on ref
    const ref = 'TEST_' + Math.floor(Math.random() * 100000);

    try {
        const res = await axios.post(`${BASE_URL}/virtual-accounts`, {
            accountName: "Test User",
            email: "test.user@example.com",
            phone: "08011112222", // Use valid Nigerian format
            bankType: "moniepoint", // or wema
            reference: ref,
            bvn: "12345678901", // Dummy BVN
            dob: "1990-01-01"
        }, {
            headers: {
                'x-api-key': SECRET_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        console.log('✅ POST /virtual-accounts SUCCESS');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
        console.log('❌ POST /virtual-accounts FAILED');
        if (err.response) {
            console.log(`Status: ${err.response.status}`);
            console.log('Data:', err.response.data);
        } else {
            console.log('Error:', err.message);
        }
    }
}

testDirect();
