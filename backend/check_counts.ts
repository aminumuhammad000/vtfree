import mongoose from 'mongoose';
import { config } from './src/config/bootstrap.js';
import { User } from './src/models/user.model.js';
import { Transaction } from './src/models/transaction.model.js';

async function checkCounts() {
    await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/vtfree');
    const app_id = 'vtu_app_001';

    const userCount = await User.countDocuments({ app_id });
    const txnCount = await Transaction.countDocuments({ app_id });

    console.log(`App ID: ${app_id}`);
    console.log(`User Count: ${userCount}`);
    console.log(`Transaction Count: ${txnCount}`);

    const dataSales = await Transaction.aggregate([
        { $match: { app_id, type: 'data_purchase', status: 'successful' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    console.log(`Data Sales: ${JSON.stringify(dataSales)}`);

    await mongoose.disconnect();
}

checkCounts();
