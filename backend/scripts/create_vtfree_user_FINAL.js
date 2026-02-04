import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const MONGO_URI = 'mongodb://localhost:27017/vtfree';

async function createVTfreeUser() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    // Use the CORRECT collection: vtfree_users
    const VTfreeUser = mongoose.model('VTfreeUser', new mongoose.Schema({}, { strict: false }), 'vtfree_users');

    const password = 'password123';
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    console.log('Password:', password);
    console.log('Hash:', hashedPassword);

    const user = await VTfreeUser.create({
        email: 'uteach38@gmail.com',
        password: hashedPassword,  // Note: field name is 'password', not 'password_hash'
        first_name: 'Test',
        last_name: 'User',
        phone_number: '08012345678',
        status: 'active',
        email_verified: false,
        wallet_balance: 500000,  // Directly on user object!
        created_at: new Date(),
        updated_at: new Date()
    });

    console.log('\n✅ VTfree User created successfully!');
    console.log('📧 Email: uteach38@gmail.com');
    console.log('🔑 Password: password123');
    console.log('💰 Wallet Balance: ₦500,000');
    console.log('\n🎉 You can now login in the mobile app!');

    await mongoose.connection.close();
    process.exit(0);
}

createVTfreeUser().catch(console.error);
