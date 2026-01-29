"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const WebhookService_1 = require("../services/WebhookService");
const replayWebhook = async () => {
    try {
        await (0, database_1.connectDatabase)();
        const payload = {
            "data": {
                "amountAfterCharges": "9860",
                "bankName": "",
                "beneficiaryAccountName": "",
                "beneficiaryAccountNumber": "9800009739",
                "callBackUrl": "https://vtpayapi.vtfree.com.ng/api/webhooks/zainpay",
                "depositedAmount": "10000",
                "emailNotification": "swallern@gmail.com",
                "narration": "",
                "paymentDate": "2026-01-17T17:01:12.270458722",
                "paymentRef": "467918247/S40976022",
                "sender": "",
                "senderName": "",
                "txnChargesAmount": "140",
                "txnDate": "2026-01-17T17:01:16.743091717",
                "txnRef": "S40976022",
                "txnType": "deposit",
                "zainboxCode": "12762_Y4eeBoWTnH9RzXFvvl8Y",
                "zainboxName": "swallern Workspace"
            },
            "event": "deposit.success"
        }; // Casting as any because some fields might be optional/different in type definition but this matches the log
        console.log('Replaying webhook...');
        const result = await WebhookService_1.webhookService.processWebhook(payload);
        console.log('Result:', result);
        process.exit(0);
    }
    catch (error) {
        console.error('Error replaying webhook:', error);
        process.exit(1);
    }
};
replayWebhook();
//# sourceMappingURL=replay-webhook.js.map