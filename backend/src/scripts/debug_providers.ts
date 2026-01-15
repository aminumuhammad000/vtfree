import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
import ProviderConfig from '../models/provider.model.js';

async function checkProviders() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        const providers = await ProviderConfig.find({});
        console.log('\n--- All Providers ---');
        providers.forEach(p => {
            console.log(`Name: ${p.name}, Code: ${p.code}, AppID: ${p.app_id}, Active: ${p.active}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkProviders();
