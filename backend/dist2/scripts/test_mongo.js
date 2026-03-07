import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load env explicitly
const envPath = path.resolve(__dirname, '../../.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });
const testConnection = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree';
        console.log(`Trying to connect to: ${uri}`);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }); // 5s timeout
        console.log('✅ Connected to MongoDB');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        await mongoose.disconnect();
        console.log('✅ Disconnected');
    }
    catch (error) {
        console.error('❌ Connection Error:', error);
    }
};
testConnection();
