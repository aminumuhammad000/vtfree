import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
async function syncAdmins() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        const { default: AppAdmin } = await import('../models/app_admin.model.js');
        const { default: VTfreeUser } = await import('../models/vtfree_user.model.js');
        const admins = await AppAdmin.find({});
        console.log(`Found ${admins.length} App Admins to check.`);
        let syncedCount = 0;
        let skippedCount = 0;
        for (const admin of admins) {
            const exists = await VTfreeUser.findOne({ email: admin.email });
            if (!exists) {
                console.log(`Syncing admin: ${admin.email}`);
                await VTfreeUser.create({
                    email: admin.email,
                    password: admin.password, // Preserve hash
                    first_name: 'App',
                    last_name: 'Admin',
                    phone_number: '00000000000',
                    status: admin.status,
                    email_verified: true,
                    created_at: admin.created_at
                });
                syncedCount++;
            }
            else {
                skippedCount++;
            }
        }
        console.log(`\n✅ Sync Complete!`);
        console.log(`Synced: ${syncedCount}`);
        console.log(`Skipped (Already Existed): ${skippedCount}`);
        await mongoose.disconnect();
        console.log('\n✅ Done!');
    }
    catch (error) {
        console.error('❌ Error syncing admins:', error);
    }
}
syncAdmins();
