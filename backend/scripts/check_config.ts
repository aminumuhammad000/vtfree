
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree';

async function checkConfig() {
    try {
        await mongoose.connect(MONGO_URI);
        const SystemConfig = mongoose.model('SystemConfig', new mongoose.Schema({}, { strict: false }), 'systemconfigs');

        const config = await SystemConfig.findOne({ key: 'KYC_AUTO_APPROVE' });
        if (config) {
            console.log('✅ KYC_AUTO_APPROVE found:', config.toObject());
        } else {
            console.log('❌ KYC_AUTO_APPROVE NOT found');
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkConfig();
