import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { OTP } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const getLatestOTP = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree';
        await mongoose.connect(uri);

        const otp = await OTP.findOne().sort({ created_at: -1 });

        if (otp) {
            console.log('Latest OTP Details:');
            console.log('Code:', otp.otp_code);
            console.log('Email:', otp.email);
            console.log('Phone:', otp.phone_number);
            console.log('Created At:', otp.created_at);
        } else {
            console.log('No OTP found.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error fetching OTP:', error);
        process.exit(1);
    }
};

getLatestOTP();
