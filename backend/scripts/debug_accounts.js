import mongoose from 'mongoose';

async function check() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vtfree');

        const VirtualAccount = mongoose.model('VirtualAccount', new mongoose.Schema({}, { strict: false }));
        const AppAdmin = mongoose.model('AppAdmin', new mongoose.Schema({}, { strict: false }));
        const CreatedApp = mongoose.model('CreatedApp', new mongoose.Schema({}, { strict: false }));

        const apps = await CreatedApp.find({});
        console.log('Apps:', JSON.stringify(apps.map(a => ({ app_id: a.app_id, owner_id: a.owner_id })), null, 2));

        const admins = await AppAdmin.find({});
        console.log('Admins:', JSON.stringify(admins.map(a => ({ id: a._id, email: a.email, app_id: a.app_id })), null, 2));

        const accounts = await VirtualAccount.find({});
        console.log('Virtual Accounts:', JSON.stringify(accounts.map(a => ({
            id: a._id,
            accountNumber: a.accountNumber,
            user: a.user,
            generatedBy: a.generatedBy
        })), null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}
check();
