# VTUApp Admin API Documentation

## Overview
This document provides comprehensive documentation for all Admin API endpoints in the VTUApp backend. All endpoints (except login) require JWT authentication via the `Authorization` header.

---

## Authentication

### Admin Login
**Endpoint:** `POST /api/admin/login`  
**Authentication:** None (public endpoint)  
**Description:** Authenticate admin user and receive JWT token

#### Request Body
```json
{
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "admin": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "admin@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role_id": {
        "_id": "507f1f77bcf86cd799439012",
        "role_name": "super_admin",
        "permissions": [...]
      },
      "status": "active",
      "last_login_at": "2025-11-11T10:30:00Z",
      "created_at": "2025-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczMjI3NTAwMCwiZXhwIjoxNzMyMzYxNDAwfQ.xxx"
  },
  "message": "Login successful"
}
```

#### Response (Error - 401)
```json
{
  "success": false,
  "message": "Invalid credentials",
  "statusCode": 401
}
```

#### Response (Error - 403)
```json
{
  "success": false,
  "message": "Account is inactive",
  "statusCode": 403
}
```

---

## Dashboard

### Get Dashboard Statistics
**Endpoint:** `GET /api/admin/dashboard`  
**Authentication:** Required (Bearer Token)  
**Description:** Retrieve dashboard statistics including user counts and transaction metrics

#### Request Headers
```
Authorization: Bearer {jwt_token}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "activeUsers": 1050,
    "totalTransactions": 5432,
    "successfulTransactions": 5200
  },
  "message": "Dashboard stats retrieved successfully"
}
```

---

## User Management

### Get All Users
**Endpoint:** `GET /api/admin/users`  
**Authentication:** Required (Bearer Token)  
**Description:** Retrieve paginated list of all users

#### Query Parameters
- `page` (optional): Page number, default = 1
- `limit` (optional): Results per page, default = 10

#### Request Example
```
GET /api/admin/users?page=1&limit=10
Authorization: Bearer {jwt_token}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "first_name": "Amaka",
      "last_name": "Okafor",
      "email": "amaka@example.com",
      "phone_number": "+2348012345678",
      "status": "active",
      "kyc_status": "verified",
      "created_at": "2025-10-15T08:20:00Z",
      "updated_at": "2025-11-10T15:45:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "first_name": "Chukwu",
      "last_name": "Mensah",
      "email": "chukwu@example.com",
      "phone_number": "+2349087654321",
      "status": "active",
      "kyc_status": "pending",
      "created_at": "2025-11-01T12:30:00Z",
      "updated_at": "2025-11-11T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1250,
    "pages": 125
  },
  "message": "Users retrieved successfully"
}
```

---

### Get User by ID
**Endpoint:** `GET /api/admin/users/:id`  
**Authentication:** Required (Bearer Token)  
**Description:** Retrieve details of a specific user

#### Request Parameters
- `id` (required): User MongoDB ObjectId

#### Request Example
```
GET /api/admin/users/507f1f77bcf86cd799439013
Authorization: Bearer {jwt_token}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "first_name": "Amaka",
    "last_name": "Okafor",
    "email": "amaka@example.com",
    "phone_number": "+2348012345678",
    "status": "active",
    "kyc_status": "verified",
    "created_at": "2025-10-15T08:20:00Z",
    "updated_at": "2025-11-10T15:45:00Z"
  },
  "message": "User retrieved successfully"
}
```

#### Response (Error - 404)
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

---

### Update User
**Endpoint:** `PUT /api/admin/users/:id`  
**Authentication:** Required (Bearer Token)  
**Description:** Update user profile information

#### Request Parameters
- `id` (required): User MongoDB ObjectId

#### Request Body (All fields optional)
```json
{
  "first_name": "Amaka",
  "last_name": "Okafor",
  "email": "amaka.new@example.com",
  "phone_number": "+2348012345678",
  "status": "active",
  "kyc_status": "verified"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "first_name": "Amaka",
    "last_name": "Okafor",
    "email": "amaka.new@example.com",
    "phone_number": "+2348012345678",
    "status": "active",
    "kyc_status": "verified",
    "updated_at": "2025-11-11T14:22:00Z"
  },
  "message": "User updated successfully"
}
```

---

### Update User Status
**Endpoint:** `PATCH /api/admin/users/:id/status`  
**Authentication:** Required (Bearer Token)  
**Description:** Change user account status (active/suspended/deleted)

#### Request Parameters
- `id` (required): User MongoDB ObjectId

#### Request Body
```json
{
  "status": "suspended"
}
```

#### Valid Status Values
- `active`: User can use platform normally
- `suspended`: User account temporarily disabled
- `deleted`: User account marked for deletion

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "first_name": "Amaka",
    "last_name": "Okafor",
    "email": "amaka@example.com",
    "status": "suspended",
    "updated_at": "2025-11-11T14:25:00Z"
  },
  "message": "User status updated successfully"
}
```

---

### Delete User
**Endpoint:** `DELETE /api/admin/users/:id`  
**Authentication:** Required (Bearer Token)  
**Description:** Permanently delete a user account and associated data

#### Request Parameters
- `id` (required): User MongoDB ObjectId

#### Request Example
```
DELETE /api/admin/users/507f1f77bcf86cd799439013
Authorization: Bearer {jwt_token}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": null,
  "message": "User deleted successfully"
}
```

#### Response (Error - 404)
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

---

## Wallet Management

### Credit User Wallet
**Endpoint:** `POST /api/admin/wallet/credit`  
**Authentication:** Required (Bearer Token)  
**Description:** Manually credit a user's wallet (admin operation, logged in audit trail)

#### Request Body
```json
{
  "userId": "507f1f77bcf86cd799439013",
  "amount": 5000.00,
  "description": "Promotional credit for referral program"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "wallet": {
      "_id": "507f1f77bcf86cd799439015",
      "user_id": "507f1f77bcf86cd799439013",
      "balance": 25500.00,
      "currency": "NGN",
      "total_credited": 30000.00,
      "total_debited": 4500.00,
      "updated_at": "2025-11-11T14:30:00Z"
    }
  },
  "message": "Wallet credited successfully"
}
```

#### Response (Error - 404)
```json
{
  "success": false,
  "message": "Wallet not found",
  "statusCode": 404
}
```

#### Response (Error - 400)
```json
{
  "success": false,
  "message": "User ID and amount are required",
  "statusCode": 400
}
```

---

## Audit Logs

### Get Audit Logs
**Endpoint:** `GET /api/admin/audit-logs`  
**Authentication:** Required (Bearer Token)  
**Description:** Retrieve paginated audit logs of all admin actions

#### Query Parameters
- `page` (optional): Page number, default = 1
- `limit` (optional): Results per page, default = 10

#### Request Example
```
GET /api/admin/audit-logs?page=1&limit=10
Authorization: Bearer {jwt_token}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "admin_id": {
        "_id": "507f1f77bcf86cd799439011",
        "first_name": "John",
        "last_name": "Doe",
        "email": "admin@example.com"
      },
      "action": "user_status_updated",
      "entity_type": "User",
      "entity_id": "507f1f77bcf86cd799439013",
      "old_value": {
        "status": "active"
      },
      "new_value": {
        "status": "suspended"
      },
      "ip_address": "192.168.1.100",
      "timestamp": "2025-11-11T14:25:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439017",
      "admin_id": {
        "_id": "507f1f77bcf86cd799439011",
        "first_name": "John",
        "last_name": "Doe",
        "email": "admin@example.com"
      },
      "action": "wallet_credited",
      "entity_type": "Wallet",
      "entity_id": "507f1f77bcf86cd799439015",
      "old_value": {
        "balance": 20500.00
      },
      "new_value": {
        "balance": 25500.00
      },
      "ip_address": "192.168.1.100",
      "timestamp": "2025-11-11T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 450,
    "pages": 45
  },
  "message": "Audit logs retrieved successfully"
}
```

---

### Delete Audit Log
**Endpoint:** `DELETE /api/admin/audit-logs/:id`  
**Authentication:** Required (Bearer Token)  
**Description:** Delete a specific audit log entry

#### Request Parameters
- `id` (required): Audit Log MongoDB ObjectId

#### Request Example
```
DELETE /api/admin/audit-logs/507f1f77bcf86cd799439016
Authorization: Bearer {jwt_token}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": null,
  "message": "Audit log deleted successfully"
}
```

#### Response (Error - 404)
```json
{
  "success": false,
  "message": "Audit log not found",
  "statusCode": 404
}
```

---

## Pricing Management

### Get All Plans
**Endpoint:** `GET /api/admin/pricing`  
**Authentication:** Required (Bearer Token)  
**Description:** Retrieve all airtime and data plans with optional filters

#### Query Parameters
- `providerId` (optional): Filter by provider (1=MTN, 2=Airtel, 3=Glo, 4=9Mobile)
- `type` (optional): Filter by type (AIRTIME or DATA)
- `active` (optional): Filter by status (true or false)

#### Request Example
```
GET /api/admin/pricing?providerId=1&type=AIRTIME&active=true
Authorization: Bearer {jwt_token}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "_id": "507f1f77bcf86cd799439018",
        "providerId": 1,
        "providerName": "MTN",
        "externalPlanId": "1-100",
        "code": "MTN100",
        "name": "MTN 100 Airtime",
        "price": 100.00,
        "type": "AIRTIME",
        "discount": 0,
        "active": true,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-11-10T10:00:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439019",
        "providerId": 1,
        "providerName": "MTN",
        "externalPlanId": "1-500",
        "code": "MTN500",
        "name": "MTN 500 Airtime",
        "price": 500.00,
        "type": "AIRTIME",
        "discount": 5.5,
        "active": true,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-11-10T10:00:00Z"
      }
    ],
    "total": 24
  },
  "message": "Plans retrieved successfully"
}
```

---

### Get Plan by ID
**Endpoint:** `GET /api/admin/pricing/:id`  
**Authentication:** Required (Bearer Token)  
**Description:** Retrieve details of a specific plan

#### Request Parameters
- `id` (required): Plan MongoDB ObjectId

#### Request Example
```
GET /api/admin/pricing/507f1f77bcf86cd799439018
Authorization: Bearer {jwt_token}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "plan": {
      "_id": "507f1f77bcf86cd799439018",
      "providerId": 1,
      "providerName": "MTN",
      "externalPlanId": "1-100",
      "code": "MTN100",
      "name": "MTN 100 Airtime",
      "price": 100.00,
      "type": "AIRTIME",
      "discount": 0,
      "active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  },
  "message": "Plan retrieved successfully"
}
```

---

### Create Plan
**Endpoint:** `POST /api/admin/pricing`  
**Authentication:** Required (Bearer Token)  
**Description:** Create a new airtime or data plan

#### Request Body
```json
{
  "providerId": 1,
  "providerName": "MTN",
  "externalPlanId": "1-1000",
  "code": "MTN1000",
  "name": "MTN 1000 Airtime",
  "price": 1000.00,
  "type": "AIRTIME",
  "discount": 2.5,
  "meta": {
    "duration": "1 month",
    "features": "unlimited"
  },
  "active": true
}
```

#### Request Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| providerId | integer | Yes | Provider ID (1-4) |
| providerName | string | Yes | Provider name (MTN, Airtel, Glo, 9Mobile) |
| externalPlanId | string | No | External plan ID from provider |
| code | string | No | Plan code for reference |
| name | string | Yes | Plan display name |
| price | number | Yes | Plan price in NGN |
| type | string | Yes | AIRTIME or DATA |
| discount | number | No | Discount percentage (default: 0) |
| meta | object | No | Additional metadata |
| active | boolean | No | Whether plan is active (default: true) |

#### Response (Success - 201)
```json
{
  "success": true,
  "data": {
    "plan": {
      "_id": "507f1f77bcf86cd79943901a",
      "providerId": 1,
      "providerName": "MTN",
      "externalPlanId": "1-1000",
      "code": "MTN1000",
      "name": "MTN 1000 Airtime",
      "price": 1000.00,
      "type": "AIRTIME",
      "discount": 2.5,
      "active": true,
      "created_at": "2025-11-11T15:00:00Z"
    }
  },
  "message": "Plan created successfully"
}
```

#### Response (Error - 400)
```json
{
  "success": false,
  "message": "Missing required fields: providerId, providerName, name, price, type",
  "statusCode": 400
}
```

---

### Update Plan
**Endpoint:** `PUT /api/admin/pricing/:id`  
**Authentication:** Required (Bearer Token)  
**Description:** Update an existing plan

#### Request Parameters
- `id` (required): Plan MongoDB ObjectId

#### Request Body (All fields optional)
```json
{
  "price": 950.00,
  "discount": 3.0,
  "active": false
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "plan": {
      "_id": "507f1f77bcf86cd79943901a",
      "providerId": 1,
      "providerName": "MTN",
      "name": "MTN 1000 Airtime",
      "price": 950.00,
      "type": "AIRTIME",
      "discount": 3.0,
      "active": false,
      "updated_at": "2025-11-11T15:10:00Z"
    }
  },
  "message": "Plan updated successfully"
}
```

---

### Delete Plan
**Endpoint:** `DELETE /api/admin/pricing/:id`  
**Authentication:** Required (Bearer Token)  
**Description:** Delete a plan

#### Request Parameters
- `id` (required): Plan MongoDB ObjectId

#### Request Example
```
DELETE /api/admin/pricing/507f1f77bcf86cd79943901a
Authorization: Bearer {jwt_token}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "plan": {
      "_id": "507f1f77bcf86cd79943901a",
      "providerId": 1,
      "providerName": "MTN",
      "name": "MTN 1000 Airtime",
      "price": 950.00,
      "type": "AIRTIME"
    }
  },
  "message": "Plan deleted successfully"
}
```

---

### Get Plans by Provider
**Endpoint:** `GET /api/admin/pricing/provider/:providerId`  
**Authentication:** Required (Bearer Token)  
**Description:** Get all active plans for a specific provider

#### Request Parameters
- `providerId` (required): Provider ID (1-4)

#### Query Parameters
- `type` (optional): Filter by type (AIRTIME or DATA)

#### Request Example
```
GET /api/admin/pricing/provider/1?type=DATA
Authorization: Bearer {jwt_token}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "_id": "507f1f77bcf86cd79943901b",
        "providerId": 1,
        "providerName": "MTN",
        "externalPlanId": "1-100MB",
        "code": "MTN100MB",
        "name": "MTN 100MB",
        "price": 300.00,
        "type": "DATA",
        "discount": 0,
        "active": true
      },
      {
        "_id": "507f1f77bcf86cd79943901c",
        "providerId": 1,
        "providerName": "MTN",
        "externalPlanId": "1-500MB",
        "code": "MTN500MB",
        "name": "MTN 500MB",
        "price": 1200.00,
        "type": "DATA",
        "discount": 2.0,
        "active": true
      }
    ],
    "total": 12
  },
  "message": "Plans retrieved successfully"
}
```

---

### Bulk Import Plans
**Endpoint:** `POST /api/admin/pricing/bulk-import`  
**Authentication:** Required (Bearer Token)  
**Description:** Import multiple plans at once from array

#### Request Body
```json
{
  "plans": [
    {
      "providerId": 1,
      "providerName": "MTN",
      "externalPlanId": "1-100",
      "code": "MTN100",
      "name": "MTN 100",
      "price": 100.00,
      "type": "AIRTIME",
      "discount": 0,
      "active": true
    },
    {
      "providerId": 1,
      "providerName": "MTN",
      "externalPlanId": "1-500",
      "code": "MTN500",
      "name": "MTN 500",
      "price": 500.00,
      "type": "AIRTIME",
      "discount": 5.5,
      "active": true
    },
    {
      "providerId": 2,
      "providerName": "Airtel",
      "externalPlanId": "2-100",
      "code": "AIRTEL100",
      "name": "Airtel 100",
      "price": 100.00,
      "type": "AIRTIME",
      "discount": 0,
      "active": true
    }
  ]
}
```

#### Response (Success - 201)
```json
{
  "success": true,
  "data": {
    "count": 3
  },
  "message": "Plans imported successfully"
}
```

#### Response (Error - 400)
```json
{
  "success": false,
  "message": "Each plan must have: providerId, providerName, name, price, type",
  "statusCode": 400
}
```

---

## Common Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters or body |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Authenticated but not authorized for resource |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Authentication Header Format

All authenticated endpoints require this header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token is obtained from the login endpoint and contains:
- `id`: Admin user ID
- `role`: "admin"
- `exp`: Expiration time (24 hours from login)

---

## Error Handling

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "error": "Optional detailed error information"
}
```

---

## Rate Limiting & Best Practices

1. **Pagination**: Use page and limit parameters for large datasets
2. **Filtering**: Use query parameters to reduce response size
3. **Soft Deletes**: Consider using status fields instead of hard deletes
4. **Audit Logs**: All admin actions are logged automatically
5. **IP Tracking**: Admin actions include IP address for security

---

## Provider IDs Reference

| ID | Provider |
|----|----------|
| 1 | MTN |
| 2 | Airtel |
| 3 | Glo (Globacom) |
| 4 | 9Mobile |

---

## Created: November 11, 2025
**Version:** 1.0  
**Last Updated:** November 11, 2025
