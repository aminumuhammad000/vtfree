import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = 'mongodb://localhost:27017/vtfree';

async function createUserAndFundWallet() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Create user
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
        const Wallet = mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }), 'wallets');

        const password_hash = await bcrypt.hash('Test123456', 10);
        const referral_code = Math.random().toString(36).substring(2, 10).toUpperCase();

        const user = await User.create({
            email: 'uteach38@gmail.com',
            phone_number: '08012345678',
            password_hash,
            first_name: 'Test',
            last_name: 'User',
            referral_code,
            country: 'Nigeria',
            kyc_status: 'pending',
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log('✅ User created:', user.email);

        // Create wallet with 500k
        const wallet = await Wallet.create({
            user_id: user._id,
            balance: 500000,
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log('✅ Wallet created and funded with ₦500,000');
        console.log('💵 Balance:', wallet.balance);
        console.log('');
        console.log('🎉 SUCCESS! You can now log in with:');
        console.log('📧 Email:', user.email);
        console.log('🔑 Password: Test123456');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createUserAndFundWallet();
