import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/vtfree';
const USER_EMAIL = 'uteach38@gmail.com';

async function checkCollections() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        // Distribution 1: Default Mongoose logic
        const ModelDefault = mongoose.model('VTfreeUser_Default', new mongoose.Schema({}, { strict: false }), 'vtfreeusers');

        // Distribution 2: Underscore version
        const ModelUnderscore = mongoose.model('VTfreeUser_Underscore', new mongoose.Schema({}, { strict: false }), 'vtfree_users');

        const userDefault = await ModelDefault.findOne({ email: USER_EMAIL });
        const userUnderscore = await ModelUnderscore.findOne({ email: USER_EMAIL });

        console.log('--- Collection Check ---');
        console.log(`[vtfreeusers] (Default): ${userDefault ? 'FOUND' : 'NOT FOUND'}`);
        if (userDefault) console.log(`   Balance: ${userDefault.wallet_balance}`);

        console.log(`[vtfree_users] (Underscore): ${userUnderscore ? 'FOUND' : 'NOT FOUND'}`);
        if (userUnderscore) console.log(`   Balance: ${userUnderscore.wallet_balance}`);

        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
}

checkCollections();
