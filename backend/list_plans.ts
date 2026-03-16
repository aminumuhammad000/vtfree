
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AirtimePlan from './src/models/airtime_plan.model.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');
        console.log('Connected to MongoDB');
        
        const plans = await AirtimePlan.find({ type: 'DATA', active: true }).limit(20);
        console.log('--- DATA PLANS ---');
        plans.forEach(p => {
            console.log(`ID: ${p._id} | Name: ${p.name} | Price: ${p.price} | ProviderId: ${p.providerId} | Code: ${p.code} | ExtID: ${p.externalPlanId}`);
        });
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
