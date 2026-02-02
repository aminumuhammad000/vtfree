
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree';

async function checkUser() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

        const email = 'aminumuhammad00015@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('✅ User found in vtfree:', user.toObject());
        } else {
            console.log('❌ User NOT found in vtfree');
        }

        // Also check connecta_vtu
        try {
            const alternateUri = 'mongodb://127.0.0.1:27017/connecta_vtu';
            const conn2 = await mongoose.createConnection(alternateUri).asPromise();
            const User2 = conn2.model('User', new mongoose.Schema({}, { strict: false }), 'users');
            const user2 = await User2.findOne({ email });
            if (user2) {
                console.log('✅ User found in connecta_vtu:', user2.toObject());
            } else {
                console.log('❌ User NOT found in connecta_vtu');
            }
            await conn2.close();
        } catch (e) {
            console.log('Could not connect to connecta_vtu');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkUser();
