import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
import AppAdmin from '../models/app_admin.model.js';
import CreatedApp from '../models/created_app.model.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import crypto from 'crypto';
const MIGRATION_COLLECTION = 'admin_appid_migration_logs';
let migrationLogs = [];
/**
 * Generate a sanitized slug from a string
 */
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
        .substring(0, 20); // Limit length
}
/**
 * Generate unique identifier from email (first part before @)
 */
function getUniqueFromEmail(email) {
    const username = email.split('@')[0];
    return slugify(username);
}
/**
 * Generate a short hash for uniqueness
 */
function generateShortHash(input) {
    return crypto
        .createHash('md5')
        .update(input)
        .digest('hex')
        .substring(0, 6);
}
/**
 * Generate new app_id in format: ROLE-OWNER-APP-UNIQUE
 * Example: owner-john-vtuapp-a3f2e1
 */
async function generateNewAppId(admin) {
    try {
        // Get the CreatedApp to find owner
        const app = await CreatedApp.findOne({ app_id: admin.app_id });
        if (!app) {
            console.warn(`⚠️  App not found for app_id: ${admin.app_id}, using fallback`);
            // Fallback: Use app_id directly if app not found
            const role = admin.role.toLowerCase();
            const appSlug = slugify(admin.app_id);
            const emailUnique = getUniqueFromEmail(admin.email);
            const hash = generateShortHash(`${admin.app_id}-${admin.email}`);
            return `${role}-unknown-${appSlug}-${emailUnique}-${hash}`;
        }
        // Get the owner/creator of the app
        const owner = await VTfreeUser.findById(app.owner_id);
        if (!owner) {
            console.warn(`⚠️  Owner not found for owner_id: ${app.owner_id}, using fallback`);
            // Fallback without owner
            const role = admin.role.toLowerCase();
            const appSlug = slugify(app.app_name);
            const emailUnique = getUniqueFromEmail(admin.email);
            const hash = generateShortHash(`${admin.app_id}-${admin.email}`);
            return `${role}-unknown-${appSlug}-${emailUnique}-${hash}`;
        }
        // Build new app_id: ROLE-OWNER-APP-UNIQUE
        const role = admin.role.toLowerCase(); // owner, admin, support
        const ownerSlug = slugify(`${owner.first_name}-${owner.last_name}`);
        const appSlug = slugify(app.app_name);
        const emailUnique = getUniqueFromEmail(admin.email);
        // Create a hash for additional uniqueness
        const hash = generateShortHash(`${admin.app_id}-${admin.email}-${admin._id}`);
        return `${role}-${ownerSlug}-${appSlug}-${emailUnique}-${hash}`;
    }
    catch (error) {
        console.error(`❌ Error generating new app_id for admin ${admin.email}:`, error);
        // Ultimate fallback
        const role = admin.role.toLowerCase();
        const emailUnique = getUniqueFromEmail(admin.email);
        const hash = generateShortHash(`${admin.app_id}-${admin.email}-${Date.now()}`);
        return `${role}-fallback-${emailUnique}-${hash}`;
    }
}
/**
 * Check if an app_id has already been migrated (follows new format)
 */
function isAlreadyMigrated(app_id) {
    // New format should have at least 4 parts separated by dashes
    // Format: ROLE-OWNER-APP-UNIQUE (minimum)
    const parts = app_id.split('-');
    // Check if it matches the new format pattern
    // Must have at least 4 parts and first part should be a role
    const validRoles = ['owner', 'admin', 'support'];
    return parts.length >= 4 && validRoles.includes(parts[0].toLowerCase());
}
/**
 * Ensure uniqueness by checking existing app_ids
 */
async function ensureUnique(baseAppId, existingIds) {
    let appId = baseAppId;
    let counter = 1;
    // Check both in-memory set and database
    while (existingIds.has(appId) || await AppAdmin.exists({ app_id: appId })) {
        const parts = baseAppId.split('-');
        const lastPart = parts[parts.length - 1];
        // If last part is already a counter, increment it
        if (/^\d+$/.test(lastPart)) {
            parts[parts.length - 1] = String(counter);
            counter++;
        }
        else {
            // Add counter to the end
            parts.push(String(counter));
            counter++;
        }
        appId = parts.join('-');
    }
    existingIds.add(appId);
    return appId;
}
/**
 * Save migration logs to database for rollback support
 */
async function saveMigrationLogs() {
    try {
        const LogModel = mongoose.model('AdminAppIdMigrationLog', new mongoose.Schema({
            admin_id: String,
            old_app_id: String,
            new_app_id: String,
            email: String,
            role: String,
            status: String,
            timestamp: Date,
            error: String,
        }), MIGRATION_COLLECTION);
        await LogModel.insertMany(migrationLogs);
        console.log(`📝 Saved ${migrationLogs.length} migration logs to database`);
    }
    catch (error) {
        console.error('❌ Error saving migration logs:', error);
    }
}
/**
 * Perform the migration
 */
async function migrateAdminAppIds() {
    const session = await mongoose.startSession();
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB\n');
        // Start transaction for rollback support
        session.startTransaction();
        console.log('📊 Fetching all admin records...');
        const allAdmins = await AppAdmin.find({}).session(session);
        console.log(`✅ Found ${allAdmins.length} admin records\n`);
        if (allAdmins.length === 0) {
            console.log('ℹ️  No admin records found. Nothing to migrate.');
            await session.abortTransaction();
            return;
        }
        // Track existing IDs to prevent collisions
        const existingNewIds = new Set();
        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        console.log('🔄 Starting migration...\n');
        for (const admin of allAdmins) {
            try {
                // Check if already migrated
                if (isAlreadyMigrated(admin.app_id)) {
                    console.log(`⏭️  Skipping ${admin.email} - already in new format: ${admin.app_id}`);
                    migrationLogs.push({
                        admin_id: admin._id.toString(),
                        old_app_id: admin.app_id,
                        new_app_id: admin.app_id,
                        email: admin.email,
                        role: admin.role,
                        status: 'skipped',
                        timestamp: new Date(),
                    });
                    skippedCount++;
                    existingNewIds.add(admin.app_id);
                    continue;
                }
                console.log(`🔧 Migrating: ${admin.email} (${admin.role})`);
                console.log(`   Old app_id: ${admin.app_id}`);
                // Generate new app_id
                const baseNewAppId = await generateNewAppId(admin);
                const newAppId = await ensureUnique(baseNewAppId, existingNewIds);
                console.log(`   New app_id: ${newAppId}`);
                // Update the admin record
                const oldAppId = admin.app_id;
                admin.app_id = newAppId;
                await admin.save({ session });
                migrationLogs.push({
                    admin_id: admin._id.toString(),
                    old_app_id: oldAppId,
                    new_app_id: newAppId,
                    email: admin.email,
                    role: admin.role,
                    status: 'completed',
                    timestamp: new Date(),
                });
                migratedCount++;
                console.log(`✅ Migrated successfully\n`);
            }
            catch (error) {
                errorCount++;
                console.error(`❌ Error migrating ${admin.email}:`, error.message);
                migrationLogs.push({
                    admin_id: admin._id.toString(),
                    old_app_id: admin.app_id,
                    new_app_id: '',
                    email: admin.email,
                    role: admin.role,
                    status: 'rolled_back',
                    timestamp: new Date(),
                    error: error.message,
                });
            }
        }
        // Save migration logs before committing
        await saveMigrationLogs();
        if (errorCount > 0) {
            console.log(`\n⚠️  ${errorCount} errors occurred during migration.`);
            console.log('🔄 Rolling back transaction...');
            await session.abortTransaction();
            console.log('✅ Transaction rolled back successfully');
            console.log('📝 Migration logs saved for review');
        }
        else {
            // Commit transaction if no errors
            await session.commitTransaction();
            console.log('\n✅ Transaction committed successfully!');
        }
        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total records:     ${allAdmins.length}`);
        console.log(`Migrated:          ${migratedCount}`);
        console.log(`Skipped:           ${skippedCount}`);
        console.log(`Errors:            ${errorCount}`);
        console.log('='.repeat(60));
        if (errorCount === 0) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('📝 All changes have been committed to the database');
        }
        else {
            console.log('\n⚠️  Migration encountered errors and was rolled back');
            console.log(`📝 Check the '${MIGRATION_COLLECTION}' collection for details`);
        }
    }
    catch (error) {
        console.error('\n❌ Fatal error during migration:', error);
        try {
            await session.abortTransaction();
            console.log('🔄 Transaction rolled back due to fatal error');
        }
        catch (rollbackError) {
            console.error('❌ Error rolling back transaction:', rollbackError);
        }
        throw error;
    }
    finally {
        session.endSession();
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}
/**
 * Rollback function - reverts migration using saved logs
 */
async function rollbackMigration() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB\n');
        const LogModel = mongoose.model('AdminAppIdMigrationLog', new mongoose.Schema({
            admin_id: String,
            old_app_id: String,
            new_app_id: String,
            email: String,
            role: String,
            status: String,
            timestamp: Date,
            error: String,
        }), MIGRATION_COLLECTION);
        console.log('📊 Fetching migration logs...');
        const logs = await LogModel.find({ status: 'completed' }).sort({ timestamp: -1 });
        if (logs.length === 0) {
            console.log('ℹ️  No completed migrations found to rollback');
            return;
        }
        console.log(`✅ Found ${logs.length} migrations to rollback\n`);
        console.log('🔄 Starting rollback...\n');
        let rolledBackCount = 0;
        let errorCount = 0;
        for (const log of logs) {
            try {
                console.log(`🔧 Rolling back: ${log.email}`);
                console.log(`   Reverting: ${log.new_app_id} → ${log.old_app_id}`);
                const admin = await AppAdmin.findOne({ app_id: log.new_app_id });
                if (!admin) {
                    console.log(`⚠️  Admin not found with new app_id, skipping...`);
                    continue;
                }
                admin.app_id = log.old_app_id;
                await admin.save();
                // Update log status
                await LogModel.updateOne({ _id: log._id }, { $set: { status: 'rolled_back' } });
                rolledBackCount++;
                console.log(`✅ Rolled back successfully\n`);
            }
            catch (error) {
                errorCount++;
                console.error(`❌ Error rolling back ${log.email}:`, error.message);
            }
        }
        console.log('\n' + '='.repeat(60));
        console.log('📊 ROLLBACK SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total logs:        ${logs.length}`);
        console.log(`Rolled back:       ${rolledBackCount}`);
        console.log(`Errors:            ${errorCount}`);
        console.log('='.repeat(60));
        if (errorCount === 0) {
            console.log('\n✅ Rollback completed successfully!');
        }
        else {
            console.log('\n⚠️  Rollback completed with some errors');
        }
    }
    catch (error) {
        console.error('\n❌ Fatal error during rollback:', error);
        throw error;
    }
    finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}
// Main execution
const args = process.argv.slice(2);
const isRollback = args.includes('--rollback');
if (isRollback) {
    console.log('🔄 ROLLBACK MODE\n');
    rollbackMigration().catch(error => {
        console.error('Migration rollback failed:', error);
        process.exit(1);
    });
}
else {
    console.log('🚀 MIGRATION MODE\n');
    migrateAdminAppIds().catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}
