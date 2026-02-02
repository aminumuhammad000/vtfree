# IBData Default Provider Setup

## Overview
IBData has been configured as the **default, pre-configured provider** for all VTFree applications. App-admin users can start selling airtime and data immediately after funding their VTFree wallet - no API key configuration needed!

## Key Features

### 1. Auto-Configured for All Apps
- ✅ IBData is automatically created when an app-admin first views their provider list
- ✅ Priority 0 (always selected first)
- ✅ Active by default
- ✅ Supports Airtime & Data services
- ✅ Cannot be deleted (can only be disabled)

### 2. No API Key Required
- **IBData**: Pre-configured, funded via VTFree wallet - works immediately
- **SMEPlug**: Requires API key from user
- **TopUpMate**: Requires API key from user  
- **VTPass**: Requires API key from user

### 3. Wallet Integration
- IBData transactions deduct from the app owner's VTFree platform wallet
- App-admin just needs to fund their VTFree wallet to start selling
- Real-time balance displayed in provider dashboard

## How It Works

### For App-Admin Users

**Getting Started (3 Simple Steps):**
1. **Login** to app-admin dashboard
2. **Fund your VTFree wallet** with desired amount
3. **Start selling** - IBData is already configured!

**Viewing Provider Balance:**
- Navigate to: Settings → Providers → IBData
- Click "Test Connection"
- Your VTFree wallet balance will be displayed

### Using Other Providers

If an app-admin wants to use SMEPlug, TopUpMate, or VTPass instead:
1. Get API keys from the provider directly
2. Add the provider in Settings → Providers
3. Configure API credentials
4. Set priority higher than IBData (e.g., priority 1-10)
5. Test connection

## Technical Implementation

### Backend Changes

#### 1. Auto-Creation Logic (`app_admin_provider.controller.ts`)
```typescript
// When fetching providers, auto-create IBData if it doesn't exist
if (!ibdataProvider) {
    ibdataProvider = await ProviderConfig.create({
        app_id,
        name: 'IBData (Default)',
        code: 'ibdata',
        active: true,
        priority: 0, // Highest priority
        supported_services: ['airtime', 'data'],
        metadata: {
            is_default: true,
            auto_configured: true,
            description: 'Pre-configured provider. No API key needed.'
        }
    });
}
```

#### 2. Provider Registry (`providerRegistry.service.ts`)
```typescript
// Always check IBData first
const ibdataProvider = providers.find(p => p.code === 'ibdata');
if (ibdataProvider) {
    const ibdataClient = this.getClient('ibdata');
    if (ibdataClient) {
        return { code: 'ibdata', client: ibdataClient };
    }
}
```

#### 3. Deletion Protection
- IBData default provider cannot be deleted
- Returns error: "Cannot delete the default IBData provider. You can disable it instead."
- Users can disable it if they want to use a different provider exclusively

### Database Schema

```typescript
{
  app_id: string;
  name: "IBData (Default)";
  code: "ibdata";
  active: true;
  priority: 0;  // Always highest priority
  supported_services: ["airtime", "data"];
  metadata: {
    is_default: true;
    auto_configured: true;
    description: "Pre-configured provider. No API key needed - funded via VTFree wallet.";
  }
}
```

### Priority System

| Priority | Provider | Status |
|----------|----------|--------|
| 0 | IBData | Default - Auto-configured |
| 10+ | SMEPlug | Requires API key |
| 10+ | TopUpMate | Requires API key |
| 10+ | VTPass | Requires API key |

**Priority 0 = Highest** (selected first)  
**Priority 10+ = Lower** (fallback options)

## Setup Script

A one-time setup script is available to configure IBData for all existing apps:

```bash
npm run build
npx tsx src/scripts/setup-default-ibdata-provider.ts
```

This script:
- ✅ Checks all existing apps
- ✅ Creates IBData provider if missing
- ✅ Sets priority to 0
- ✅ Ensures it's active
- ✅ Updates existing IBData configs to correct priority

## API Response Changes

### GET /api/app-admin/providers

Response now includes helpful flags:

```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "_id": "...",
        "code": "ibdata",
        "name": "IBData (Default)",
        "active": true,
        "priority": 0,
        "is_default": true,        // NEW FLAG
        "requires_api_key": false, // NEW FLAG
        "metadata": {
          "is_default": true,
          "auto_configured": true,
          "description": "Pre-configured provider..."
        }
      },
      {
        "_id": "...",
        "code": "smeplug",
        "name": "SME Plug",
        "active": false,
        "priority": 10,
        "is_default": false,       // NEW FLAG
        "requires_api_key": true,  // NEW FLAG
        "api_key": "****",
        ...
      }
    ]
  }
}
```

## User Experience Flow

### New App-Admin User Journey

1. **Day 1 - Registration**
   - Creates account
   - Receives welcome email

2. **Day 1 - Dashboard Login**
   - Views dashboard
   - Sees "Fund Wallet" prompt

3. **Day 1 - Wallet Funding**
   - Funds VTFree wallet with ₦10,000
   - Balance updated instantly

4. **Day 1 - Start Selling**
   - Customers can immediately buy airtime/data
   - IBData provider is already configured
   - Transactions deduct from VTFree wallet
   
5. **Optional - Add More Providers**
   - If desired, can add SMEPlug with their own API key
   - Set SMEPlug priority to 5 for higher priority than IBData
   - Or keep IBData as primary

### Comparison: Before vs After

**BEFORE:**
```
1. Register app-admin account
2. Get IBData API credentials
3. Navigate to provider settings
4. Manually add IBData provider
5. Enter API key, secret key
6. Test connection
7. Fund wallet
8. Start selling
```

**AFTER:**
```
1. Register app-admin account
2. Fund VTFree wallet
3. Start selling ✅
```

## Error Handling

### Attempting to Delete IBData
```http
DELETE /api/app-admin/providers/:id
```

Response (403):
```json
{
  "success": false,
  "message": "Cannot delete the default IBData provider. You can disable it instead."
}
```

### No API Key Required for IBData
IBData doesn't check for `api_key` or `secret_key` in the provider config. It uses the VTFree platform's master IBData credentials and debits the app owner's wallet.

## Benefits

### For App-Admin Users
✅ **Zero Configuration** - Works immediately  
✅ **No API Management** - No need for IBData API keys  
✅ **Simple Wallet Funding** - One place to fund  
✅ **Instant Start** - Sell immediately after funding  
✅ **Predictable Costs** - Use VTFree wallet balance  

### For Platform Owners
✅ **Better Onboarding** - Reduced friction  
✅ **Higher Activation** - Users start selling faster  
✅ **Centralized Management** - Control IBData credentials  
✅ **Revenue Opportunity** - Can add markup on IBData rates  

### For End Users (Customer-Facing App Users)
✅ **Reliable Service** - IBData is always available  
✅ **Consistent Experience** - Default provider works  
✅ **Fast Transactions** - No provider switching delays  

## Security

1. **Platform-Level Credentials**: IBData API keys are stored at the platform level, not app level
2. **Wallet Isolation**: Each app owner has separate wallet balance
3. **Transaction Tracking**: All IBData transactions are logged per app
4. **Deletion Protection**: Cannot accidentally remove default provider

## Future Enhancements

- [ ] Auto-fund app wallets via payment gateway
- [ ] Wallet balance alerts (SMS/email when low)
- [ ] Volume-based IBData discounts
- [ ] Provider performance analytics
- [ ] Automatic failover to backup providers

## Files Modified

### Backend
- ✅ `src/controllers/app_admin_provider.controller.ts`
- ✅ `src/services/providerRegistry.service.ts`
- ✅ `src/scripts/setup-default-ibdata-provider.ts` (NEW)

### Documentation
- ✅ `IBDATA_DEFAULT_PROVIDER.md` (This file)

## Testing

1. **Create New App**
   - Verify IBData appears in provider list automatically
   
2. **Fund Wallet**
   - Add ₦5,000 to VTFree wallet
   
3. **Make Purchase**
   - From app-template, buy ₦100 airtime
   - Verify it uses IBData
   - Check wallet deducted ₦100

4. **Try to Delete IBData**
   - Attempt to delete default provider
   - Verify error response

5. **Add Alternative Provider**
   - Add SMEPlug with API key
   - Set priority to 5
   - Verify it takes precedence over IBData

## Conclusion

IBData is now the **plug-and-play default provider** for all VTFree apps. App-admin users can start their business in minutes with zero technical configuration - just fund wallet and go! 🚀
