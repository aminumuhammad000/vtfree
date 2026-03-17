
import mongoose from 'mongoose';

async function listAppIds() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vtfree');
        const db = mongoose.connection.db;
        
        const counts = await db.collection('transactions').aggregate([
            { $group: { _id: "$app_id", count: { $sum: 1 } } }
        ]).toArray();
        
        console.log('TRANS_COUNTS:', JSON.stringify(counts));

        const apps = await db.collection('createdapps').find({}, { projection: { app_id: 1, package_name: 1 } }).toArray();
        console.log('APPS:', JSON.stringify(apps));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAppIds();
