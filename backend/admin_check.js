import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/amee/Desktop/vtfree/backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const admins = await mongoose.connection.collection('app_admins').find().toArray();
  console.log("App Admins:", JSON.stringify(admins, null, 2));
  
  const auditLogs = await mongoose.connection.collection('auditlogs').find().toArray();
  console.log("Audit Logs count:", auditLogs.length);
  process.exit(0);
}
run().catch(console.error);
