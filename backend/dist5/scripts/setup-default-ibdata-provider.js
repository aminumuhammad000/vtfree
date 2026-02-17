// scripts/setup-default-ibdata-provider.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProviderConfig from '../models/provider.model.js';
import CreatedApp from '../models/created_app.model.js';
import logger from '../utils/logger.js';
dotenv.config();
const setupDefaultIBDataProvider = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vtfree');
        logger.info('Connected to MongoDB');
        // Get all created apps
        const apps = await CreatedApp.find({});
        logger.info(`Found ${apps.length} apps`);
        for (const app of apps) {
            const app_id = app.app_id;
            // Check if IBData provider already exists for this app
            const existingIBData = await ProviderConfig.findOne({ app_id, code: 'ibdata' });
            if (existingIBData) {
                logger.info(`IBData already configured for app: ${app_id}`);
                // Update to ensure it's active and has priority 0 (highest)
                existingIBData.active = true;
                existingIBData.priority = 0;
                existingIBData.supported_services = ['airtime', 'data'];
                await existingIBData.save();
                logger.info(`Updated IBData configuration for app: ${app_id}`);
            }
            else {
                // Create IBData provider for this app
                await ProviderConfig.create({
                    app_id,
                    name: 'IBData (Default)',
                    code: 'ibdata',
                    active: true,
                    priority: 0, // Highest priority
                    supported_services: ['airtime', 'data'],
                    metadata: {
                        is_default: true,
                        description: 'Pre-configured IBData provider. No API key required - funded via VTFree wallet.',
                        features: [
                            'Auto-configured - no setup required',
                            'Funded via your VTFree wallet',
                            'Instant activation',
                            'Supports Airtime & Data'
                        ]
                    }
                });
                logger.info(`✅ Created default IBData provider for app: ${app_id}`);
            }
            // Ensure other providers have lower priority (higher number)
            const otherProviders = await ProviderConfig.find({
                app_id,
                code: { $ne: 'ibdata' },
                priority: { $lt: 10 }
            });
            for (const provider of otherProviders) {
                provider.priority = 10;
                await provider.save();
                logger.info(`Updated priority for provider: ${provider.code} in app: ${app_id}`);
            }
        }
        logger.info('✅ Default IBData provider setup completed for all apps');
        process.exit(0);
    }
    catch (error) {
        logger.error('Error setting up default IBData provider:', error);
        process.exit(1);
    }
};
setupDefaultIBDataProvider();
