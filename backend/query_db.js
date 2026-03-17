import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/amee/Desktop/vtfree/backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const txns = await mongoose.connection.collection('transactions').find({}).sort({ created_at: -1 }).limit(10).toArray();
  console.log("Recent Transactions:", JSON.stringify(txns, null, 2));

  const stats = await mongoose.connection.collection('transactions').aggregate([
    { $group: { _id: { app_id: "$app_id", status: "$status", type: "$type" }, count: { $sum: 1 } } }
  ]).toArray();
  console.log("Stats:", JSON.stringify(stats, null, 2));
  
  process.exit(0);
}
run().catch(console.error);
