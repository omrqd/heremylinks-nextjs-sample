# Promo Codes System Documentation

## Overview

A complete promo code system that allows administrators to create promotional codes that grant premium subscriptions to users. The system supports flexible redemption limits, user-specific codes, and comprehensive tracking.

## Features

### For Admins
- ✅ **Create Promo Codes** with customizable settings
- ✅ **Redemption Limits**: Unlimited, or specific number of uses
- ✅ **User-Specific Codes**: Assign codes to specific users by email
- ✅ **Flexible Duration**: Set premium duration (1 day, 30 days, etc.)
- ✅ **Expiration Dates**: Optional expiration for time-limited codes
- ✅ **Real-Time Monitoring**: See redemption counts and usage
- ✅ **Easy Management**: Delete codes with one click
- ✅ **Activity Logging**: All actions logged to admin_logs

### For Users
- ✅ **Easy Access**: "Promo Code" button in dashboard sidebar
- ✅ **Beautiful Modal**: Premium black-themed popup interface
- ✅ **Instant Redemption**: One-click activation
- ✅ **Clear Feedback**: Success/error messages with details
- ✅ **Auto-Uppercase**: Codes automatically converted to uppercase
- ✅ **Validation**: Comprehensive checks before redemption

## Database Schema

### Tables Created

#### 1. `promo_codes`
```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  premium_duration_days INTEGER NOT NULL,
  max_redemptions INTEGER DEFAULT NULL, -- NULL = infinite
  current_redemptions INTEGER DEFAULT 0,
  assigned_user_id UUID DEFAULT NULL, -- NULL = anyone
  created_by UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `promo_code_redemptions`
```sql
CREATE TABLE promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  premium_duration_days INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes
- `idx_promo_codes_code` - Fast code lookup
- `idx_promo_codes_is_active` - Filter active codes
- `idx_promo_codes_assigned_user` - User-specific codes
- `idx_unique_user_promo_redemption` - Prevent duplicate redemptions

## API Endpoints

### Admin Endpoints

#### GET `/api/admin/promos`
List all promo codes with statistics.

**Auth**: Admin required

**Response**:
```json
{
  "success": true,
  "promoCodes": [
    {
      "id": "uuid",
      "code": "SUMMER2025",
      "premium_duration_days": 30,
      "max_redemptions": 100,
      "current_redemptions": 45,
      "assigned_user_id": null,
      "created_by": "admin-uuid",
      "is_active": true,
      "expires_at": "2025-12-31T23:59:59Z",
      "created_at": "2025-11-11T10:00:00Z",
      "creator": {
        "id": "admin-uuid",
        "name": "Admin Name",
        "username": "admin",
        "email": "admin@example.com"
      },
      "assigned_user": null
    }
  ]
}
```

#### POST `/api/admin/promos`
Create a new promo code.

**Auth**: Admin required

**Request**:
```json
{
  "code": "WELCOME2025",
  "premiumDurationDays": 30,
  "maxRedemptions": 100, // or null for unlimited
  "assignedUserId": "user-uuid", // or null for anyone
  "expiresAt": "2025-12-31T23:59:59Z" // optional
}
```

**Response**:
```json
{
  "success": true,
  "promoCode": { /* promo code object */ },
  "message": "Promo code created successfully"
}
```

#### DELETE `/api/admin/promos/[id]`
Delete a promo code.

**Auth**: Admin required

**Response**:
```json
{
  "success": true,
  "message": "Promo code deleted successfully"
}
```

### User Endpoints

#### POST `/api/promos/redeem`
Redeem a promo code.

**Auth**: User session required

**Request**:
```json
{
  "code": "WELCOME2025"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Promo code redeemed! You now have premium for 30 days.",
  "premiumDurationDays": 30,
  "premiumEndDate": "2025-12-11T10:00:00Z"
}
```

**Error Responses**:
- `400` - Already premium, invalid code, already redeemed, etc.
- `403` - Code not assigned to this user
- `404` - Code not found

## Validation Rules

### Code Creation
1. Code must be unique
2. Premium duration must be at least 1 day
3. Max redemptions must be at least 1 or null (unlimited)
4. If assigned to user, user must exist in database

### Code Redemption
1. ✅ User must be authenticated
2. ✅ User must NOT already be premium
3. ✅ Code must be active
4. ✅ Code must not be expired
5. ✅ Code must have redemptions remaining
6. ✅ Code must be assigned to user (if user-specific)
7. ✅ User must not have already redeemed this code

## Usage Guide

### For Admins

#### Creating a Promo Code

1. **Navigate** to `/admin` dashboard
2. **Click** "Promo Codes" in the sidebar
3. **Click** "Create Promo Code" button
4. **Fill in the form**:
   - **Code**: Enter the promo code (e.g., "SUMMER2025")
   - **Duration**: Select or enter days (quick buttons: 1 day, 1 week, 1 month, 3 months, 1 year)
   - **Redemption Limit**: Choose "Unlimited" or "Limited" with a number
   - **Assign to User**: (Optional) Enter user email to restrict code
   - **Expiration**: (Optional) Set expiration date
5. **Click** "Create Promo Code"

#### Monitoring Promo Codes

The promo codes table shows:
- **Code**: The promo code string
- **Duration**: How many days of premium it grants
- **Redemptions**: Current / Max (or ∞ for unlimited)
- **Assigned To**: User email or "Anyone"
- **Status**: Active, Expired, or Used Up
- **Created**: Date and creator info

#### Deleting a Promo Code

1. **Find** the promo code in the table
2. **Click** the trash icon
3. **Confirm** deletion
4. **Note**: This will cascade delete all redemption records

### For Users

#### Redeeming a Promo Code

1. **Navigate** to `/dashboard`
2. **Click** "Promo Code" in the sidebar (before "Help Center")
3. **Enter** your promo code in the popup modal
4. **Click** "Redeem Code" or press Enter
5. **Wait** for confirmation
6. **Success**: Page will automatically refresh to show premium status

#### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "You already have an active premium subscription" | User is already premium | Wait for current premium to expire |
| "Invalid or inactive promo code" | Code doesn't exist or is inactive | Check the code spelling |
| "This promo code has expired" | Code passed its expiration date | Contact admin for new code |
| "This promo code is not available for your account" | Code is assigned to different user | Use a different code |
| "You have already redeemed this promo code" | User already used this code | Each code can only be used once per user |
| "This promo code has reached its redemption limit" | All redemptions used up | Contact admin for new code |

## Example Scenarios

### Scenario 1: Limited-Time Campaign
```
Code: BLACKFRIDAY2025
Duration: 90 days (3 months)
Max Redemptions: 1000
Assigned To: Anyone
Expires: 2025-11-30
```
First 1000 users who redeem before Nov 30 get 3 months premium.

### Scenario 2: Influencer Partnership
```
Code: INFLUENCER-OMAR
Duration: 365 days (1 year)
Max Redemptions: Unlimited
Assigned To: Anyone
Expires: None
```
Anyone can use this code for 1 year premium, unlimited times.

### Scenario 3: Customer Support Comp
```
Code: COMP-USER123
Duration: 30 days
Max Redemptions: 1
Assigned To: user@example.com
Expires: 2025-12-31
```
Specific compensation for one user, single use.

### Scenario 4: Beta Tester Reward
```
Code: BETATESTER2025
Duration: 180 days (6 months)
Max Redemptions: 50
Assigned To: Anyone
Expires: 2025-12-01
```
First 50 beta testers get 6 months premium.

## Technical Implementation

### Files Created
1. **Migration**: `database/migrations/012_add_promo_codes_system.sql`
2. **Admin API**: `app/api/admin/promos/route.ts`
3. **Admin Delete API**: `app/api/admin/promos/[id]/route.ts`
4. **Redeem API**: `app/api/promos/redeem/route.ts`
5. **Admin Page**: `app/admin/promos/page.tsx`

### Files Modified
1. **Admin Dashboard**: `app/admin/page.tsx` - Added "Promo Codes" nav link
2. **User Dashboard**: `app/dashboard/page.tsx` - Added "Promo Code" button and modal

### Premium Grant Logic
When a user redeems a code:
1. User record updated:
   - `is_premium = true`
   - `premium_started_at = NOW()`
   - `premium_plan_type = 'promo'`
   - `premium_end_date = NOW() + duration`
2. Redemption recorded in `promo_code_redemptions`
3. Promo code `current_redemptions` incremented
4. Admin log created

### Security Measures
- All admin endpoints check for admin role
- User redemption endpoint requires authentication
- Unique constraint prevents duplicate redemptions
- Codes are case-insensitive (stored as uppercase)
- Atomic transactions ensure data consistency

## Best Practices

### Code Naming
- ✅ **Good**: `SUMMER2025`, `WELCOME-NEW`, `FRIEND-50OFF`
- ❌ **Avoid**: `abc123`, `test`, `code1`

### Duration Selection
- **1 day**: Testing purposes
- **7 days**: Trial period
- **30 days**: Monthly promotion
- **90 days**: Seasonal campaign
- **365 days**: Annual reward

### Redemption Limits
- **1**: One-time use (e.g., customer support)
- **100-1000**: Marketing campaigns
- **Unlimited**: Influencer partnerships, ongoing promotions

### Expiration Dates
- Set expiration for time-limited campaigns
- Leave blank for ongoing codes
- Consider timezone when setting dates

## Monitoring & Analytics

### Key Metrics to Track
1. **Redemption Rate**: current_redemptions / max_redemptions
2. **Popular Codes**: Codes with highest redemptions
3. **User Acquisition**: New premium users via promos
4. **Code Lifespan**: Time from creation to full redemption
5. **Conversion Rate**: Views vs. redemptions

### Admin Logs
All actions are logged in `admin_logs`:
- Promo code creation
- Promo code deletion
- Track who created which codes

## Troubleshooting

### Code Not Working
1. Check code is active (`is_active = true`)
2. Check code hasn't expired
3. Check redemption limit hasn't been reached
4. Verify user isn't already premium
5. If user-specific, verify correct user

### Database Issues
```sql
-- Check promo code details
SELECT * FROM promo_codes WHERE code = 'YOUR-CODE';

-- Check redemptions for a code
SELECT * FROM promo_code_redemptions 
WHERE promo_code_id = 'code-uuid';

-- Check user's redemptions
SELECT * FROM promo_code_redemptions 
WHERE user_id = 'user-uuid';
```

### Reset User's Redemption (if needed)
```sql
-- Remove user's redemption (use with caution!)
DELETE FROM promo_code_redemptions
WHERE promo_code_id = 'code-uuid' AND user_id = 'user-uuid';

-- Decrement redemption count
UPDATE promo_codes 
SET current_redemptions = current_redemptions - 1
WHERE id = 'code-uuid';
```

## Future Enhancements

Potential improvements:
- [ ] Discount codes for payments (not just free premium)
- [ ] Promo code analytics dashboard
- [ ] Bulk code generation
- [ ] CSV import/export
- [ ] Auto-apply codes from URL parameters
- [ ] Referral system integration
- [ ] Email notifications when code is used
- [ ] A/B testing different code strategies

---

**Version**: 1.0.0  
**Date**: November 11, 2025  
**Status**: ✅ Fully Implemented and Ready to Use

