"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PayrantService_1 = require("../services/PayrantService");
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
// Mock logger to print to console
logger_1.logger.info = console.log;
logger_1.logger.error = console.error;
async function runProof() {
    console.log('--- STARTING PAYRANT INTEGRATION PROOF ---');
    console.log('1. Configuration Check:');
    console.log(`   - API Key present: ${!!config_1.default.payrant.apiKey}`);
    console.log(`   - Base URL: ${config_1.default.payrant.baseUrl}`);
    console.log('\n2. Attempting a Test Transfer...');
    console.log('   (This sends a request to Payrant to check account status)');
    const payload = {
        bank_code: '058', // GTBank
        account_number: '0123456789',
        account_name: 'Test Account',
        amount: 100, // Small amount
        description: 'Integration Proof Test',
        notify_url: 'https://example.com/webhook'
    };
    try {
        await PayrantService_1.payrantService.transfer(payload);
        console.log('\n[SUCCESS] Transfer initiated successfully!');
        console.log('   > This means the API works AND the account is active.');
    }
    catch (error) {
        console.log('\n[FAILED] Transfer Request Failed');
        if (error.response) {
            console.log('\n--- ERROR PROOF ---');
            console.log(`Status Code: ${error.response.status}`);
            console.log('Server Response Data:');
            console.log(JSON.stringify(error.response.data, null, 2));
            if (error.response.status === 403 && error.response.data?.data?.message?.includes('KYC')) {
                console.log('\n>>> CONCLUSION: INTEGRATION IS WORKING, BUT ACCOUNT IS RESTRICTED (KYC).');
            }
            else {
                console.log('\n>>> CONCLUSION: API ERROR - Check response above.');
            }
        }
        else {
            console.error('Network/Code Error:', error.message);
        }
    }
    console.log('\n--- END PROOF ---');
    process.exit(0);
}
runProof();
//# sourceMappingURL=proof-payrant-status.js.map