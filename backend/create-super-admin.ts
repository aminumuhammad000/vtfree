import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import SuperAdmin from './src/models/super_admin.model.js';
import { config } from './src/config/bootstrap.js';

async function create() {
  await mongoose.connect(config.mongoUri);
  const existing = await SuperAdmin.findOne({ email: 'superadmin@vtuapp.com' });
  if (existing) {
    console.log('Super Admin already exists');
  } else {
    const password = await bcrypt.hash('SuperAdmin@123', 10);
    await SuperAdmin.create({
      email: 'superadmin@vtuapp.com',
      password,
      name: 'Super Admin',
      role: 'super_admin'
    });
    console.log('Super Admin created: superadmin@vtuapp.com / SuperAdmin@123');
  }
  await mongoose.disconnect();
}
create();
