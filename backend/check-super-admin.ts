import mongoose from 'mongoose';
import SuperAdmin from './src/models/super_admin.model.js';
import { config } from './src/config/bootstrap.js';

async function check() {
  await mongoose.connect(config.mongoUri);
  const admin = await SuperAdmin.findOne({});
  console.log('Super Admin:', admin);
  await mongoose.disconnect();
}
check();
