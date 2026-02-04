import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');
    const collection = mongoose.connection.collection('providerconfigs');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));
    await mongoose.disconnect();
}
check();
