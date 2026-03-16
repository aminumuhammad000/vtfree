
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AirtimePlan from './src/models/airtime_plan.model.js';
import ProviderConfig from './src/models/provider.model.js';

dotenv.config();

async function check() {
    try {
        await mongoose.connect(prsocess.env.MONGO_URI || 'mongodb://localhost:27017/vtfree');
        console.log('Connected');

        const smeplug = await ProviderConfig.findOne({ code: 'smeplug' });
        console.log('SMEPlug Config:', JSON.stringify(smeplug, null, 2));

        const plans = await AirtimePlan.find({ type: 'DATA' }).limit(5);
        console.log('Data Plans:', JSON.stringify(plans, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
