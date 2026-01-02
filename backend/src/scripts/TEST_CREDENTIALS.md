# 🔐 Admin Login Credentials for Testing

## ✅ Validation Fixed!

The login form previously had strict validation that rejected the current app_id format. **This has been fixed!** You can now login with any app_id format:
- ✅ Old format: `vtu_app_001`
- ✅ New format after migration: `owner-name-app-unique-hash`

---

## Available Admin Accounts

Based on your database, here are the existing admin accounts:

### 📋 Admin #1 - VTU App (Primary)

```
App Name:     VTU App
App ID:       vtu_app_001
Email:        admin@vtuapp.com
Password:     Admin@123456
Role:         owner
Status:       active
```

**This is your main test account!**

### 📋 Admin #2 - Beta Data

```
App Name:     Beta Data
App ID:       APP_BETA_002
Email:        admin@betadata.com
Password:     Admin@123456
Role:         owner
Status:       active
```

### 📋 Admin #3 - Alpha VTU

```
App Name:     Alpha VTU
App ID:       APP_ALPHA_001
Email:        admin@alphavtu.com
Password:     Admin@123456
Role:         owner
Status:       active
```

---

## 🧪 Testing the Login

### Using curl (Command Line)

```bash
curl -X POST http://localhost:5000/api/app-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "vtu_app_001",
    "email": "admin@vtuapp.com",
    "password": "Admin@123456"
  }'
```

### Using Postman or Thunder Client

```
Method: POST
URL: http://localhost:5000/api/app-admin/login
Headers:
  Content-Type: application/json

Body (JSON):
{
  "app_id": "vtu_app_001",
  "email": "admin@vtuapp.com",
  "password": "Admin@123456"
}
```

### Expected Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "_id": "...",
      "email": "admin@vtuapp.com",
      "role": "owner",
      "app_id": "vtu_app_001"
    },
    "app": {
      "name": "VTU App",
      "logo": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🔄 Testing the Migration

### Test Migration with These Credentials

#### Before Migration:
```
App ID: vtu_app_001  (Old format)
```

#### After Migration:
```
App ID: owner-[owner-name]-vtu-app-admin-[hash]  (New format)
```

### Step-by-Step Test

1. **Login with OLD format** (before migration):
   ```bash
   curl -X POST http://localhost:5000/api/app-admin/login \
     -H "Content-Type: application/json" \
     -d '{"app_id":"vtu_app_001","email":"admin@vtuapp.com","password":"Admin@123456"}'
   ```

2. **Run the migration**:
   ```bash
   npm run migrate:admin-appids
   ```

3. **Check the NEW app_id**:
   ```bash
   npx tsx src/scripts/list_admins.ts
   ```

4. **Login with NEW format**:
   ```bash
   curl -X POST http://localhost:5000/api/app-admin/login \
     -H "Content-Type: application/json" \
     -d '{"app_id":"[new-app-id]","email":"admin@vtuapp.com","password":"Admin@123456"}'
   ```

5. **Rollback to test**:
   ```bash
   npm run migrate:admin-appids:rollback
   ```

6. **Verify OLD format works again**:
   ```bash
   curl -X POST http://localhost:5000/api/app-admin/login \
     -H "Content-Type: application/json" \
     -d '{"app_id":"vtu_app_001","email":"admin@vtuapp.com","password":"Admin@123456"}'
   ```

---

## 📝 Quick Commands Reference

### Check Admin Accounts
```bash
npx tsx src/scripts/list_admins.ts
```

### Reset Admin Password
```bash
npx tsx src/scripts/reset_app_admin_password.ts
```

### Run Migration
```bash
npm run migrate:admin-appids
```

### Rollback Migration
```bash
npm run migrate:admin-appids:rollback
```

### Test Migration (Complete Workflow)
```bash
# Setup test data
npm run migrate:test-setup

# Run migration
npm run migrate:admin-appids

# Verify results
npm run migrate:test-verify

# Cleanup
npm run migrate:test-cleanup
```

---

## 🔧 Troubleshooting

### Issue: Login Fails with 400 Bad Request

**Possible Causes:**
1. Wrong app_id (check if migration already ran)
2. Wrong password
3. Account suspended

**Solution:**
```bash
# Check current app_id
npx tsx src/scripts/list_admins.ts

# Reset password if needed
npx tsx src/scripts/reset_app_admin_password.ts
```

### Issue: "Invalid credentials"

**Check:**
1. App ID is correct (case-sensitive)
2. Email is correct (lowercase)
3. Password is exactly: `Admin@123456`

### Issue: After migration, can't login

**Solution:**
```bash
# Check the new app_id
npx tsx src/scripts/list_admins.ts

# Use the new app_id shown in the output
```

---

## 🎯 Recommended Test Flow

### Option 1: Test with Existing Data
```bash
# 1. Check current admins
npx tsx src/scripts/list_admins.ts

# 2. Test login with current credentials
curl -X POST http://localhost:5000/api/app-admin/login \
  -H "Content-Type: application/json" \
  -d '{"app_id":"vtu_app_001","email":"admin@vtuapp.com","password":"Admin@123456"}'

# 3. Run migration
npm run migrate:admin-appids

# 4. Check new app_id
npx tsx src/scripts/list_admins.ts

# 5. Test login with new app_id
# (use the new app_id from step 4)
```

### Option 2: Test with Fresh Test Data
```bash
# 1. Setup test data
npm run migrate:test-setup

# 2. Run migration
npm run migrate:admin-appids

# 3. Verify migration
npm run migrate:test-verify

# 4. Cleanup
npm run migrate:test-cleanup
```

---

## 📞 Support

If you encounter any issues:

1. Check server logs for errors
2. Verify MongoDB is running
3. Check `.env` file has correct `MONGO_URI`
4. Run `npx tsx src/scripts/list_admins.ts` to see current state

---

**Created**: 2026-01-01  
**Last Updated**: 2026-01-01
