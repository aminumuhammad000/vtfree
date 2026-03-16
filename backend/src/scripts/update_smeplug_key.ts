
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProviderConfig from '../models/provider.model.js';

dotenv.config();

const updateSmePlugKey = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const apiKey = '1cd33dd92b23effdc15625e371d4722e04ccb6e16794d64a108b4b208ea11ca5';
        
        const result = await ProviderConfig.updateMany(
            { code: 'smeplug' },
            { 
                $set: { 
                    api_key: apiKey,
                    'metadata.env.SMEPLUG_API_KEY': apiKey,
                    active: true,
                    priority: 1
                } 
            }
        );
        console.log(`Updated ${result.modifiedCount} SME Plug providers with new API key and set as default.`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updateSmePlugKey();
