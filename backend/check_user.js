import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/vtfree';
const USER_EMAIL = 'uteach38@gmail.com';

async function checkUser() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        const VTfreeUser = mongoose.model('VTfreeUser', new mongoose.Schema({}, { strict: false }), 'vtfree_users');
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

        const vtUser = await VTfreeUser.findOne({ email: USER_EMAIL });
        const legacyUser = await User.findOne({ email: USER_EMAIL });

        if (vtUser) console.log('Found in vtfreeusers:', vtUser._id);
        if (legacyUser) console.log('Found in users:', legacyUser._id);

        if (!vtUser && !legacyUser) console.log('User not found in either collection');

        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
}

checkUser();
