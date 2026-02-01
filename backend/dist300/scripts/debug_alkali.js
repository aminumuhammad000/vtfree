import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
dotenv.config();
const debugUser = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        const email = 'alkali@gmail.com';
        const user = await VTfreeUser.findOne({ email });
        if (!user) {
            console.log(`User ${email} NOT FOUND in DB.`);
        }
        else {
            console.log(`User Found:`);
            console.log(`ID: ${user._id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Balance: ${user.wallet_balance}`);
            const txs = await VTfreeTransaction.find({ user_id: user._id });
            console.log(`Transactions found: ${txs.length}`);
            txs.forEach(tx => {
                console.log(` - ${tx.type} ${tx.amount} (${tx.status}) Ref: ${tx.reference}`);
            });
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};
debugUser();
