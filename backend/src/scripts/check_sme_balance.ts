
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import smeplugService from '../services/smeplug.service.js';

dotenv.config();

const checkBalance = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree';
        await mongoose.connect(uri);
        
        const balance = await smeplugService.getWalletBalance();
        console.log('SMEPlug Balance:', JSON.stringify(balance, null, 2));

        const networks = await smeplugService.getNetworks();
        console.log('SMEPlug Networks:', JSON.stringify(networks, null, 2));

        await mongoose.disconnect();
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
        process.exit(1);
    }
};

checkBalance();
