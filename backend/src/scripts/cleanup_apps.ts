import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// The models will be imported as default and from correct paths
// We use dynamic imports for now to avoid potential TS path issues if any,
// but standard relative paths should work with npx tsx.

dotenv.config();

async function run() {
    try {
        console.log('Connecting to DB...');
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in .env');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Dynamically get the models to be safe with paths
        const CreatedApp = (await import('../models/created_app.model.js')).default;
        const AppAdmin = (await import('../models/app_admin.model.js')).default;
        const VTfreeUser = (await import('../models/vtfree_user.model.js')).default;

        // 1. Delete all old apps
        const oldApps = await CreatedApp.find();
        for (const app of oldApps) {
            console.log(`Deleting app: ${app.app_name} (${app.app_id})`);
            await AppAdmin.deleteMany({ app_id: app.app_id });
            await CreatedApp.deleteOne({ _id: app._id });
        }
        console.log('Deleted all old apps');

        // 2. Find an owner (VTfreeUser)
        const owner = await VTfreeUser.findOne();
        if (!owner) {
            console.log('No owner found in VTfreeUser. Creating a dummy owner...');
            // Create a dummy owner if none exists
            const dummyOwnerSalt = await bcrypt.genSalt(10);
            const dummyOwnerPassword = await bcrypt.hash('password123', dummyOwnerSalt);
            const dummyOwner = new VTfreeUser({
                email: 'owner@vtfree.com',
                password: dummyOwnerPassword,
                first_name: 'VTFree',
                last_name: 'Owner',
                phone_number: '08000000000',
                status: 'active',
                email_verified: true,
                wallet_balance: 1000000
            });
            await dummyOwner.save();
            console.log('Created dummy owner:', dummyOwner.email);
            return run(); // Re-run to find the owner
        }
        console.log(`Found owner: ${owner.email} (${owner._id})`);

        // 3. Create a new app 'dadsub'
        const package_name = 'dadsub';
        const app_id = package_name;
        const app_name = 'Dadsub';
        const admin_email = 'admin@dadsub.com';
        const admin_password = 'password123';

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(admin_password, salt);

        const newApp = new CreatedApp({
            app_id,
            owner_id: owner._id,
            app_name,
            package_name,
            admin_email,
            admin_password_hash: passwordHash, // Note: Schema might use 'admin_password' or 'admin_password_hash'. Checking model.
            status: 'live',
            platforms: { android: true, ios: false, web: false },
            version: '1.0.0',
            branding: {
                primary_color: '#3B82F6',
                secondary_color: '#1E40AF',
                panel_title: 'Dadsub Admin'
            }
        });

        await newApp.save();
        console.log(`Created new app: ${app_name} with ID: ${app_id}`);

        // Create the initial AppAdmin
        const newAdmin = new AppAdmin({
            app_id,
            email: admin_email.trim().toLowerCase(),
            password: passwordHash,
            role: 'owner',
            status: 'active',
            first_name: 'Dadsub',
            last_name: 'Admin'
        });
        await newAdmin.save();
        console.log(`Created admin for app: ${admin_email}`);

        console.log('DONE.');
        process.exit(0);
    } catch (error) {
        console.error('Error in script:', error);
        process.exit(1);
    }
}

run();
