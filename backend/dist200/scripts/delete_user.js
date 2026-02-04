import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VTfreeUser from '../models/vtfree_user.model.js';
dotenv.config();
const deleteUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        const email = 'uteach38@gmail.com'; // target email
        const result = await VTfreeUser.deleteOne({ email });
        if (result.deletedCount === 1) {
            console.log(`Successfully deleted user: ${email}`);
        }
        else {
            console.log(`User not found: ${email}`);
        }
        await mongoose.disconnect();
    }
    catch (error) {
        console.error('Error:', error);
    }
};
deleteUser();
