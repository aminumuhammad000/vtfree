import { VTPayService } from '../services/vtpay.service.js';
import { configService } from '../services/config.service.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
async function testVTPay() {
    try {
        // Connect to MongoDB (needed for config service)
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vtfree';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        // Seed defaults to ensure keys exist
        await configService.seedDefaults();
        // Ensure API Key is set (uncomment to set manually)
        // const apiKey = 'sk_live_xxxxxxxxxxxxxxxxxxxx';
        // await configService.set('VTPAY_API_KEY', apiKey);
        const apiKey = await configService.get('VTPAY_API_KEY');
        console.log('Using API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not Set');
        // Test 1: Get Virtual Accounts
        console.log('\n--- Testing getVirtualAccounts ---');
        try {
            const accounts = await VTPayService.getVirtualAccounts();
            console.log('Virtual Accounts:', JSON.stringify(accounts, null, 2));
        }
        catch (error) {
            console.error('getVirtualAccounts failed:', error.message);
        }
        // Test 2: Create Virtual Account (Mock data)
        console.log('\n--- Testing createVirtualAccount ---');
        const mockAccount = {
            bankType: 'gtBank',
            accountName: 'Test User',
            email: 'test@example.com',
            reference: `ref_${Date.now()}`,
            phone: '08012345678'
        };
        try {
            const newAccount = await VTPayService.createVirtualAccount(mockAccount);
            console.log('New Account:', JSON.stringify(newAccount, null, 2));
        }
        catch (error) {
            console.error('createVirtualAccount failed:', error.message);
        }
    }
    catch (error) {
        console.error('Test script error:', error);
    }
    finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}
testVTPay();
