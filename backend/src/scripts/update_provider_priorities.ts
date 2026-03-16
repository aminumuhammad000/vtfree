
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProviderConfig from '../models/provider.model.js';

dotenv.config();

const updatePriorities = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // 1. Update SME Plug to priority 1 (for bill payments)
        const smeResult = await ProviderConfig.updateMany(
            { code: 'smeplug' },
            { $set: { priority: 1, active: true } }
        );
        console.log(`Updated ${smeResult.modifiedCount} SME Plug providers to Priority 1`);

        // 2. Update VTStack to priority 1 (for virtual accounts and payments)
        const vtstackResult = await ProviderConfig.updateMany(
            { code: 'vtstack' },
            { $set: { priority: 1, active: true } }
        );
        console.log(`Updated ${vtstackResult.modifiedCount} VTStack providers to Priority 1`);

        // 3. Deactivate all other legacy providers
        const legacyResult = await ProviderConfig.updateMany(
            { code: { $nin: ['smeplug', 'vtstack'] } },
            { $set: { active: false, priority: 100 } }
        );
        console.log(`Deactivated ${legacyResult.modifiedCount} legacy providers`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updatePriorities();
