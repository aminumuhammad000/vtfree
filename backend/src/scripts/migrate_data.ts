import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';

async function migrateData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        const appId = 'vtu_app_001';
        console.log(`\n📦 Migrating orphaned data to App ID: ${appId}`);

        // Migrate Users
        const { User } = await import('../models/user.model.js');
        const userResult = await User.updateMany(
            { app_id: { $exists: false } },
            { $set: { app_id: appId } }
        );
        console.log(`✅ Migrated ${userResult.modifiedCount} users.`);

        // Migrate Transactions
        const { Transaction } = await import('../models/transaction.model.js');
        const txResult = await Transaction.updateMany(
            { app_id: { $exists: false } },
            { $set: { app_id: appId } }
        );
        console.log(`✅ Migrated ${txResult.modifiedCount} transactions.`);

        await mongoose.disconnect();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error migrating data:', error);
    }
}

migrateData();
