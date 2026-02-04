
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function resetAll() {
    const databases = ['vtfree', 'connecta_vtu'];
    const email = 'aminumuhammad00015@gmail.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    for (const db of databases) {
        try {
            const uri = `mongodb://127.0.0.1:27017/${db}`;
            const conn = await mongoose.createConnection(uri).asPromise();
            const User = conn.model('User', new mongoose.Schema({}, { strict: false }), 'users');

            const results = await User.find({ email });
            console.log(`Checking ${db}: found ${results.length} accounts`);

            for (const user of results) {
                user.set('password_hash', hashedPassword);
                user.set('status', 'active');
                await user.save();
                console.log(`  Updated user in ${db} (App ID: ${user.get('app_id')})`);
            }
            await conn.close();
        } catch (e) {
            console.log(`Failed to process ${db}:`, e.message);
        }
    }
    process.exit(0);
}

resetAll();
