import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/bootstrap.js';
import AppAdmin from '../models/app_admin.model.js';
import CreatedApp from '../models/created_app.model.js';
/**
 * Get login details for testing
 * Creates a test admin if none exists
 */
async function getLoginDetails() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB\n');
        // Check for existing admins
        const admins = await AppAdmin.find({}).sort({ created_at: -1 }).limit(3);
        if (admins.length === 0) {
            console.log('⚠️  No admin accounts found. Creating a test admin...\n');
            // Check if we have any apps
            let app = await CreatedApp.findOne({});
            if (!app) {
                console.log('⚠️  No apps found. Creating a test app first...\n');
                // Create a test app
                app = await CreatedApp.create({
                    app_id: 'vtu_app_001',
                    owner_id: new mongoose.Types.ObjectId(),
                    app_name: 'Test VTU App',
                    package_name: 'com.test.vtuapp',
                    platforms: {
                        android: true,
                        ios: false,
                        web: true,
                    },
                    branding: {
                        primary_color: '#16a34a',
                        secondary_color: '#22c55e',
                    },
                    status: 'live',
                    build_status: {
                        android: 'completed',
                        ios: 'not_started',
                        web: 'completed',
                    },
                    payment_status: 'paid',
                    total_paid: 150000,
                    admin_email: 'admin@testvtuapp.com',
                    admin_password_hash: await bcrypt.hash('admin123', 10),
                });
                console.log(`✅ Created test app: ${app.app_name} (${app.app_id})\n`);
            }
            // Create a test admin
            const testPassword = 'Admin@123';
            const testAdmin = await AppAdmin.create({
                app_id: app.app_id,
                email: 'admin@testvtuapp.com',
                password: await bcrypt.hash(testPassword, 10),
                role: 'owner',
                permissions: ['all'],
                status: 'active',
                created_by: 'system',
            });
            console.log('✅ Created test admin account!\n');
            admins.push(testAdmin);
        }
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║              🔐 ADMIN LOGIN CREDENTIALS 🔐                  ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        for (let i = 0; i < Math.min(admins.length, 3); i++) {
            const admin = admins[i];
            const app = await CreatedApp.findOne({ app_id: admin.app_id });
            console.log(`\n📋 ADMIN #${i + 1}`);
            console.log('─'.repeat(64));
            console.log(`App Name:     ${app?.app_name || 'Unknown'}`);
            console.log(`App ID:       ${admin.app_id}`);
            console.log(`Email:        ${admin.email}`);
            console.log(`Role:         ${admin.role}`);
            console.log(`Status:       ${admin.status}`);
            // Try to provide password hint
            console.log('\n🔑 LOGIN CREDENTIALS:');
            console.log(`  App ID:     ${admin.app_id}`);
            console.log(`  Email:      ${admin.email}`);
            // If this is the test admin we just created
            if (admin.email === 'admin@testvtuapp.com' && admin.app_id === 'vtu_app_001') {
                console.log(`  Password:   Admin@123`);
            }
            else {
                console.log(`  Password:   [Check your seed/init scripts or environment]`);
                console.log(`              Common defaults: admin123, Admin@123, password`);
            }
            console.log('─'.repeat(64));
        }
        console.log('\n\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                 📡 API TEST EXAMPLE                         ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        const testAdmin = admins[0];
        console.log('POST http://localhost:5000/api/app-admin/login');
        console.log('Content-Type: application/json\n');
        console.log(JSON.stringify({
            app_id: testAdmin.app_id,
            email: testAdmin.email,
            password: testAdmin.email === 'admin@testvtuapp.com' ? 'Admin@123' : '[your-password]'
        }, null, 2));
        console.log('\n\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                 🧪 CURL TEST EXAMPLE                        ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        console.log('curl -X POST http://localhost:5000/api/app-admin/login \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'' + JSON.stringify({
            app_id: testAdmin.app_id,
            email: testAdmin.email,
            password: testAdmin.email === 'admin@testvtuapp.com' ? 'Admin@123' : '[your-password]'
        }) + '\'');
        console.log('\n\n💡 TIP: If you need to reset a password, use:');
        console.log('   npx tsx src/scripts/reset_app_admin_password.ts\n');
    }
    catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
    finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB\n');
    }
}
getLoginDetails();
