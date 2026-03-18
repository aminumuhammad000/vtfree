import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { Wallet } from '../models/wallet.model.js';
import { Transaction } from '../models/transaction.model.js';
import { Notification } from '../models/notification.model.js';
import { SupportTicket } from '../models/support_ticket.model.js';
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vtfree';
const DEFAULT_APP_ID = 'default_app';
async function migrate() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to database.');
        console.log(`Starting migration to add app_id: '${DEFAULT_APP_ID}' to existing records...`);
        // 1. Users
        const userResult = await User.updateMany({ app_id: { $exists: false } }, { $set: { app_id: DEFAULT_APP_ID } });
        console.log(`Updated ${userResult.modifiedCount} users.`);
        // 2. Wallets
        const walletResult = await Wallet.updateMany({ app_id: { $exists: false } }, { $set: { app_id: DEFAULT_APP_ID } });
        console.log(`Updated ${walletResult.modifiedCount} wallets.`);
        // 3. Transactions
        const txnResult = await Transaction.updateMany({ app_id: { $exists: false } }, { $set: { app_id: DEFAULT_APP_ID } });
        console.log(`Updated ${txnResult.modifiedCount} transactions.`);
        // 4. Notifications
        const notifResult = await Notification.updateMany({ app_id: { $exists: false } }, { $set: { app_id: DEFAULT_APP_ID } });
        console.log(`Updated ${notifResult.modifiedCount} notifications.`);
        // 5. Support Tickets
        const ticketResult = await SupportTicket.updateMany({ app_id: { $exists: false } }, { $set: { app_id: DEFAULT_APP_ID } });
        console.log(`Updated ${ticketResult.modifiedCount} support tickets.`);
        console.log('Migration completed successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
migrate();
