import crypto from 'crypto';
import axios from 'axios';
const PAYLOAD = {
    "event": "transaction.deposit",
    "data": {
        "reference": "TXN-" + Date.now(),
        "amount": 10000,
        "currency": "NGN",
        "status": "success",
        "customer": {
            "name": "AMINU MUHAMMAD",
            "accountNumber": "8100015498"
        },
        "virtualAccount": "6654762099",
        "timestamp": new Date().toISOString()
    },
    "timestamp": new Date().toISOString()
};
const SECRET = 'default-webhook-secret'; // Match fallback in controller for local test
async function testWebhook() {
    try {
        const payloadString = JSON.stringify(PAYLOAD);
        // Calculate HMAC-SHA256 signature
        const signature = crypto
            .createHmac('sha256', SECRET)
            .update(payloadString)
            .digest('hex');
        console.log('Testing webhook with:');
        console.log('URL: http://localhost:5000/api/v1/webhooks/vtstack');
        console.log('Signature:', signature);
        const response = await axios.post('http://localhost:5000/api/v1/webhooks/vtstack', PAYLOAD, {
            headers: {
                'Content-Type': 'application/json',
                'X-VTStack-Signature': signature,
                'X-VTStack-Secret': SECRET
            }
        });
        console.log('Response:', response.status, response.data);
    }
    catch (error) {
        console.error('Error testing webhook:', error.response?.status, error.response?.data || error.message);
    }
}
testWebhook();
