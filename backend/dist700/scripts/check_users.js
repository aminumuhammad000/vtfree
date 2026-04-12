import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VTfreeUser from '../models/vtfree_user.model.js';
dotenv.config();
const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        const users = await VTfreeUser.find({});
        console.log('VTfree Users:', JSON.stringify(users, null, 2));
        await mongoose.disconnect();
    }
    catch (error) {
        console.error('Error:', error);
    }
};
checkUsers();
