import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/amee/Desktop/vtfree/backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await mongoose.connection.collection('users').find().toArray();
  const distinctAppIds = await mongoose.connection.collection('users').distinct('app_id');
  console.log("Distinct App IDs in users:", distinctAppIds);
  console.log("Sample user:", users[0]);
  process.exit(0);
}
run().catch(console.error);
