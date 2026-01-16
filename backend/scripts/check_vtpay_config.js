import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const SystemConfigSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    group: { type: String, default: 'GENERAL' },
    description: { type: String }
}, { timestamps: true });

const SystemConfig = mongoose.model('SystemConfig', SystemConfigSchema);

async function checkConfig() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');
        const configs = await SystemConfig.find({ key: { $in: ['VTPAY_API_KEY', 'VTPAY_BASE_URL'] } });
        console.log('Configs:', JSON.stringify(configs, null, 2));
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkConfig();
