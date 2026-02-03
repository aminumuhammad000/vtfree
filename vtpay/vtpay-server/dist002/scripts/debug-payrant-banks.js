"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PayrantService_1 = require("../services/PayrantService");
const database_1 = require("../config/database");
const SystemSetting_1 = require("../models/SystemSetting");
async function testPayrantBanks() {
    try {
        console.log('🔌 Connecting to database...');
        await (0, database_1.connectDatabase)();
        console.log('🔍 Checking System Settings for Payrant config...');
        const settings = await SystemSetting_1.SystemSetting.findOne();
        if (!settings) {
            console.error('❌ No SystemSetting found!');
            process.exit(1);
        }
        const payrantConfig = settings.integrations?.payrant;
        if (!payrantConfig) {
            console.error('❌ Payrant config is missing in SystemSetting');
            process.exit(1);
        }
        console.log('⚙️ Payrant Config Found:');
        console.log(`   BaseURL: ${payrantConfig.baseUrl}`);
        console.log(`   API Key: ${payrantConfig.apiKey ? 'Present (Starts with ' + payrantConfig.apiKey.substring(0, 5) + '...)' : 'MISSING'}`);
        console.log('\n🚀 Attempting to fetch banks from Payrant...');
        const banks = await PayrantService_1.payrantService.getBanksList();
        if (banks && banks.length > 0) {
            console.log(`✅ Success! Fetched ${banks.length} banks.`);
            console.log('First 3 banks:', JSON.stringify(banks.slice(0, 3), null, 2));
        }
        else {
            console.log('⚠️ Fetched bank list is empty or undefined.');
        }
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error fetching banks:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}
testPayrantBanks();
//# sourceMappingURL=debug-payrant-banks.js.map