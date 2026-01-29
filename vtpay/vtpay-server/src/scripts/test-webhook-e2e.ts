import crypto from 'crypto';
import axios from 'axios';

async function testWebhook() {
    const secret = 'test_secret';
    const payload = {
        event: 'transfer.completed',
        data: {
            reference: 'TEST_REF_123',
            amount: 5000,
            status: 'success'
        }
    };

    const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

    console.log('Generated Signature:', signature);
    console.log('Payload:', JSON.stringify(payload));

    // In a real test we would send this to the local server
    // For now we just verify the generation logic matches our implementation
}

testWebhook();
