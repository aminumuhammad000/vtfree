import crypto from 'crypto';
import axios from 'axios';
const PAYLOAD = {
    event: 'payment.success',
    data: {
        reference: 'TEST_REF_' + Date.now(),
        accountNumber: '1234567890', // We need this to match a user in the DB
        amount: '500',
        bankName: 'PalmPay'
    }
};
const SECRET = 'default-webhook-secret'; // Fallback used in the controller
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
                'x-vtstack-signature': signature,
                'x-vtstack-secret': SECRET
            }
        });
        console.log('Response:', response.status, response.data);
    }
    catch (error) {
        console.error('Error testing webhook:', error.response?.status, error.response?.data || error.message);
    }
}
testWebhook();
