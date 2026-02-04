
## Virtual Account Endpoints

### Create Virtual Account
**POST** `/virtual-accounts`

Generate a new dedicated virtual account for a customer. You must specify a bankType (e.g., "gtBank").

**Request Body**

```json
{
  "bankType": "gtBank",
  "accountName": "John Doe",
  "email": "john.doe@example.com",
  "reference": "cust_ref_12345",
  "phone": "08012345678"
}
```

**Response**

```json
{
  "success": true,
  "message": "Virtual account created successfully",
  "data": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "accountNumber": "1234567890",
    "accountName": "John Doe",
    "alias": "John Doe",
    "reference": "cust_ref_12345",
    "bankName": "GTBank",
    "bankType": "gtBank",
    "status": "active"
  }
}
```

### Fetch Virtual Accounts
**GET** `/virtual-accounts`

Retrieve a list of all virtual accounts created under your API key.

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "accountNumber": "1234567890",
      "accountName": "John Doe",
      "bankName": "GTBank",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "accountNumber": "0987654321",
      "accountName": "Jane Smith",
      "bankName": "GTBank",
      "status": "active",
      "createdAt": "2024-01-14T15:30:00.000Z"
    }
  ]
}
```

### Fetch Account Balance
**GET** `/virtual-accounts/:accountNumber/balance`

Fetch the current balance of a specific virtual account.

**Response**

```json
{
  "success": true,
  "data": {
    "balance": 50000.00,
    "currency": "NGN",
    "accountNumber": "1234567890"
  }
}
```

### Fetch Transactions
**GET** `/virtual-accounts/:accountNumber/transactions`

Retrieve the transaction history for a specific virtual account.

**Response**

```json
{
  "success": true,
  "data": [
    {
      "reference": "TXN_123456789",
      "amount": 5000.00,
      "type": "credit",
      "description": "Transfer from Bank A",
      "date": "2024-01-15T12:00:00.000Z",
      "status": "success"
    },
    {
      "reference": "TXN_987654321",
      "amount": 2000.00,
      "type": "debit",
      "description": "Service Charge",
      "date": "2024-01-14T09:15:00.000Z",
      "status": "success"
    }
  ]
}
```

## Webhooks
VTPay uses webhooks to notify your application when an event happens in your account (e.g., incoming payments). Configure your webhook URL in the developer dashboard.

**Sample Payload**
```json
{
  "event": "payment.success",
  "data": {
    "amount": 5000,
    "reference": "unique_ref_001",
    "accountNumber": "1234567890",
    "customer": "John Doe",
    "timestamp": "2024-01-15T12:00:00.000Z"
  }
}
```
