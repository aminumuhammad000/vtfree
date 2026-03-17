
import mongoose from 'mongoose';
import { Transaction, CreatedApp } from './src/models/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkTransactions() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree';
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const apps = await CreatedApp.find();
        console.log('Total Apps found in DB:', apps.length);
        
        if (apps.length === 0) {
            console.log('No apps found. Listing collections to verify DB state:');
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log(collections.map(c => c.name));
        }

        for (const app of apps) {
            const count = await Transaction.countDocuments({ app_id: app.app_id });
            console.log(`App: ${app.app_name} (${app.app_id}), Transactions: ${count}`);
            
            if (count > 0) {
                const sample = await Transaction.findOne({ app_id: app.app_id });
                console.log('Sample transaction for this app:', JSON.stringify(sample, null, 2));
            }
        }

        const orphanTransactionsCount = await Transaction.countDocuments({ 
            $or: [
                { app_id: { $exists: false } },
                { app_id: null },
                { app_id: '' }
            ]
        });
        console.log('Transactions missing app_id:', orphanTransactionsCount);
        
        if (orphanTransactionsCount > 0) {
            const sampleOrphan = await Transaction.findOne({ 
                $or: [
                    { app_id: { $exists: false } },
                    { app_id: null },
                    { app_id: '' }
                ]
            });
            console.log('Sample orphan transaction:', JSON.stringify(sampleOrphan, null, 2));
        }

        const totalTransactions = await Transaction.countDocuments();
        console.log('Total Transactions in DB:', totalTransactions);

        process.exit(0);
    } catch (err) {
        console.error('Error in script:', err);
        process.exit(1);
    }
}

checkTransactions();
