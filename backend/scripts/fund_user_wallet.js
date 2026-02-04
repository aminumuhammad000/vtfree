import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/vtfree';
const USER_EMAIL = 'uteach38@gmail.com';
const AMOUNT = 500000;

async function fundWallet() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
        const Wallet = mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }), 'wallets');

        const user = await User.findOne({ email: USER_EMAIL });
        if (!user) {
            console.error('❌ User not found:', USER_EMAIL);
            process.exit(1);
        }

        console.log('👤 Found user:', user.first_name, user.last_name);

        let wallet = await Wallet.findOne({ user_id: user._id });

        if (!wallet) {
            console.log('📝 Creating new wallet...');
            wallet = await Wallet.create({
                user_id: user._id,
                balance: AMOUNT,
                created_at: new Date(),
                updated_at: new Date()
            });
        } else {
            console.log('💰 Current balance:', wallet.balance);
            wallet.balance = (wallet.balance || 0) + AMOUNT;
            wallet.updated_at = new Date();
            await wallet.save();
        }

        console.log('✅ Wallet funded successfully!');
        console.log('💵 New balance:', wallet.balance);

        await mongoose.connection.close();
        console.log('👋 Connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fundWallet();
