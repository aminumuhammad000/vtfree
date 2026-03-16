
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AirtimePlan from '../models/airtime_plan.model.js';

dotenv.config();

const checkStatus = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree';
        await mongoose.connect(uri);
        
        const count = await AirtimePlan.countDocuments({});
        console.log(`Total plans: ${count}`);
        
        const providers = await AirtimePlan.distinct('source_provider');
        console.log(`Unique source providers:`, providers);

        const sample = await AirtimePlan.findOne({}).limit(1);
        if (sample) console.log('Sample plan fields:', Object.keys((sample as any)._doc));

        await mongoose.disconnect();
    } catch (error) {
        process.exit(1);
    }
};
checkStatus();
