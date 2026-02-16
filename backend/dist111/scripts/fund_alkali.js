import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();
const fundUser = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('MONGO_URI is not defined in environment variables');
            process.exit(1);
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        const email = 'alkali@gmail.com';
        const amount = 4500000;
        const user = await VTfreeUser.findOne({ email });
        if (!user) {
            console.error(`User with email ${email} not found`);
            // List all users to verify
            const allUsers = await VTfreeUser.find({}, 'email');
            console.log('Available users:', allUsers.map(u => u.email));
            process.exit(1);
        }
        console.log(`Current balance for ${email}: ${user.wallet_balance}`);
        user.wallet_balance = (user.wallet_balance || 0) + amount;
        await user.save();
        console.log(`New balance for ${email}: ${user.wallet_balance}`);
        // Record the transaction for audit
        await VTfreeTransaction.create({
            user_id: user._id,
            type: 'credit',
            amount: amount,
            reference: `MANUAL-FUND-${uuidv4()}`,
            description: 'Manual wallet funding by System Admin',
            status: 'success',
            metadata: { method: 'manual_script' }
        });
        console.log('Transaction recorded.');
    }
    catch (error) {
        console.error('Error funding user:', error);
    }
    finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};
fundUser();
