import mongoose from 'mongoose';

async function check() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vtfree');
        const AppAdmin = mongoose.model('AppAdmin', new mongoose.Schema({}, { strict: false }));
        const admins = await AppAdmin.find({}, 'email last_login');
        console.log(JSON.stringify(admins, null, 2));
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}
check();
