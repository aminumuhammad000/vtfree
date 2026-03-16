
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProviderConfig from './src/models/provider.model.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');
        const providers = await ProviderConfig.find({ code: { $in: ['vtstack', 'smeplug', 'topupmate'] } });
        console.log(JSON.stringify(providers, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
