import { payrantService } from '../services/PayrantService';
import { connectDatabase } from '../config/database';
import { SystemSetting } from '../models/SystemSetting';

async function testPayrantBanks() {
    try {
        console.log('🔌 Connecting to database...');
        await connectDatabase();

        console.log('🔍 Checking System Settings for Payrant config...');
        const settings = await SystemSetting.findOne();

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
        const banks = await payrantService.getBanksList();

        if (banks && banks.length > 0) {
            console.log(`✅ Success! Fetched ${banks.length} banks.`);
            console.log('First 3 banks:', JSON.stringify(banks.slice(0, 3), null, 2));
        } else {
            console.log('⚠️ Fetched bank list is empty or undefined.');
        }

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error fetching banks:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

testPayrantBanks();
