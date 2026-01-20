import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const MONGO_URI = 'mongodb://localhost:27017/vtfree';
const USER_EMAIL = 'uteach38@gmail.com';
const TARGET_BALANCE = 10000000;

async function fundOrCreate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        const VTfreeUser = mongoose.model('VTfreeUser', new mongoose.Schema({}, { strict: false }), 'vtfree_users');

        let user = await VTfreeUser.findOne({ email: USER_EMAIL });

        if (user) {
            console.log('👤 User found. Updating balance...');
            user.wallet_balance = (user.wallet_balance || 0) + TARGET_BALANCE;
            // OR set directly to 10m if requested "fund with", usually means "add".
            // "fund my wallet with 10 million" -> usually add.
            user.updated_at = new Date();
            await user.save(); // Assuming save works with loose schema on document
            // If strictly updating field:
            // await VTfreeUser.updateOne({ _id: user._id }, { $set: { wallet_balance: user.wallet_balance } });
            await VTfreeUser.updateOne({ _id: user._id }, { $inc: { wallet_balance: TARGET_BALANCE } });
            console.log('💰 Added 10,000,000 to wallet.');

            // Re-fetch to show total
            const updated = await VTfreeUser.findOne({ _id: user._id });
            console.log('💵 New Balance:', updated.wallet_balance);
        } else {
            console.log('wm New user required. Creating...');
            const password = 'password123';
            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(password, salt);

            await VTfreeUser.create({
                email: USER_EMAIL,
                password: hashedPassword,
                first_name: 'Uteach',
                last_name: 'User',
                phone_number: '08000000000',
                status: 'active',
                email_verified: true,
                wallet_balance: TARGET_BALANCE,
                created_at: new Date(),
                updated_at: new Date()
            });
            console.log('✅ User created with 10,000,000 balance.');
            console.log('📧 Email:', USER_EMAIL);
            console.log('🔑 Password:', password);
        }

        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
}

fundOrCreate();
