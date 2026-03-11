import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
import AirtimePlan from '../models/airtime_plan.model.js';
import logger from '../utils/logger.js';
dotenv.config();
const IBDATA_GLOBAL_PLANS = [
    // MTN DATA
    { providerId: 1, providerName: 'MTN', externalPlanId: '65cd00000000000000000001', code: 'MTN_500MB_SME', name: 'MTN 500MB SME', price: 155, type: 'DATA', source_provider: 'ibdata', meta: { data_value: '1', validity: '30 days' } },
    { providerId: 1, providerName: 'MTN', externalPlanId: '65cd00000000000000000002', code: 'MTN_1GB_SME', name: 'MTN 1GB SME', price: 310, type: 'DATA', source_provider: 'ibdata', meta: { data_value: '2', validity: '30 days' } },
    { providerId: 1, providerName: 'MTN', externalPlanId: '65cd00000000000000000003', code: 'MTN_2GB_SME', name: 'MTN 2GB SME', price: 620, type: 'DATA', source_provider: 'ibdata', meta: { data_value: '3', validity: '30 days' } },
    { providerId: 1, providerName: 'MTN', externalPlanId: '65cd00000000000000000004', code: 'MTN_3GB_SME', name: 'MTN 3GB SME', price: 930, type: 'DATA', source_provider: 'ibdata', meta: { data_value: '4', validity: '30 days' } },
    { providerId: 1, providerName: 'MTN', externalPlanId: '65cd00000000000000000005', code: 'MTN_5GB_SME', name: 'MTN 5GB SME', price: 1550, type: 'DATA', source_provider: 'ibdata', meta: { data_value: '5', validity: '30 days' } },
    { providerId: 1, providerName: 'MTN', externalPlanId: '65cd00000000000000000010', code: 'MTN_10GB_SME', name: 'MTN 10GB SME', price: 3100, type: 'DATA', source_provider: 'ibdata', meta: { data_value: '10', validity: '30 days' } },
    // GLO DATA
    { providerId: 3, providerName: 'GLO', externalPlanId: '65cd00000000000000000011', code: 'GLO_1GB', name: 'GLO 1GB', price: 250, type: 'DATA', source_provider: 'ibdata', meta: { data_value: '11', validity: '30 days' } },
    { providerId: 3, providerName: 'GLO', externalPlanId: '65cd00000000000000000012', code: 'GLO_2GB', name: 'GLO 2GB', price: 500, type: 'DATA', source_provider: 'ibdata', meta: { data_value: '12', validity: '30 days' } },
    // AIRTEL DATA
    { providerId: 2, providerName: 'AIRTEL', externalPlanId: '65cd00000000000000000021', code: 'AIRTEL_1GB', name: 'AIRTEL 1GB', price: 290, type: 'DATA', source_provider: 'ibdata', meta: { data_value: '21', validity: '30 days' } },
    // 9MOBILE DATA
    { providerId: 4, providerName: '9MOBILE', externalPlanId: '65cd00000000000000000031', code: '9MOBILE_1GB', name: '9MOBILE 1GB', price: 200, type: 'DATA', source_provider: 'ibdata', meta: { data_value: '31', validity: '30 days' } },
];
async function seedGlobalIBDataPlans() {
    try {
        await mongoose.connect(config.mongoUri);
        logger.info('Connected to MongoDB');
        for (const plan of IBDATA_GLOBAL_PLANS) {
            const filter = {
                app_id: { $exists: false },
                externalPlanId: plan.externalPlanId,
                providerId: plan.providerId,
                type: plan.type
            };
            const exists = await AirtimePlan.findOne(filter);
            if (exists) {
                await AirtimePlan.updateOne({ _id: exists._id }, { $set: plan });
                logger.info(`Updated global plan: ${plan.name}`);
            }
            else {
                await AirtimePlan.create(plan);
                logger.info(`Inserted global plan: ${plan.name}`);
            }
        }
        console.log(`✅ Global IBData Plans seeded: ${IBDATA_GLOBAL_PLANS.length}`);
    }
    catch (err) {
        logger.error('Error seeding global IBData plans:', err);
        console.error('❌ Error seeding global IBData plans:', err);
        process.exit(1);
    }
    finally {
        await mongoose.disconnect();
        logger.info('Disconnected from MongoDB');
    }
}
seedGlobalIBDataPlans();
