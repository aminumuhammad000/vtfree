# Referral Program Implementation

## Overview
A professional referral reward system has been implemented. Referral bonuses are awarded to users **only after their referred friend completes their first successful transaction**, preventing abuse and ensuring active user engagement.

## Features Implemented

### 1. Backend Implementation

#### Database Models
- **CreatedApp Model** (`created_app.model.ts`):
  - Added `referral_settings` field with:
    - `enabled`: Boolean to enable/disable the referral program
    - `amount`: Reward amount in NGN

- **User Model** (`user.model.ts`):
  - Added `referral_bonus_claimed`: Tracks if user has triggered their referrer's bonus

- **Transaction Model** (`transaction.model.ts`):
  - Added `referral_bonus` to transaction types

#### Services
- **ReferralService** (`referral.service.ts`):
  - `processFirstTransactionReferral(userId)`: Automatically processes and awards referral bonus
  - Checks if:
    - User was referred by someone
    - Referral program is enabled for the app
    - Bonus hasn't been claimed yet
  - Credits referrer's wallet and creates transaction record
  - Marks bonus as claimed to prevent duplicates

- **WalletService** (`wallet.service.ts`):
  - Enhanced `credit()` method to:
    - Create transaction records
    - Support referral_bonus transaction type
    - Include app_id tracking

#### Controllers
- **BillPaymentController** (`billpayment.controller.ts`):
  - Integrated referral processing in:
    - `purchaseAirtime()`: After successful airtime purchase
    - `purchaseData()`: After successful data purchase
  - Automatically triggers `ReferralService.processFirstTransactionReferral()` on first successful transaction

- **AppConfigController** (`app_config.controller.ts`):
  - Added `REFERRAL_ENABLED` and `REFERRAL_AMOUNT` config keys
  - Supports reading and updating referral settings

### 2. App-Admin Frontend

#### Components
- **ReferralSettings** (`ReferralSettings.tsx`):
  - Professional UI to manage referral program
  - Toggle to enable/disable program
  - Input field to set reward amount (NGN)
  - Syncs with backend API

#### Settings Page
- Added "Referral" tab in Settings page
- Placed alongside Email, Payment, and System tabs
- Consistent design with existing settings sections

### 3. Features for End Users

#### Existing Referrals Screen (`referrals.tsx`):
- Shows referral statistics
- Lists referred users
- Displays referral status

## How It Works

### User Journey

1. **User A signs up** with referral code from User B
   - System stores `referred_by` relationship
   - No bonus awarded yet

2. **User A completes first successful transaction**
   - System detects this is User A's first successful transaction
   - Checks if referral program is enabled
   - Credits User B's wallet with configured amount
   - Creates `referral_bonus` transaction record
   - Marks User A's bonus as claimed

3. **User B receives reward**
   - Wallet automatically credited
   - Transaction appears in history
   - Can view referral in "My Referrals" screen

### Admin Configuration

1. Login to app-admin dashboard
2. Navigate to Settings → Referral tab
3. Enable/disable the program
4. Set reward amount (e.g., ₦500)
5. Save settings

## Technical Details

### Transaction Flow
```
User Signup (with referral_code)
    ↓
First Successful Transaction
    ↓
ReferralService.processFirstTransactionReferral()
    ↓
- Check if user.referred_by exists
- Check if user.referral_bonus_claimed is false
- Check if app.referral_settings.enabled is true
- Check if app.referral_settings.amount > 0
    ↓
WalletService.credit(referrer_id, amount, 'Referral Bonus', 'referral_bonus')
    ↓
- Create transaction record
- Update user.referral_bonus_claimed = true
    ↓
Referrer receives reward!
```

### Security Features
- **One-time bonus**: `referral_bonus_claimed` flag prevents duplicate rewards
- **Transaction validation**: Only successful transactions trigger bonus
- **App-specific**: Settings are isolated per app
- **Amount validation**: Checks for valid amount > 0

### Database Schema Updates

```typescript
// CreatedApp
referral_settings: {
  enabled: boolean;    // default: false
  amount: number;      // default: 0
}

// User  
referral_bonus_claimed: boolean;  // default: false

// Transaction
type: 'referral_bonus' | 'airtime_topup' | 'data_purchase' | ...
```

## API Endpoints

### Get Referral Config
```
GET /api/app-admin/config
Response includes:
- REFERRAL_ENABLED: 'true' | 'false'
- REFERRAL_AMOUNT: string (e.g., '500')
```

### Update Referral Config
```
PUT /api/app-admin/config/REFERRAL_ENABLED
Body: { value: 'true' }

PUT /api/app-admin/config/REFERRAL_AMOUNT  
Body: { value: '500' }
```

## Testing

### Test Scenario 1: Basic Referral
1. User A signs up (generates referral code ABC123)
2. User B signs up with referral code ABC123
3. User B makes first successful airtime/data purchase
4. ✅ User A receives ₦X reward

### Test Scenario 2: Duplicate Prevention
1. User B makes second transaction
2. ✅ User A does NOT receive another reward

### Test Scenario 3: Disabled Program
1. Admin disables referral program
2. User C signs up with referral
3. User C makes first transaction
4. ✅ NO reward given

## Future Enhancements (Optional)

1. **Tiered Rewards**: Different amounts based on transaction value
2. **Referral Leaderboard**: Show top referrers
3. **Time Limits**: Bonus only valid within X days of signup
4. **Minimum Transaction**: Require transaction > ₦X to qualify
5. **Referee Bonus**: Give bonus to both referrer AND referee
6. **Analytics Dashboard**: Track referral conversion rates

## Files Modified/Created

### Backend
- ✅ `src/models/created_app.model.ts`
- ✅ `src/models/user.model.ts`
- ✅ `src/models/transaction.model.ts`
- ✅ `src/services/referral.service.ts` (NEW)
- ✅ `src/services/wallet.service.ts`
- ✅ `src/controllers/auth.controller.ts`
- ✅ `src/controllers/billpayment.controller.ts`
- ✅ `src/controllers/config/app_config.controller.ts`

### App-Admin
- ✅ `src/components/ReferralSettings.tsx` (NEW)
- ✅ `src/pages/Settings.tsx`

### App-Template
- ✅ `app/referrals.tsx` (Already exists - user can view their referrals)

## Conclusion

This referral program is production-ready with:
- ✅ Professional admin interface
- ✅ Automated bonus processing
- ✅ Fraud prevention (one-time rewards)
- ✅ Transaction tracking
- ✅ App-specific configuration
- ✅ User-friendly referral screens

The system rewards active user acquisition while preventing abuse through the first-transaction requirement.
