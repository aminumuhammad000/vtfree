import request from 'supertest';
import app from '../app.js';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SECRET = process.env.VTSTACK_SECRET_KEY || 'default-webhook-secret';

const PAYLOAD = {
  "event": "transaction.deposit",
  "data": {
    "reference": "TXN-VERIFY-" + Date.now(),
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

async function verify() {
  try {
    const payloadString = JSON.stringify(PAYLOAD);
    const signature = crypto
      .createHmac('sha256', SECRET)
      .update(payloadString)
      .digest('hex');

    console.log('--- VERIFYING VTSTACK COMPLIANCE ---');
    console.log('Event:', PAYLOAD.event);
    console.log('Secret (first 5):', SECRET.substring(0, 5));
    console.log('Signature:', signature);

    const response = await request(app)
      .post('/api/v1/webhooks/vtstack')
      .set('X-VTStack-Signature', signature)
      .set('X-VTStack-Secret', SECRET)
      .set('Content-Type', 'application/json')
      .send(PAYLOAD);

    console.log('Status Code:', response.status);
    console.log('Body:', JSON.stringify(response.body, null, 2));

    if (response.status === 200) {
      console.log('✅ SUCCESS: Webhook accepted.');
    } else if (response.status === 404) {
      console.log('ℹ️ INFO: Signature verified, but recipient not found (expected for dummy data).');
    } else if (response.status === 403) {
      console.log('❌ FAILURE: Signature or Secret mismatch.');
    } else {
      console.log('❌ FAILURE: Unexpected status code:', response.status);
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

verify();
