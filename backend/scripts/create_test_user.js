// Use the EXACT same setup as the backend registration
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const MONGO_URI = 'mongodb://localhost:27017/vtfree';

async function createUser() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    // Use exact same schema structure as backend
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const Wallet = mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }), 'wallets');

    const password = 'password123';
    const password_hash = await bcryptjs.hash(password, 10);

    console.log('Password:', password);
    console.log('Hash:', password_hash);

    // Verify the hash works
    const verified = await bcryptjs.compare(password, password_hash);
    console.log('Hash verified:', verified);

    const user = await User.create({
        email: 'test@vtfree.com',
        phone_number: '08099999999',
        password_hash,
        first_name: 'Test',
        last_name: 'User',
        referral_code: 'TEST123',
        country: 'Nigeria',
        kyc_status: 'pending',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
    });

    await Wallet.create({
        user_id: user._id,
        balance: 500000,
        created_at: new Date(),
        updated_at: new Date()
    });

    console.log('\n✅ User created: test@vtfree.com');
    console.log('🔑 Password: password123');
    console.log('💰 Balance: ₦500,000');

    await mongoose.connection.close();
    process.exit(0);
}

createUser().catch(console.error);
