# Admin AppID Migration Script

## Overview

This migration script converts existing admin appIds from the old format to a new structured format following the pattern: **ROLE-OWNER-APP-UNIQUE**

## Features

✅ **Safe Migration**: Uses MongoDB transactions for atomic operations  
✅ **Rollback Support**: Can revert all changes if needed  
✅ **Idempotent**: Safe to run multiple times (skips already migrated records)  
✅ **Detailed Logging**: Maintains complete audit trail in database  
✅ **Collision Prevention**: Ensures all new IDs are unique  
✅ **Error Handling**: Rolls back on errors to maintain data integrity

## New AppID Format

The new format follows this pattern:

```
ROLE-OWNER-APP-UNIQUE-HASH
```

### Examples:

- `owner-john-doe-vtuapp-johndoe-a3f2e1`
- `admin-jane-smith-dataapp-jsmith-b4c5d2`
- `support-bob-jones-airtimeapp-bjones-c6d7e3`

### Components:

1. **ROLE**: Admin role (owner, admin, support)
2. **OWNER**: Owner's name (slugified)
3. **APP**: App name (slugified)
4. **UNIQUE**: Unique identifier from email username
5. **HASH**: 6-character hash for additional uniqueness

## Usage

### Running the Migration

```bash
# From the backend directory
npm run migrate:admin-appids

# Or using tsx directly
npx tsx src/scripts/migrate_admin_appids.ts
```

### Rolling Back the Migration

If you need to revert the changes:

```bash
npx tsx src/scripts/migrate_admin_appids.ts --rollback
```

## How It Works

### Migration Process

1. **Connection**: Connects to MongoDB and starts a transaction
2. **Fetch Records**: Retrieves all existing AppAdmin records
3. **Check Migration Status**: Skips records already in new format
4. **Generate New IDs**: Creates new app_ids using:
   - Admin role from the record
   - Owner information from VTfreeUser (linked via CreatedApp)
   - App name from CreatedApp
   - Unique identifier from admin email
   - Hash for additional uniqueness
5. **Ensure Uniqueness**: Checks for collisions and adds counters if needed
6. **Update Records**: Updates each admin record with new app_id
7. **Log Changes**: Saves detailed logs to `admin_appid_migration_logs` collection
8. **Commit/Rollback**: Commits if successful, rolls back if any errors occur

### Idempotency

The script is safe to run multiple times because it:

- Checks if app_id already follows the new format
- Skips records that have been migrated
- Logs skipped records for audit purposes

### Safety Mechanisms

1. **Transaction Support**: All changes are wrapped in a MongoDB transaction
2. **Automatic Rollback**: If any error occurs, all changes are reverted
3. **Migration Logs**: Every change is logged for audit and rollback purposes
4. **Uniqueness Checks**: Prevents duplicate app_ids in the database
5. **Graceful Fallbacks**: Handles missing related records (apps, owners)

## Migration Logs

The script creates a `admin_appid_migration_logs` collection with:

```typescript
{
  admin_id: string;      // MongoDB ObjectId of the admin
  old_app_id: string;    // Original app_id
  new_app_id: string;    // New structured app_id
  email: string;         // Admin email
  role: string;          // Admin role
  status: string;        // 'completed', 'skipped', or 'rolled_back'
  timestamp: Date;       // When the migration occurred
  error?: string;        // Error message if migration failed
}
```

### Viewing Migration Logs

```javascript
// In MongoDB shell or Compass
db.admin_appid_migration_logs.find().pretty()

// Get summary
db.admin_appid_migration_logs.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

## Output Example

```
🚀 MIGRATION MODE

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Fetching all admin records...
✅ Found 15 admin records

🔄 Starting migration...

🔧 Migrating: john@example.com (owner)
   Old app_id: vtu_app_001
   New app_id: owner-john-doe-vtuapp-john-a3f2e1
✅ Migrated successfully

⏭️  Skipping jane@example.com - already in new format: admin-jane-smith-dataapp-jsmith-b4c5d2

📝 Saved 15 migration logs to database

✅ Transaction committed successfully!

============================================================
📊 MIGRATION SUMMARY
============================================================
Total records:     15
Migrated:          12
Skipped:           3
Errors:            0
============================================================

🎉 Migration completed successfully!
📝 All changes have been committed to the database

🔌 Disconnected from MongoDB
```

## Error Handling

If errors occur during migration:

1. **Immediate Rollback**: Transaction is aborted automatically
2. **Logs Preserved**: Error details are saved to the logs collection
3. **No Partial Updates**: Either all records migrate or none do
4. **Error Details**: Specific error messages are logged for debugging

## Testing Before Production

### 1. Test on Development Database

```bash
# Point to dev database in your .env
MONGO_URI=mongodb://localhost:27017/vtfree_dev

# Run migration
npx tsx src/scripts/migrate_admin_appids.ts
```

### 2. Verify Results

```bash
# Check updated records
mongo vtfree_dev
db.appadmins.find({}, { app_id: 1, email: 1, role: 1 })

# Check migration logs
db.admin_appid_migration_logs.find()
```

### 3. Test Rollback

```bash
# Rollback the migration
npx tsx src/scripts/migrate_admin_appids.ts --rollback

# Verify records are reverted
db.appadmins.find({}, { app_id: 1, email: 1, role: 1 })
```

### 4. Test Idempotency

```bash
# Run migration again
npx tsx src/scripts/migrate_admin_appids.ts

# Should skip all records and show no errors
```

## Production Deployment

### Recommended Steps:

1. **Backup Database**:
   ```bash
   mongodump --uri="mongodb://your-production-uri" --out=/backup/$(date +%Y%m%d)
   ```

2. **Schedule Maintenance Window**: Inform users of brief downtime

3. **Run Migration**:
   ```bash
   npx tsx src/scripts/migrate_admin_appids.ts
   ```

4. **Verify Results**: Check migration logs and test login with new app_ids

5. **Monitor**: Watch for any issues with admin logins

6. **Keep Logs**: Preserve migration logs for audit purposes

## Troubleshooting

### Failed Migration

If migration fails:

1. Check error messages in console output
2. Review migration logs: `db.admin_appid_migration_logs.find({ status: 'rolled_back' })`
3. Fix underlying issues (e.g., missing related records)
4. Re-run migration (it's idempotent)

### Duplicate App IDs

The script prevents duplicates automatically by:
- Checking existing app_ids before insert
- Adding numeric suffixes if needed
- Using hash-based uniqueness

### Missing Related Records

If CreatedApp or VTfreeUser records are missing:
- Script uses graceful fallbacks
- Generates valid app_ids with "unknown" owner/app placeholders
- Logs warnings for manual review

## NPM Script Setup

Add to your `package.json`:

```json
{
  "scripts": {
    "migrate:admin-appids": "tsx src/scripts/migrate_admin_appids.ts",
    "migrate:admin-appids:rollback": "tsx src/scripts/migrate_admin_appids.ts --rollback"
  }
}
```

## Questions & Support

If you encounter any issues or have questions:

1. Check the migration logs in MongoDB
2. Review the error messages in console output
3. Verify related records exist (CreatedApp, VTfreeUser)
4. Test rollback functionality
5. Contact the development team for support

---

**Last Updated**: 2026-01-01  
**Version**: 1.0.0
