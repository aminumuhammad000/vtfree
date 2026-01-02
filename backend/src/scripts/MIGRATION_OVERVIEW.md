# Admin AppID Migration - Complete Package

## 📦 What's Included

This migration package includes everything you need to safely convert admin appIds from the old format to the new structured format.

### Files Created

1. **`migrate_admin_appids.ts`** - Main migration script
2. **`test_migration.ts`** - Test script for validation
3. **`MIGRATION_README.md`** - Comprehensive documentation
4. **`MIGRATION_QUICKSTART.md`** - Quick reference guide
5. **`package.json`** - Updated with migration scripts

## 🎯 Quick Commands

### Testing (Recommended First!)

```bash
# 1. Setup test data
npm run migrate:test-setup

# 2. Run migration on test data
npm run migrate:admin-appids

# 3. Verify migration results
npm run migrate:test-verify

# 4. Test rollback
npm run migrate:admin-appids:rollback

# 5. Clean up test data
npm run migrate:test-cleanup
```

### Production Migration

```bash
# 1. Backup database first!
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)

# 2. Run migration
npm run migrate:admin-appids

# 3. If needed, rollback
npm run migrate:admin-appids:rollback
```

## 🔄 Migration Format

### Before (Old Format)
```
vtu_app_001
myapp_123
app_xyz
```

### After (New Format)
```
owner-john-doe-vtuapp-johndoe-a3f2e1
admin-jane-smith-dataapp-jsmith-b4c5d2
support-bob-jones-airtimeapp-bjones-c6d7e3
```

### Format Structure
```
ROLE-OWNER-APP-UNIQUE-HASH
├── ROLE: owner/admin/support
├── OWNER: Owner's name (slugified)
├── APP: App name (slugified)
├── UNIQUE: Email username (slugified)
└── HASH: 6-char MD5 hash for uniqueness
```

## ✨ Key Features

### 1. **Safety First**
- ✅ MongoDB transactions (all-or-nothing)
- ✅ Automatic rollback on errors
- ✅ Complete audit trail
- ✅ Idempotent (safe to re-run)

### 2. **Smart Migration**
- ✅ Detects already-migrated records
- ✅ Prevents duplicate app_ids
- ✅ Handles missing related records gracefully
- ✅ Generates unique IDs with collision detection

### 3. **Comprehensive Logging**
- ✅ Console output with progress
- ✅ Database logs for audit
- ✅ Error tracking and reporting
- ✅ Migration summary statistics

### 4. **Rollback Support**
- ✅ One-command rollback
- ✅ Uses migration logs to restore state
- ✅ Rollback verification

## 📊 What Gets Migrated

The script migrates the `app_id` field in the `appadmins` collection:

```typescript
// Before
{
  _id: ObjectId("..."),
  app_id: "vtu_app_001",  // ← OLD FORMAT
  email: "john@example.com",
  role: "owner",
  // ... other fields
}

// After
{
  _id: ObjectId("..."),
  app_id: "owner-john-doe-vtuapp-john-a3f2e1",  // ← NEW FORMAT
  email: "john@example.com",
  role: "owner",
  // ... other fields (unchanged)
}
```

## 🧪 Testing Workflow

### Complete Test Cycle

```bash
# 1. Setup test data (creates 4 test admin records)
npm run migrate:test-setup

# Expected output:
# ✅ Created test owner: test.owner@example.com
# ✅ Created test app: Test VTU App (old_test_app_001)
# ✅ Created owner admin: owner@testvtuapp.com
# ✅ Created regular admin: admin@testvtuapp.com
# ✅ Created support admin: support@testvtuapp.com
# ✅ Created new-format admin: newformat@testvtuapp.com

# 2. Run migration
npm run migrate:admin-appids

# Expected output:
# 🔧 Migrating: owner@testvtuapp.com (owner)
#    Old app_id: old_test_app_001
#    New app_id: owner-test-owner-test-vtu-app-owner-abc123
# ✅ Migrated successfully
# ...
# ⏭️  Skipping newformat@testvtuapp.com - already in new format
# 🎉 Migration completed successfully!

# 3. Verify results
npm run migrate:test-verify

# Expected output:
# 📋 Admin: owner@testvtuapp.com
#    Role: owner
#    App ID: owner-test-owner-test-vtu-app-owner-abc123
#    ✅ New format is valid
# ...
# ✅ All migration checks PASSED!

# 4. Test rollback
npm run migrate:admin-appids:rollback

# Expected output:
# 🔧 Rolling back: owner@testvtuapp.com
#    Reverting: owner-test-owner-test-vtu-app-owner-abc123 → old_test_app_001
# ✅ Rolled back successfully
# ✅ Rollback completed successfully!

# 5. Cleanup test data
npm run migrate:test-cleanup

# Expected output:
# 🧹 Cleaning up test data...
# ✅ Test data cleaned up
```

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] **Tested on staging** environment
- [ ] **Database backed up** (mongodump)
- [ ] **Team notified** about migration
- [ ] **Maintenance window** scheduled
- [ ] **Rollback plan** reviewed
- [ ] **Monitoring** prepared

### Deployment Steps

#### 1. Backup Database

```bash
# Create backup with timestamp
mongodump \
  --uri="mongodb://your-production-uri" \
  --out=/backup/pre-migration-$(date +%Y%m%d-%H%M%S)

# Verify backup
ls -lh /backup/
```

#### 2. Run Migration

```bash
cd backend
npm run migrate:admin-appids
```

#### 3. Monitor Output

Watch for:
- Total records count
- Migration progress
- Any warnings or errors
- Final summary

Example successful output:
```
📊 MIGRATION SUMMARY
Total records:     50
Migrated:          45
Skipped:           5
Errors:            0
🎉 Migration completed successfully!
```

#### 4. Post-Migration Verification

```bash
# Connect to MongoDB
mongo your-database

# Check migrated records
db.appadmins.find({}, { app_id: 1, email: 1, role: 1 }).pretty()

# Check migration logs
db.admin_appid_migration_logs.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

#### 5. Test Admin Login

- Log in as different admin roles
- Verify all functionality works
- Check API endpoints

#### 6. Monitor for Issues

- Check application logs
- Monitor error rates
- Watch for authentication failures

### If Issues Occur

#### Immediate Rollback

```bash
npm run migrate:admin-appids:rollback
```

#### Investigate

```javascript
// Check migration logs for errors
db.admin_appid_migration_logs.find({ 
  error: { $exists: true } 
}).pretty()

// Get detailed error summary
db.admin_appid_migration_logs.aggregate([
  { $match: { error: { $exists: true } } },
  { $group: { _id: "$error", count: { $sum: 1 } } }
])
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Connection Error

**Symptom**: `MongoError: failed to connect`

**Solution**:
```bash
# Check MONGO_URI in .env
cat .env | grep MONGO_URI

# Test connection
mongosh "$MONGO_URI"
```

#### 2. Transaction Not Supported

**Symptom**: `Transaction numbers are only allowed on a replica set member or mongos`

**Solution**: Use MongoDB replica set or run without transactions (modify script for standalone MongoDB)

#### 3. Duplicate Key Error

**Symptom**: `E11000 duplicate key error`

**Solution**: This shouldn't happen with proper uniqueness checks. If it does:
```bash
# Rollback
npm run migrate:admin-appids:rollback

# Check for manual database changes
db.appadmins.aggregate([
  { $group: { _id: "$app_id", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

# Fix duplicates, then re-run migration
```

#### 4. Missing Related Records

**Symptom**: Warnings about missing apps or owners

**Action**: Migration continues with fallback values
```bash
# After migration, check logs
db.admin_appid_migration_logs.find({ 
  new_app_id: /unknown/ 
})

# Review and fix manually if needed
```

## 📚 Documentation

### Full Documentation
- **`MIGRATION_README.md`** - Complete technical documentation
- **`MIGRATION_QUICKSTART.md`** - Quick reference guide
- **This file** - Complete package overview

### Script Documentation
- **`migrate_admin_appids.ts`** - Well-commented source code
- **`test_migration.ts`** - Test script with examples

## 🔐 Security Considerations

### Data Safety
- All passwords remain encrypted
- No sensitive data is logged
- Migration logs stored securely in database
- Rollback preserves exact original state

### Access Control
- Migration requires database write access
- Should be run by authorized personnel only
- Logs contain email addresses (PII) - handle appropriately

## 📈 Performance

### Expected Performance
- ~100-500 records/second
- Depends on database performance
- Transaction overhead is minimal

### For Large Datasets
For >10,000 records:
- Consider running during off-peak hours
- Monitor memory usage
- May want to add batch processing

## ✅ Success Criteria

Migration is successful when:

1. ✅ All records migrated or skipped
2. ✅ Zero errors in migration summary
3. ✅ Migration logs show all "completed" or "skipped"
4. ✅ Admin login works with new app_ids
5. ✅ All API endpoints function correctly
6. ✅ No authentication failures in logs

## 🎉 Next Steps

After successful migration:

1. **Keep backups** for at least 30 days
2. **Monitor application** for 1-2 weeks
3. **Update documentation** with new format
4. **Archive migration scripts** (don't delete!)
5. **Document lessons learned**

## 💡 Tips

### Development
- Always test on staging first
- Use test scripts before production
- Keep migration logs for audit

### Production
- Schedule during low-traffic periods
- Have rollback plan ready
- Monitor closely after migration
- Keep team on standby

### Maintenance
- Archive migration logs after 90 days
- Document any custom modifications
- Update this README if process changes

## 📞 Support

For issues or questions:

1. Check troubleshooting section above
2. Review migration logs in database
3. Check script source code comments
4. Contact development team

---

## 📝 Version History

- **v1.0.0** (2026-01-01)
  - Initial release
  - Transaction-based migration
  - Rollback support
  - Comprehensive testing tools

---

**Created**: 2026-01-01  
**Last Updated**: 2026-01-01  
**Status**: Ready for testing
