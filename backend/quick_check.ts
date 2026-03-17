
import mongoose from 'mongoose';

async function quickCheck() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vtfree');
        const db = mongoose.connection.db;
        
        console.log('App IDs in Transactions:');
        const txns = await db.collection('transactions').aggregate([
            { $group: { _id: "$app_id", count: { $sum: 1 } } }
        ]).toArray();
        console.log(JSON.stringify(txns, null, 2));

        console.log('App IDs in CreatedApps:');
        const apps = await db.collection('createdapps').find({}, { projection: { app_id: 1, app_name: 1 } }).toArray();
        console.log(JSON.stringify(apps, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

quickCheck();
