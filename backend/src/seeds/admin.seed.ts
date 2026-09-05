import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { AdminRole, AdminUser, SuperAdmin, SystemConfig } from '../models/index.js';

interface SeedAdminOptions {
  cleanOldSeeds?: boolean;
}

export const seedAdmin = async (options: SeedAdminOptions = {}) => {
  try {
    const adminEmail = (process.env.ADMIN_SEED_EMAIL || 'admin@vtstack.ng').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@123456';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Delete old/unwanted seeds if requested
    if (options.cleanOldSeeds) {
      const deletedConfigs = await SystemConfig.deleteMany({});
      if (deletedConfigs.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedConfigs.deletedCount} old system config seeds`);
      }
    }

    // 1. Seed or Update SuperAdmin
    let superAdmin = await SuperAdmin.findOne({
      email: { $regex: new RegExp(`^${adminEmail}$`, 'i') },
    });

    if (superAdmin) {
      superAdmin.password = hashedPassword;
      superAdmin.first_name = 'Admin';
      superAdmin.last_name = 'VTStack';
      superAdmin.role = 'super_admin';
      superAdmin.permissions = ['all'];
      superAdmin.status = 'active';
      superAdmin.updated_at = new Date();
      await superAdmin.save();
      console.log(`🔄 SuperAdmin updated successfully: ${superAdmin.email}`);
    } else {
      superAdmin = await SuperAdmin.create({
        email: adminEmail,
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'VTStack',
        role: 'super_admin',
        permissions: ['all'],
        status: 'active',
      });
      console.log(`🌱 SuperAdmin created successfully: ${superAdmin.email}`);
    }

    // 2. Ensure Super Admin Role exists
    let adminRole = await AdminRole.findOne({ name: 'Super Admin' });
    if (!adminRole) {
      adminRole = await AdminRole.create({
        name: 'Super Admin',
        description: 'Super Administrator with full privileges',
        permissions: ['all', '*'],
        status: 'active',
      });
      console.log(`🌱 AdminRole created: Super Admin`);
    }

    // 3. Seed or Update AdminUser (for dashboard)
    let adminUser = await AdminUser.findOne({
      email: { $regex: new RegExp(`^${adminEmail}$`, 'i') },
    });

    if (adminUser) {
      adminUser.password_hash = hashedPassword;
      adminUser.first_name = 'Admin';
      adminUser.last_name = 'VTStack';
      adminUser.role_id = adminRole._id as any;
      adminUser.status = 'active';
      adminUser.updated_at = new Date();
      await adminUser.save();
      console.log(`🔄 AdminUser updated successfully: ${adminUser.email}`);
    } else {
      adminUser = await AdminUser.create({
        email: adminEmail,
        password_hash: hashedPassword,
        first_name: 'Admin',
        last_name: 'VTStack',
        role_id: adminRole._id as any,
        status: 'active',
      });
      console.log(`🌱 AdminUser created successfully: ${adminUser.email}`);
    }

    console.log('✨ Admin seed completed successfully:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);

    return {
      success: true,
      superAdmin,
      adminUser,
    };
  } catch (error) {
    console.error('❌ Error during admin seed:', error);
    throw error;
  }
};

// If run directly via CLI (tsx src/seeds/admin.seed.ts)
const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const runDirectly = async () => {
    try {
      const { connectDB } = await import('../config/db.js');
      await connectDB();
      console.log('MongoDB connected for seeding...');
      await seedAdmin({ cleanOldSeeds: true });
      await mongoose.disconnect();
      console.log('MongoDB disconnected. Seed process finished.');
      process.exit(0);
    } catch (err) {
      console.error('Failed to run seed directly:', err);
      process.exit(1);
    }
  };
  runDirectly();
}
