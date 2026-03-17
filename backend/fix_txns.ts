
import mongoose from 'mongoose';
import { Transaction, User } from './src/models/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixTransactions() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');
        console.log('Connected to MongoDB');

        const transactions = await Transaction.find({ 
            $or: [
                { app_id: { $exists: false } },
                { app_id: null },
                { app_id: '' }
            ]
        });

        console.log(`Found ${transactions.length} transactions without app_id`);

        let fixedCount = 0;
        for (const txn of transactions) {
            const user = await User.findById(txn.user_id);
            if (user && user.app_id) {
                txn.app_id = user.app_id;
                await txn.save();
                fixedCount++;
            }
        }

        console.log(`Successfully fixed ${fixedCount} transactions.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixTransactions();
