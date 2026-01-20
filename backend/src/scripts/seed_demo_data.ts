import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import { User } from '../models/user.model.js';
import { Wallet } from '../models/wallet.model.js';
import { Transaction } from '../models/transaction.model.js';
import { AuditLog } from '../models/audit_log.model.js';
import Dispute from '../models/dispute.model.js';
import CreatedApp from '../models/created_app.model.js';
import AppAdmin from '../models/app_admin.model.js';

async function seedDemoData() {
    try {
        console.log('🔌 Connecting to MongoDB at:', config.mongoUri || 'mongodb://localhost:27017/vtfree');
        await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/vtfree');
        console.log('✅ Connected to MongoDB');

        const app_id = 'vtu_app_001';

        // 1. Ensure App exists
        let app = await CreatedApp.findOne({ app_id });
        if (!app) {
            console.log('Creating demo app...');
            app = await CreatedApp.create({
                app_id,
                app_name: 'Demo VTU App',
                owner_id: new mongoose.Types.ObjectId(),
                package_name: 'com.demo.vtu',
                status: 'active',
                branding: {
                    primary_color: '#16a34a',
                    secondary_color: '#22c55e'
                }
            });
        }

        // 2. Create Demo Users
        console.log('Creating demo users...');
        const usersData = [
            { first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone_number: '08011111111' },
            { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', phone_number: '08022222222' },
            { first_name: 'Alice', last_name: 'Johnson', email: 'alice@example.com', phone_number: '08033333333' },
            { first_name: 'Bob', last_name: 'Brown', email: 'bob@example.com', phone_number: '08044444444' },
            { first_name: 'Charlie', last_name: 'Davis', email: 'charlie@example.com', phone_number: '08055555555' },
        ];

        const hashedUserPassword = await bcrypt.hash('password123', 10);
        const createdUsers = [];

        for (const userData of usersData) {
            let user = await User.findOne({ email: userData.email });
            if (!user) {
                user = await User.create({
                    ...userData,
                    password_hash: hashedUserPassword,
                    referral_code: `REF-${userData.first_name.toUpperCase()}`,
                    app_id,
                    status: 'active'
                });
                console.log(`Created user: ${user.email}`);
            }
            createdUsers.push(user);

            // Ensure Wallet exists
            let wallet = await Wallet.findOne({ user_id: user._id });
            if (!wallet) {
                wallet = await Wallet.create({
                    user_id: user._id,
                    balance: Math.floor(Math.random() * 50000) + 5000,
                    currency: 'NGN'
                });
                console.log(`Created wallet for: ${user.email}`);
            }
        }

        // 3. Create Demo Transactions
        console.log('Creating demo transactions...');
        const transactionTypes = ['airtime_topup', 'data_purchase', 'bill_payment', 'wallet_topup'];
        const statuses = ['successful', 'successful', 'successful', 'failed', 'pending'];

        for (let i = 0; i < 30; i++) {
            const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
            const wallet = await Wallet.findOne({ user_id: user._id });
            const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const amount = Math.floor(Math.random() * 5000) + 100;

            const ref = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            await Transaction.create({
                user_id: user._id,
                wallet_id: wallet?._id,
                type,
                amount,
                total_charged: amount,
                status,
                reference_number: ref,
                description: `${type.replace('_', ' ')} for ${user.first_name}`,
                payment_method: 'wallet',
                app_id,
                created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Random date in last 7 days
            });
        }
        console.log('Created 30 demo transactions.');

        // 4. Create Demo Disputes
        console.log('Creating demo disputes...');
        const successfulTxns = await Transaction.find({ app_id, status: 'successful' }).limit(5);
        for (const txn of successfulTxns) {
            const existingDispute = await Dispute.findOne({ transaction_id: txn._id });
            if (!existingDispute) {
                await Dispute.create({
                    transaction_id: txn._id,
                    user_id: txn.user_id,
                    reason: 'Service not received despite successful payment',
                    status: Math.random() > 0.5 ? 'open' : 'resolved',
                    resolution_notes: Math.random() > 0.5 ? 'Refunded to wallet' : ''
                });
            }
        }

        // 5. Create Demo Audit Logs
        console.log('Creating demo audit logs...');
        const admin = await AppAdmin.findOne({ app_id });
        if (admin) {
            const actions = ['LOGIN', 'UPDATE_USER', 'CREDIT_WALLET', 'UPDATE_CONFIG'];
            for (let i = 0; i < 10; i++) {
                await AuditLog.create({
                    app_id,
                    admin_id: admin._id,
                    action: actions[Math.floor(Math.random() * actions.length)],
                    entity_type: 'SYSTEM',
                    ip_address: '127.0.0.1',
                    timestamp: new Date(Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000))
                });
            }
        }

        console.log('\n✅ Demo data seeding completed successfully!');
        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error seeding demo data:', err);
        process.exit(1);
    }
}

seedDemoData();
