import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
async function verifySuperAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log(`URI: ${config.mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');
        console.log('\n🔍 Checking for admin@vtuapp.com...');
        // Check AdminUser
        try {
            const { AdminUser } = await import('../models/admin_user.model.js');
            const adminUser = await AdminUser.findOne({ email: 'admin@vtuapp.com' });
            if (adminUser) {
                console.log('Found in AdminUser:');
                console.log(JSON.stringify(adminUser.toJSON(), null, 2));
            }
            else {
                console.log('Not found in AdminUser.');
            }
        }
        catch (e) {
            console.log('Error checking AdminUser:', e.message);
        }
        // Check SuperAdmin
        try {
            const { default: SuperAdmin } = await import('../models/super_admin.model.js');
            const superAdmin = await SuperAdmin.findOne({ email: 'admin@vtuapp.com' });
            if (superAdmin) {
                console.log('Found in SuperAdmin:');
                console.log(JSON.stringify(superAdmin.toJSON(), null, 2));
            }
            else {
                console.log('Not found in SuperAdmin.');
            }
        }
        catch (e) {
            console.log('Error checking SuperAdmin:', e.message);
        }
        await mongoose.disconnect();
        console.log('\n✅ Done!');
    }
    catch (error) {
        console.error('❌ Error verifying data:', error);
    }
}
verifySuperAdmin();
