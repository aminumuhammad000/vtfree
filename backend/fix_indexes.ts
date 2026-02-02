import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('providerconfigs');

        // Try to drop the problematic index
        try {
            await collection.dropIndex('code_1');
            console.log('✅ Successfully dropped index: code_1');
        } catch (e: any) {
            console.log('ℹ️ Index code_1 does not exist or already dropped:', e.message);
        }

        // Ensure the compound unique index exists
        try {
            await collection.createIndex({ app_id: 1, code: 1 }, { unique: true });
            console.log('✅ Ensured unique compound index (app_id, code) exists');
        } catch (e: any) {
            console.log('ℹ️ Compound index creation note:', e.message);
        }

        const indexes = await collection.indexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

        await mongoose.disconnect();
        console.log('Disconnected');
    } catch (error) {
        console.error('Error fixing indexes:', error);
    }
}

fix();
