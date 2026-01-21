import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/vtfree';
const USER_EMAIL = 'uteach38@gmail.com';
const TARGET_BALANCE = 10000000;

async function fundCorrect() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        // Use the default collection: vtfreeusers (no underscore)
        const VTfreeUser = mongoose.model('VTfreeUser', new mongoose.Schema({}, { strict: false }), 'vtfreeusers');

        const user = await VTfreeUser.findOne({ email: USER_EMAIL });

        if (user) {
            console.log(`👤 User found in vtfreeusers. Balance: ${user.wallet_balance}`);
            console.log('💰 Updating balance to 10,000,000...');

            // user.wallet_balance = (user.wallet_balance || 0) + TARGET_BALANCE;
            // Since previous funding failed to show, user probably wants 10m total, or 10m added?
            // "fund my wallet with 10 million" -> usually means ADD.
            // But balance is 0 now. So adding 10m = 10m.

            await VTfreeUser.updateOne({ _id: user._id }, { $set: { wallet_balance: TARGET_BALANCE } });

            console.log('✅ Balance updated successfully.');
        } else {
            console.log('❌ User NOT found in vtfreeusers (unexpected, as check script found it).');
        }

        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
}

fundCorrect();
