import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';

async function ensureAppData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        const email = 'admin@vtuapp.com';
        const appId = 'vtu_app_001';

        // 1. Ensure CreatedApp exists
        try {
            const { default: CreatedApp } = await import('../models/created_app.model.js');
            const { default: VTfreeUser } = await import('../models/vtfree_user.model.js'); // Assuming owner needs to be a VTfreeUser or similar
            // Actually, owner_id in CreatedApp refers to VTfreeUser. 
            // Let's check if we have a user to be the owner. 
            // If not, we might need to create one or use the super admin ID if compatible (though usually they are different collections).
            // For now, let's see if we can find a user or create a dummy one if needed.

            // Wait, the user is admin@vtuapp.com. Is this a VTfreeUser or just an AppAdmin?
            // Usually AppAdmin is for managing the created app. CreatedApp.owner_id refers to the platform user who created it.
            // Let's try to find a VTfreeUser with this email first.

            let owner = await VTfreeUser.findOne({ email });
            if (!owner) {
                console.log('VTfreeUser owner not found. Creating...');
                owner = await VTfreeUser.create({
                    email,
                    password: await bcrypt.hash('password123', 10),
                    first_name: 'Admin',
                    last_name: 'User',
                    phone_number: '08000000000',
                    status: 'active'
                });
                console.log('✅ VTfreeUser owner created.');
            }

            let app = await CreatedApp.findOne({ app_id: appId });
            if (!app) {
                console.log('CreatedApp not found. Creating...');
                app = await CreatedApp.create({
                    app_id: appId,
                    owner_id: owner._id,
                    app_name: 'VTU App',
                    package_name: 'com.vtuapp.admin',
                    admin_email: email,
                    admin_password_hash: await bcrypt.hash('password123', 10),
                    status: 'live',
                    platforms: { web: true, android: false, ios: false }
                });
                console.log('✅ CreatedApp created successfully.');
            } else {
                console.log('✅ CreatedApp already exists.');
            }

            // 2. Ensure AppAdmin exists
            const { default: AppAdmin } = await import('../models/app_admin.model.js');
            let appAdmin = await AppAdmin.findOne({ email, app_id: appId });

            if (!appAdmin) {
                console.log('AppAdmin not found. Creating...');
                appAdmin = await AppAdmin.create({
                    app_id: appId,
                    email,
                    password: await bcrypt.hash('password123', 10),
                    role: 'owner',
                    status: 'active'
                });
                console.log('✅ AppAdmin created successfully.');
            } else {
                console.log('✅ AppAdmin already exists.');
            }

        } catch (e) {
            console.error('❌ Error handling App Data:', e);
        }

        await mongoose.disconnect();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error ensuring app data:', error);
        process.exit(1);
    }
}

ensureAppData();
