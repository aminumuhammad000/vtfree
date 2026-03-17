import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/amee/Desktop/vtfree/backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const distinctTransactionAppIds = await mongoose.connection.collection('transactions').distinct('app_id');
  const distinctAuditAppIds = await mongoose.connection.collection('auditlogs').distinct('app_id');
  
  console.log("Distinct App IDs in transactions:", distinctTransactionAppIds);
  console.log("Distinct App IDs in auditlogs:", distinctAuditAppIds);

  const testUser = await mongoose.connection.collection('users').findOne({ phone_number: '07070249434' });
  console.log("Test User App ID:", testUser?.app_id);

  process.exit(0);
}
run().catch(console.error);
