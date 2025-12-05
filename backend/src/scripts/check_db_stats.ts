import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VTfreeUser from '../models/vtfree_user.model.js';
import { Transaction } from '../models/transaction.model.js';
import PlatformTransaction from '../models/platform_transaction.model.js';
import { User } from '../models/user.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/connecta_vtu';

async function checkStats() {
    try {
        console.log(`Connecting to ${MONGODB_URI}...`);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to database.');

        const total_users = await VTfreeUser.countDocuments();
        const total_transactions = await Transaction.countDocuments();
        const active_users = await User.countDocuments();
        const revenueResult = await PlatformTransaction.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        console.log('--- DB Stats ---');
        console.log(`Total VTfree Users: ${total_users}`);
        console.log(`Total Transactions: ${total_transactions}`);
        console.log(`Active Users: ${active_users}`);
        console.log(`Revenue: ${revenue}`);
        console.log('----------------');

        process.exit(0);
    } catch (error) {
        console.error('Error checking stats:', error);
        process.exit(1);
    }
}

checkStats();
