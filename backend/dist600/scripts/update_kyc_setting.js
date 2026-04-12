import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
import SystemConfig from '../models/system_config.model.js';
async function updateKycSetting() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        const key = 'KYC_AUTO_APPROVE';
        const value = 'true';
        const result = await SystemConfig.findOneAndUpdate({ key }, {
            key,
            value,
            group: 'SECURITY',
            description: 'Auto-approve KYC uploads (true/false)'
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
        console.log(`✅ System Config updated: ${key} = ${result.value}`);
        await mongoose.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error updating KYC setting:', error);
        process.exit(1);
    }
}
updateKycSetting();
