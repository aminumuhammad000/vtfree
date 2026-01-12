import mongoose from 'mongoose';
import { SystemSetting } from './src/models';
import { connectDatabase } from './src/config/database';

const checkSettings = async () => {
    try {
        await connectDatabase();
        const settings = await SystemSetting.findOne();
        console.log('System Settings:');
        console.log(JSON.stringify(settings, null, 2));
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkSettings();
