import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
import AppAdmin from '../models/app_admin.model.js';
import CreatedApp from '../models/created_app.model.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import bcrypt from 'bcryptjs';

/**
 * Test Script: Verify Migration Setup and Functionality
 * 
 * This script:
 * 1. Creates test data
 * 2. Verifies migration can run
 * 3. Checks results
 * 4. Tests rollback
 * 5. Cleans up test data
 */

async function setupTestData() {
    console.log('📦 Setting up test data...\n');

    // Create a test VTfreeUser (app owner)
    const testOwner = await VTfreeUser.create({
        email: 'test.owner@example.com',
        password: await bcrypt.hash('password123', 10),
        first_name: 'Test',
        last_name: 'Owner',
        phone_number: '+1234567890',
        company_name: 'Test Company',
        status: 'active',
        email_verified: true,
    });

    console.log(`✅ Created test owner: ${testOwner.email}`);

    // Create a test app
    const testApp = await CreatedApp.create({
        app_id: 'old_test_app_001',
        owner_id: testOwner._id,
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

    console.log(`✅ Created test app: ${testApp.app_name} (${testApp.app_id})`);

    // Create test admins with different roles
    const testAdmins = [];

    // Owner admin
    const ownerAdmin = await AppAdmin.create({
        app_id: 'old_test_app_001',
        email: 'owner@testvtuapp.com',
        password: await bcrypt.hash('password123', 10),
        role: 'owner',
        permissions: ['all'],
        status: 'active',
        created_by: 'system',
    });
    testAdmins.push(ownerAdmin);
    console.log(`✅ Created owner admin: ${ownerAdmin.email}`);

    // Regular admin
    const regularAdmin = await AppAdmin.create({
        app_id: 'old_test_app_001',
        email: 'admin@testvtuapp.com',
        password: await bcrypt.hash('password123', 10),
        role: 'admin',
        permissions: ['users', 'transactions'],
        status: 'active',
        created_by: 'system',
    });
    testAdmins.push(regularAdmin);
    console.log(`✅ Created regular admin: ${regularAdmin.email}`);

    // Support admin
    const supportAdmin = await AppAdmin.create({
        app_id: 'old_test_app_001',
        email: 'support@testvtuapp.com',
        password: await bcrypt.hash('password123', 10),
        role: 'support',
        permissions: ['users.view', 'transactions.view'],
        status: 'active',
        created_by: 'system',
    });
    testAdmins.push(supportAdmin);
    console.log(`✅ Created support admin: ${supportAdmin.email}`);

    // Create an admin with new format (should be skipped)
    const newFormatAdmin = await AppAdmin.create({
        app_id: 'owner-john-doe-anotherapp-john-abc123',
        email: 'newformat@testvtuapp.com',
        password: await bcrypt.hash('password123', 10),
        role: 'owner',
        permissions: ['all'],
        status: 'active',
        created_by: 'system',
    });
    testAdmins.push(newFormatAdmin);
    console.log(`✅ Created new-format admin (should be skipped): ${newFormatAdmin.email}`);

    console.log(`\n📊 Test data created successfully!`);
    console.log(`   Owner: ${testOwner.email}`);
    console.log(`   App: ${testApp.app_name}`);
    console.log(`   Admins: ${testAdmins.length}`);

    return {
        owner: testOwner,
        app: testApp,
        admins: testAdmins,
    };
}

async function cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');

    await VTfreeUser.deleteMany({ email: /test\.owner@example\.com/ });
    await CreatedApp.deleteMany({ app_id: /old_test_app_/ });
    await AppAdmin.deleteMany({
        email: {
            $in: [
                'owner@testvtuapp.com',
                'admin@testvtuapp.com',
                'support@testvtuapp.com',
                'newformat@testvtuapp.com'
            ]
        }
    });

    // Clean up migration logs
    const LogModel = mongoose.model(
        'AdminAppIdMigrationLog',
        new mongoose.Schema({
            admin_id: String,
            old_app_id: String,
            new_app_id: String,
            email: String,
            role: String,
            status: String,
            timestamp: Date,
            error: String,
        }),
        'admin_appid_migration_logs'
    );

    await LogModel.deleteMany({
        email: {
            $in: [
                'owner@testvtuapp.com',
                'admin@testvtuapp.com',
                'support@testvtuapp.com',
                'newformat@testvtuapp.com'
            ]
        }
    });

    console.log('✅ Test data cleaned up');
}

async function verifyMigration() {
    console.log('\n🔍 Verifying migration results...\n');

    const admins = await AppAdmin.find({
        email: {
            $in: [
                'owner@testvtuapp.com',
                'admin@testvtuapp.com',
                'support@testvtuapp.com',
                'newformat@testvtuapp.com'
            ]
        }
    });

    let allValid = true;

    for (const admin of admins) {
        console.log(`\n📋 Admin: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   App ID: ${admin.app_id}`);

        // Check if it's the new-format admin (should be unchanged)
        if (admin.email === 'newformat@testvtuapp.com') {
            if (admin.app_id === 'owner-john-doe-anotherapp-john-abc123') {
                console.log('   ✅ Correctly skipped (already in new format)');
            } else {
                console.log('   ❌ ERROR: New-format admin was incorrectly modified!');
                allValid = false;
            }
            continue;
        }

        // Check if old format was migrated
        if (admin.app_id === 'old_test_app_001') {
            console.log('   ❌ ERROR: Still in old format!');
            allValid = false;
            continue;
        }

        // Verify new format structure
        const parts = admin.app_id.split('-');

        if (parts.length < 4) {
            console.log('   ❌ ERROR: New format has too few parts!');
            allValid = false;
            continue;
        }

        const role = parts[0];
        const validRoles = ['owner', 'admin', 'support'];

        if (!validRoles.includes(role)) {
            console.log(`   ❌ ERROR: Invalid role in app_id: ${role}`);
            allValid = false;
            continue;
        }

        if (role !== admin.role.toLowerCase()) {
            console.log(`   ❌ ERROR: Role mismatch! app_id has '${role}' but role is '${admin.role}'`);
            allValid = false;
            continue;
        }

        console.log(`   ✅ New format is valid`);
    }

    console.log('\n' + '='.repeat(60));
    if (allValid) {
        console.log('✅ All migration checks PASSED!');
    } else {
        console.log('❌ Some migration checks FAILED!');
    }
    console.log('='.repeat(60));

    return allValid;
}

async function testMigration() {
    try {
        console.log('🧪 MIGRATION TEST SCRIPT\n');
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Clean up any existing test data first
        await cleanupTestData();

        // Setup test data
        const testData = await setupTestData();

        console.log('\n' + '='.repeat(60));
        console.log('⚠️  NOW RUN THE MIGRATION:');
        console.log('   npm run migrate:admin-appids');
        console.log('');
        console.log('   After the migration completes, run this script again');
        console.log('   with the --verify flag to check results:');
        console.log('   npx tsx src/scripts/test_migration.ts --verify');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Error during test:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

async function verifyOnly() {
    try {
        console.log('🔍 VERIFICATION MODE\n');
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        const isValid = await verifyMigration();

        if (isValid) {
            console.log('\n✅ Migration test SUCCESSFUL!');
            console.log('\nTo test rollback:');
            console.log('   npm run migrate:admin-appids:rollback');
            console.log('\nTo cleanup test data:');
            console.log('   npx tsx src/scripts/test_migration.ts --cleanup');
        } else {
            console.log('\n❌ Migration test FAILED!');
            console.log('Check the errors above for details.');
        }

    } catch (error) {
        console.error('\n❌ Error during verification:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

async function cleanupOnly() {
    try {
        console.log('🧹 CLEANUP MODE\n');
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        await cleanupTestData();

        console.log('\n✅ Cleanup complete!');

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Main execution
const args = process.argv.slice(2);
const isVerify = args.includes('--verify');
const isCleanup = args.includes('--cleanup');

if (isVerify) {
    verifyOnly().catch(error => {
        console.error('Verification failed:', error);
        process.exit(1);
    });
} else if (isCleanup) {
    cleanupOnly().catch(error => {
        console.error('Cleanup failed:', error);
        process.exit(1);
    });
} else {
    testMigration().catch(error => {
        console.error('Test setup failed:', error);
        process.exit(1);
    });
}
