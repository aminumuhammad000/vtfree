import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
import AirtimePlan from '../models/airtime_plan.model.js';
import logger from '../utils/logger.js';

dotenv.config();

async function clearPlans() {
    try {
        await mongoose.connect(config.mongoUri);
        logger.info('Connected to MongoDB');

        const result = await AirtimePlan.deleteMany({});
        logger.info(`Deleted ${result.deletedCount} plans from the database.`);
        console.log(`✅ Deleted ${result.deletedCount} plans from the database.`);

    } catch (err) {
        logger.error('Error clearing plans:', err);
        console.error('❌ Error clearing plans:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        logger.info('Disconnected from MongoDB');
    }
}

clearPlans();
