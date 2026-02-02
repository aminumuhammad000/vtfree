
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const publicKey = process.env.ZAINPAY_PUBLIC_KEY;
const baseUrl = 'https://api.zainpay.ng';

async function testScenario(name, url, method = 'get') {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`${method.toUpperCase()} ${url}`);
    try {
        const client = axios.create({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicKey}`,
            },
        });

        const response = await client[method](url);
        console.log('Success:', response.status);
    } catch (error) {
        if (error.response) {
            console.log('Failed:', error.response.status, error.response.statusText);
        } else {
            console.log('Error:', error.message);
        }
    }
}

async function runTests() {
    // 1. Normal
    await testScenario('Normal GET', `${baseUrl}/bank/list`);

    // 2. Trailing Slash
    await testScenario('Trailing Slash', `${baseUrl}/bank/list/`);

    // 3. POST instead of GET
    await testScenario('POST Method', `${baseUrl}/bank/list`, 'post');

    // 4. Live URL
    await testScenario('Live URL', `https://api.zainpay.ng/bank/list`);
    // 5. Double Slash
    await testScenario('Double Slash', `https://api.zainpay.ng//bank/list`);
}

runTests();
