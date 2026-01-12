import mongoose from 'mongoose';
import { User } from './src/models';
import { connectDatabase } from './src/config/database';

const listUsers = async () => {
    try {
        await connectDatabase();
        const users = await User.find({}, 'email status firstName lastName');
        console.log('Users in database:');
        console.log(JSON.stringify(users, null, 2));
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }
};

listUsers();
