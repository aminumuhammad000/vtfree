import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
import ProviderConfig from '../models/provider.model.js';
import logger from '../utils/logger.js';

dotenv.config();

const APP_ID = 'vtu_app_001';

const PROVIDERS = [
    {
        app_id: APP_ID,
        name: 'IBDATA',
        code: 'ibdata',
        base_url: 'https://api.ibdata.com.ng/api',
        api_key: process.env.IBDATA_API_KEY || '',
        active: true,
        priority: 1,
        supported_services: ['airtime', 'data'],
        metadata: {
            env: {
                IBDATA_API_KEY: process.env.IBDATA_API_KEY || ''
            }
        }
    },
    {
        app_id: APP_ID,
        name: 'SME PLUG',
        code: 'smeplug',
        base_url: 'https://smeplug.ng/api',
        api_key: 'acc5a5e0c43bcd66498b0bf68aa38f2bf3290019e09f7305f6d158106f09475f',
        active: false,
        priority: 2,
        supported_services: ['airtime', 'data'],
        metadata: {
            env: {
                SMEPLUG_API_KEY: 'acc5a5e0c43bcd66498b0bf68aa38f2bf3290019e09f7305f6d158106f09475f'
            }
        }
    },
    {
        app_id: APP_ID,
        name: 'TOPUPMATE',
        code: 'topupmate',
        base_url: 'https://connect.topupmate.com/api',
        api_key: '',
        active: false,
        priority: 3,
        supported_services: ['airtime', 'data', 'cable', 'electricity', 'exampin'],
        metadata: {
            env: {
                TOPUPMATE_API_KEY: ''
            }
        }
    }
];

async function run() {
    try {
        await mongoose.connect(config.mongoUri);
        logger.info(`Connected to MongoDB for app ${APP_ID}`);

        for (const p of PROVIDERS) {
            const exists = await ProviderConfig.findOne({ app_id: APP_ID, code: p.code });
            if (exists) {
                await ProviderConfig.updateOne({ _id: exists._id }, { $set: p });
                logger.info(`Updated provider for ${APP_ID}: ${p.code}`);
            } else {
                await ProviderConfig.create(p);
                logger.info(`Inserted provider for ${APP_ID}: ${p.code}`);
            }
        }

        console.log(`✅ App Providers seeded/updated for ${APP_ID}: ${PROVIDERS.length}`);
    } catch (err) {
        logger.error('Error seeding app providers:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

run();
