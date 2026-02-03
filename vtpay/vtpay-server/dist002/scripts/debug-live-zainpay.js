"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const SystemSetting_1 = require("../models/SystemSetting");
const database_1 = require("../config/database");
async function debugLive() {
    try {
        await (0, database_1.connectDatabase)();
        const settings = await SystemSetting_1.SystemSetting.findOne();
        if (!settings?.integrations?.zainpay) {
            console.error('No Zainpay settings found in DB');
            process.exit(1);
        }
        const { baseUrl, apiKey } = settings.integrations.zainpay;
        console.log('Using Config:', { baseUrl, apiKey: apiKey ? 'Present' : 'Missing' });
        const client = axios_1.default.create({
            baseURL: baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            validateStatus: () => true // Allow all status codes
        });
        const tests = [
            { method: 'GET', url: '/zainbox/list' },
            { method: 'GET', url: '/zainbox/list/' },
            { method: 'POST', url: '/zainbox/list' },
            { method: 'GET', url: '/bank/list' },
            { method: 'GET', url: '/v1/zainbox/list' },
        ];
        for (const test of tests) {
            console.log(`\nTesting ${test.method} ${baseUrl}${test.url}...`);
            try {
                // @ts-ignore
                const response = await client[test.method.toLowerCase()](test.url);
                console.log(`Status: ${response.status} ${response.statusText}`);
                if (response.status !== 200) {
                    console.log('Response:', JSON.stringify(response.data).substring(0, 200));
                    console.log('Allow Header:', response.headers['allow']);
                }
                else {
                    console.log('Success! Data length:', Array.isArray(response.data.data) ? response.data.data.length : 'N/A');
                }
            }
            catch (error) {
                console.log('Error:', error.message);
            }
        }
        process.exit(0);
    }
    catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}
debugLive();
//# sourceMappingURL=debug-live-zainpay.js.map