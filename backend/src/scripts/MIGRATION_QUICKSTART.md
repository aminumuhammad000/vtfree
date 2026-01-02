# Quick Start: Admin AppID Migration

## TL;DR

```bash
# Run the migration
npm run migrate:admin-appids

# Rollback if needed
npm run migrate:admin-appids:rollback
```

## What This Does

Converts admin `app_id` from formats like:
- ❌ `vtu_app_001`
- ❌ `myapp_123`

To structured format like:
- ✅ `owner-john-doe-vtuapp-johndoe-a3f2e1`
- ✅ `admin-jane-smith-dataapp-jsmith-b4c5d2`

## Pre-Flight Checklist

Before running in production:

- [ ] **Backup database** (mongodump)
- [ ] **Test on staging/dev** environment first
- [ ] **Verify rollback** works on test data
- [ ] **Schedule maintenance window** (5-10 min recommended)
- [ ] **Notify team** about the migration

## Running the Migration

### Step 1: Backup

```bash
# Backup your database
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)
```

### Step 2: Run Migration

```bash
cd backend
npm run migrate:admin-appids
```

### Step 3: Verify

Check the output for:
- Total records migrated
- Any errors or warnings
- Migration summary

Expected output:
```
🎉 Migration completed successfully!
📊 MIGRATION SUMMARY
Total records:     15
Migrated:          12
Skipped:           3
Errors:            0
```

### Step 4: Test

Log in as an admin user to verify everything works.

## If Something Goes Wrong

### Immediate Rollback

```bash
npm run migrate:admin-appids:rollback
```

This will:
- Revert all app_ids to their original values
- Use the migration logs to restore exact state
- Show rollback summary

### Check Migration Logs

Connect to MongoDB and run:

```javascript
// View all migration logs
db.admin_appid_migration_logs.find().pretty()

// View only errors
db.admin_appid_migration_logs.find({ error: { $exists: true } })

// View summary by status
db.admin_appid_migration_logs.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

## Safety Features

✅ **Transaction-based**: All changes are atomic  
✅ **Auto-rollback**: Errors trigger automatic rollback  
✅ **Idempotent**: Safe to run multiple times  
✅ **Migration logs**: Complete audit trail  
✅ **Uniqueness checks**: No duplicate IDs created

## Common Scenarios

### Scenario 1: First Time Migration

```bash
npm run migrate:admin-appids
```

Expected: All records migrate, no skips

### Scenario 2: Re-running After Partial Failure

```bash
npm run migrate:admin-appids
```

Expected: Already migrated records are skipped, only new/failed records are processed

### Scenario 3: Testing Without Committing

Currently the script uses transactions and commits automatically.
For testing, run on a separate database/environment first.

### Scenario 4: Need to Undo Migration

```bash
npm run migrate:admin-appids:rollback
```

Expected: All changes from the last migration are reverted

## Environment Variables

Make sure your `.env` file has:

```env
MONGO_URI=mongodb://localhost:27017/vtfree
JWT_SECRET=your-secret-key
```

## Troubleshooting

### Error: Connection Failed

**Cause**: MongoDB not running or wrong URI  
**Fix**: Check MONGO_URI in .env and ensure MongoDB is running

### Error: Duplicate Key

**Cause**: Unique constraint violation (shouldn't happen with proper uniqueness checks)  
**Fix**: Check for manual database changes, run rollback, then re-run migration

### Warning: App Not Found

**Cause**: AppAdmin record exists but CreatedApp doesn't  
**Action**: Migration continues with fallback format, review logs after migration

### Warning: Owner Not Found

**Cause**: CreatedApp exists but VTfreeUser (owner) doesn't  
**Action**: Migration continues with "unknown" as owner, review logs after migration

## Post-Migration Steps

1. **Verify login**: Test admin login with new app_ids
2. **Check API calls**: Ensure all admin API endpoints work
3. **Monitor logs**: Watch for any authentication issues
4. **Keep backup**: Retain database backup for at least 7 days
5. **Document changes**: Update team documentation about new format

## Support

For issues or questions:

1. Check `MIGRATION_README.md` for detailed documentation
2. Review migration logs in MongoDB
3. Check script source: `src/scripts/migrate_admin_appids.ts`
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-01
