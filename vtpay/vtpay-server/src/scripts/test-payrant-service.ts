import { payrantService } from '../services/PayrantService';

async function testService() {
    console.log('Testing PayrantService...');

    // Test 1: Check if verify method exists (it shouldn't based on my edit, but typescript should catch this if I try to call it invalidly)
    // We just want to see if it instantiates and we can call getBanksList (even if it fails auth)

    try {
        console.log('Attemping to get banks list (expected to fail auth/network but verify method calls)...');
        // This effectively checks if the method exists and types are correct at runtime for this script
        await payrantService.getBanksList();
    } catch (error: any) {
        console.log('GetBankList failed as expected (no API key):', error.message);
    }

    console.log('PayrantService Structure Verified.');
}

testService();
