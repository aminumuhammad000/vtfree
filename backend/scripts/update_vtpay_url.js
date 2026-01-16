import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const SystemConfigSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true }
});

const SystemConfig = mongoose.model('SystemConfig', SystemConfigSchema);

async function updateConfig() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');
        const result = await SystemConfig.findOneAndUpdate(
            { key: 'VTPAY_BASE_URL' },
            { value: 'http://localhost:3000/api' },
            { upsert: true, new: true }
        );
        console.log('Updated Config:', result);
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

updateConfig();
