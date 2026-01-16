import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const MONGO_URI = 'mongodb://localhost:27017/vtfree';

async function updatePassword() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

        // Generate correct hash using bcryptjs (same as backend)
        const password_hash = await bcryptjs.hash('Test123456', 10);
        console.log('Generated hash:', password_hash);

        // Update user
        const result = await User.updateOne(
            { email: 'uteach38@gmail.com' },
            { $set: { password_hash } }
        );

        console.log('✅ Password updated!');
        console.log('Modified count:', result.modifiedCount);
        console.log('');
        console.log('You can now log in with:');
        console.log('📧 Email: uteach38@gmail.com');
        console.log('🔑 Password: Test123456');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updatePassword();
