import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/amee/Desktop/vtfree/backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const transactions = await mongoose.connection.collection('transactions').find({ app_id: { $exists: false } }).toArray();
  let count = 0;
  for (const txn of transactions) {
    if (txn.user_id) {
       const user = await mongoose.connection.collection('users').findOne({ _id: txn.user_id });
       if (user && user.app_id) {
         await mongoose.connection.collection('transactions').updateOne(
           { _id: txn._id },
           { $set: { app_id: user.app_id } }
         );
         count++;
       }
    }
  }
  console.log(`Patched ${count} transactions with app_id.`);
  process.exit(0);
}
run().catch(console.error);
