import mongoose from 'mongoose';

const SystemSettingSchema = new mongoose.Schema({
    integrations: {
        zainpay: {
            apiKey: String,
            secretKey: String,
            baseUrl: String,
            isLive: Boolean
        }
    }
});

const SystemSetting = mongoose.model('SystemSetting', SystemSettingSchema);

async function checkSettings() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vtpay');
        const settings = await SystemSetting.findOne({});
        console.log('Settings:', JSON.stringify(settings, null, 2));
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSettings();
