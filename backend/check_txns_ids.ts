
import mongoose from 'mongoose';
import { Transaction, CreatedApp } from './src/models/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkTransactions() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const apps = await CreatedApp.find();
        const appIdsInDB = apps.map(a => a.app_id);
        console.log('App IDs in CreatedApp:', appIdsInDB);

        const allAppIdsInTxns = await Transaction.distinct('app_id');
        console.log('Distinct app_id in Transactions:', allAppIdsInTxns);

        for (const appId of allAppIdsInTxns) {
            const count = await Transaction.countDocuments({ app_id: appId });
            console.log(`app_id: "${appId}", count: ${count}`);
        }

        const total = await Transaction.countDocuments();
        console.log('Total Transactions:', total);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTransactions();
