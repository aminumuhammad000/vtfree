"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
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
    const signature = crypto_1.default
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
    console.log('Generated Signature:', signature);
    console.log('Payload:', JSON.stringify(payload));
    // In a real test we would send this to the local server
    // For now we just verify the generation logic matches our implementation
}
testWebhook();
//# sourceMappingURL=test-webhook-e2e.js.map