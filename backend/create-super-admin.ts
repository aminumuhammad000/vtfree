import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import SuperAdmin from './src/models/super_admin.model.js';
import { config } from './src/config/bootstrap.js';

async function create() {
  try {
    await mongoose.connect(config.mongoUri);
    const email = 'superadmin@vtfree.com';
    const existing = await SuperAdmin.findOne({ email });

    if (existing) {
      console.log(`Super Admin ${email} already exists. Updating password...`);
      const password = await bcrypt.hash('Admin@123456', 10);
      existing.password = password;
      await existing.save();
      console.log('Password updated successfully.');
    } else {
      const password = await bcrypt.hash('Admin@123456', 10);
      await SuperAdmin.create({
        email,
        password,
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin',
        status: 'active',
        permissions: ['all']
      });
      console.log(`Super Admin created: ${email} / Admin@123456`);
    }
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

create();
