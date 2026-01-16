import mongoose from 'mongoose';

async function check() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vtpay');
        const SystemSetting = mongoose.model('SystemSetting', new mongoose.Schema({}, { strict: false }));
        const settings = await SystemSetting.findOne({});
        console.log('Settings:', JSON.stringify(settings, null, 2));
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}
check();
