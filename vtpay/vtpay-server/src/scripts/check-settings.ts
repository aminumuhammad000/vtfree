import mongoose from 'mongoose';
import { SystemSetting } from '../models/SystemSetting';
import config from '../config';

async function checkSettings() {
    try {
        await mongoose.connect(config.mongodbUri);
        const settings = await SystemSetting.findOne();
        console.log('System Settings:', JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkSettings();
