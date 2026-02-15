import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const deleteAccounts = async () => {
    try {
        console.log('Script started...');
        const uri = 'mongodb://127.0.0.1:27017/vtfree';
        console.log(`Connecting to ${uri}...`);

        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // Check collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        const names = collections.map(c => c.name);
        console.log('Found collections:', names);

        // Delete from 'virtualaccounts'
        const collectionName = 'virtualaccounts';
        if (names.includes(collectionName)) {
            const result = await mongoose.connection.collection(collectionName).deleteMany({});
            console.log(`✅ Deleted ${result.deletedCount} documents from '${collectionName}'`);
        } else {
            console.log(`⚠️ Collection '${collectionName}' does not exist (no accounts to delete)`);
        }

        await mongoose.disconnect();
        console.log('✅ Disconnected');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

deleteAccounts();
