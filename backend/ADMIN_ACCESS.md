# Admin Access

## Default Admin Credentials

After seeding the admin user, use these credentials to login:

```
📧 Email: admin@vtuapp.com
🔑 Password: Admin@123456
```

⚠️ **IMPORTANT**: Change this password immediately after first login!

## Creating/Resetting Admin User

To create or reset the admin user, run:

```bash
cd backend
npm run seed:admin
```

This script will:
- Create a "Super Admin" role with full permissions if it doesn't exist
- Create an admin user with email `admin@vtuapp.com` if it doesn't exist
- Reset the password to `Admin@123456` if the admin already exists

## Admin Login Endpoint

**Endpoint**: `POST /api/admin/login`

**Request Body**:
```json
{
  "email": "admin@vtuapp.com",
  "password": "Admin@123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "_id": "...",
      "email": "admin@vtuapp.com",
      "first_name": "Super",
      "last_name": "Admin",
      "role_id": { ... },
      "status": "active",
      "last_login_at": "2025-11-10T...",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Using Admin Token

After login, use the token in subsequent requests:

```bash
Authorization: Bearer <token>
```

## Admin Endpoints

All admin endpoints require authentication and are prefixed with `/api/admin/`:

- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/transactions` - Get all transactions
- `PUT /api/admin/transactions/:id/status` - Update transaction status
- `GET /api/admin/audit-logs` - Get audit logs

## Security Notes

1. Always change the default password after first login
2. Use strong passwords for production
3. Store admin credentials securely
4. Enable 2FA for production environments
5. Regularly audit admin access logs
