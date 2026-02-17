import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
async function verifyData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        const appId = 'vtu_app_001';
        console.log(`\n🔍 Checking data for App ID: ${appId}`);
        // Check Users
        const { User } = await import('../models/user.model.js');
        const userCount = await User.countDocuments({ app_id: appId });
        console.log(`Users found: ${userCount}`);
        // Check Transactions
        const { Transaction } = await import('../models/transaction.model.js');
        const txCount = await Transaction.countDocuments({ app_id: appId });
        console.log(`Transactions found: ${txCount}`);
        // Check for potential orphaned data (missing app_id)
        console.log('\n🔍 Checking for orphaned data (missing app_id)...');
        const orphanedUsers = await User.countDocuments({ app_id: { $exists: false } });
        console.log(`Users without app_id: ${orphanedUsers}`);
        const orphanedTx = await Transaction.countDocuments({ app_id: { $exists: false } });
        console.log(`Transactions without app_id: ${orphanedTx}`);
        // Check for data with empty string app_id
        const emptyAppIdUsers = await User.countDocuments({ app_id: '' });
        console.log(`Users with empty app_id: ${emptyAppIdUsers}`);
        await mongoose.disconnect();
        console.log('\n✅ Done!');
    }
    catch (error) {
        console.error('❌ Error verifying data:', error);
    }
}
verifyData();
