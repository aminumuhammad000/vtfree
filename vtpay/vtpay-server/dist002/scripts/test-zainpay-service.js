"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ZainpayService_1 = require("../services/ZainpayService");
const database_1 = require("../config/database");
async function testService() {
    try {
        await (0, database_1.connectDatabase)();
        console.log('Initial BaseURL:', ZainpayService_1.zainpayService.baseUrl);
        await ZainpayService_1.zainpayService.refreshConfig();
        console.log('Refreshed BaseURL:', ZainpayService_1.zainpayService.baseUrl);
        console.log('Calling listZainboxes...');
        const response = await ZainpayService_1.zainpayService.listZainboxes();
        console.log('Response Status:', response.code);
        console.log('Data Length:', Array.isArray(response.data) ? response.data.length : 'N/A');
        process.exit(0);
    }
    catch (error) {
        console.error('Service Test Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        process.exit(1);
    }
}
testService();
//# sourceMappingURL=test-zainpay-service.js.map