"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ZainpayService_1 = require("../services/ZainpayService");
const models_1 = require("../models");
const config_1 = __importDefault(require("../config"));
async function testCreateAccount() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(config_1.default.mongodbUri);
        console.log('Refreshing Zainpay config...');
        await ZainpayService_1.zainpayService.refreshConfig();
        const email = 'amee@gmail.com';
        const user = await models_1.User.findOne({ email });
        if (!user) {
            console.error('User not found');
            return;
        }
        const zainbox = await models_1.Zainbox.findOne({ userId: user._id });
        if (!zainbox) {
            console.error('Zainbox not found for user');
            return;
        }
        console.log('Attempting to create virtual account...');
        console.log('Zainbox Code:', zainbox.zainboxCode);
        const payload = {
            bankType: 'gtBank',
            firstName: user.firstName,
            surname: user.lastName,
            email: user.email,
            mobileNumber: user.phone,
            dob: '01-01-1990',
            gender: 'M',
            address: 'Nigeria',
            title: 'Mr',
            state: 'Lagos',
            bvn: user.bvn || '',
            zainboxCode: zainbox.zainboxCode,
        };
        try {
            const response = await ZainpayService_1.zainpayService.createVirtualAccount(payload);
            console.log('Response:', JSON.stringify(response, null, 2));
        }
        catch (error) {
            console.error('Error Status:', error.response?.status);
            console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
            console.error('Error Message:', error.message);
            console.error('Full URL:', error.config?.url);
            console.error('Method:', error.config?.method);
        }
    }
    catch (error) {
        console.error('Fatal Error:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
testCreateAccount();
//# sourceMappingURL=test-create-account.js.map