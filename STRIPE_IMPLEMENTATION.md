# Stripe Premium Payment Implementation

This document explains the complete Stripe payment implementation for HereMyLinks premium subscriptions.

## Overview

The system supports two premium payment options:
- **Monthly Subscription**: $3.99/month (recurring, can be cancelled)
- **Lifetime Access**: $14.99 (one-time payment)

Both plans provide the same premium benefits:
- Premium themes
- Custom domains
- Advanced analytics
- Priority support
- Unlimited links

## Database Schema

### Updated `users` Table Fields

The following fields have been added to the `users` table:

```sql
is_premium BOOLEAN DEFAULT FALSE
premium_plan_type VARCHAR(20) DEFAULT NULL -- 'monthly' or 'lifetime'
premium_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
premium_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL -- NULL for lifetime
stripe_customer_id VARCHAR(255) DEFAULT NULL
stripe_subscription_id VARCHAR(255) DEFAULT NULL -- For monthly subscriptions
```

### `billing_transactions` Table

Tracks all payment transactions:

```sql
CREATE TABLE billing_transactions (
  id UUID PRIMARY KEY
  email VARCHAR(255) NOT NULL
  plan_type VARCHAR(20) NOT NULL -- 'monthly' or 'lifetime'
  amount NUMERIC(10,2) NOT NULL -- In dollars (3.99 or 14.99)
  currency VARCHAR(3) DEFAULT 'usd'
  status VARCHAR(50) DEFAULT 'succeeded'
  event_type VARCHAR(100) DEFAULT NULL
  external_id VARCHAR(255) DEFAULT NULL -- Stripe session/payment ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
```

## Webhook Alternative Implementation

Instead of running Stripe webhooks locally, we use a **session verification approach**:

### How It Works

1. **User clicks "Get Premium"** → redirected to Stripe Checkout
2. **Payment completes** → Stripe redirects to success URL with `session_id`
3. **Success page verifies session** → calls `/api/billing/verify-session`
4. **Server validates payment** → updates database
5. **User redirected to billing page** → sees premium status

### Key API Routes

#### 1. Create Checkout Session
**File**: `/app/api/billing/create-checkout-session/route.ts`

Creates a Stripe checkout session and returns the URL.

```typescript
POST /api/billing/create-checkout-session
Body: { plan: 'monthly' | 'lifetime' }
Response: { url: string }
```

#### 2. Verify Session (Webhook Alternative)
**File**: `/app/api/billing/verify-session/route.ts`

Verifies the payment was successful and updates the database.

```typescript
POST /api/billing/verify-session
Body: { session_id: string }
Response: { success: boolean, plan_type: string, expires_at: string | null }
```

**What it does**:
- Retrieves the Stripe checkout session
- Verifies the user owns the session
- Checks payment status is 'paid'
- Updates user premium status
- Records transaction in billing_transactions table

#### 3. Cancel Subscription
**File**: `/app/api/billing/cancel-subscription/route.ts`

Cancels a monthly subscription at the end of the billing period.

```typescript
POST /api/billing/cancel-subscription
Response: { success: boolean, message: string, period_end: number }
```

#### 4. Get Transactions
**File**: `/app/api/billing/transactions/route.ts`

Fetches user's billing history.

```typescript
GET /api/billing/transactions
Response: { transactions: Array }
```

## Frontend Components

### 1. Premium Purchase Page
**File**: `/app/dashboard/verified/page.tsx`

Features:
- Beautiful pricing cards for both plans
- Payment success verification
- Automatic redirect after successful payment
- Error handling

### 2. Billing Page
**File**: `/app/dashboard/billing/page.tsx`

Features:
- Shows current plan status (Free/Premium/Lifetime)
- Displays billing history
- Monthly subscription cancellation
- Success/error message handling
- Transaction list with status badges

### 3. PRO Badge
**File**: `/app/dashboard/components/Sidebar.tsx` & `/app/dashboard/page.tsx`

A beautiful animated PRO badge appears next to the logo when user has premium:
- Gradient background (purple)
- Pulsing animation
- Shine effect
- Only shows for premium users

## Environment Variables Required

Add these to your `.env` or `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (optional, only if using webhooks)
```

## Setup Instructions

### 1. Run Database Migration

Apply the updated schema to your database:

**For Supabase:**
```bash
# Run the SQL in Supabase SQL Editor
cat database/supabase-schema.sql
```

**For MySQL:**
```sql
-- Add the premium fields to users table
ALTER TABLE users 
ADD COLUMN is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN premium_plan_type VARCHAR(20) DEFAULT NULL,
ADD COLUMN premium_started_at TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN premium_expires_at TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN stripe_subscription_id VARCHAR(255) DEFAULT NULL;

-- Create billing_transactions table
CREATE TABLE billing_transactions (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  plan_type VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'succeeded',
  event_type VARCHAR(100) DEFAULT NULL,
  external_id VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_external_id (external_id)
);
```

### 2. Configure Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys (test mode for development)
3. Add them to your environment variables
4. *Optional*: Set up webhook endpoint at `/api/billing/webhook` for production

### 3. Test Payment Flow

#### Test Mode Credit Cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Use any future expiry date and any CVC

#### Test Flow:
1. Navigate to `/dashboard/verified`
2. Click "Start Monthly Plan" or "Get Lifetime Access"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify redirect and PRO badge appears

## Payment Flow Diagram

```
User Dashboard
    ↓
Get Premium Button
    ↓
/dashboard/verified
    ↓
Click Plan → Create Checkout Session
    ↓
Stripe Checkout Page
    ↓
Payment Success → Redirect with session_id
    ↓
/dashboard/verified?session_id=...
    ↓
Verify Session API (validates & updates DB)
    ↓
Redirect to /dashboard/billing?success=true
    ↓
PRO Badge Shows + Premium Features Active
```

## Security Considerations

### 1. Session Verification
- Always verify the session belongs to the authenticated user
- Check email matches before applying premium status
- Validate payment status is 'paid'

### 2. Subscription Validation
- Store subscription IDs for monthly plans
- Check expiry dates on each request
- Handle subscription cancellations gracefully

### 3. Transaction Recording
- Always log transactions for auditing
- Store Stripe IDs for reference
- Track payment status changes

## Production Deployment

### Option 1: Session Verification (Current Implementation)
✅ **No webhook setup required**
✅ Works on localhost and any environment
✅ Simpler deployment
⚠️ User must complete redirect flow

### Option 2: Add Webhooks (Recommended for Production)
✅ More reliable
✅ Handles edge cases (user closes browser)
✅ Real-time updates
⚠️ Requires public HTTPS endpoint

To add webhooks:
1. Keep existing verification endpoint
2. Configure `/api/billing/webhook` in Stripe Dashboard
3. Webhook handles: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`

## Troubleshooting

### PRO Badge Not Showing
1. Check database: `SELECT is_premium FROM users WHERE email = 'user@example.com'`
2. Verify API response includes premium fields
3. Check browser console for errors

### Payment Not Processing
1. Check Stripe Dashboard → Payments
2. Verify webhook secret if using webhooks
3. Check API logs for verify-session errors
4. Ensure session_id is in URL

### Subscription Not Cancelling
1. Check user has `stripe_subscription_id`
2. Verify plan type is 'monthly'
3. Check Stripe Dashboard for subscription status

## Testing Checklist

- [ ] Monthly subscription purchase
- [ ] Lifetime purchase
- [ ] PRO badge appears after payment
- [ ] Billing page shows correct plan
- [ ] Transaction history displays
- [ ] Monthly subscription cancellation
- [ ] Premium features accessible
- [ ] Session verification works
- [ ] Error handling for failed payments
- [ ] Redirect flow completes

## Future Enhancements

1. **Proration**: Handle plan upgrades/downgrades
2. **Invoices**: Download PDF invoices
3. **Refunds**: Admin panel for refunds
4. **Coupons**: Promotional codes
5. **Trials**: Free trial period
6. **Usage Limits**: Enforce premium features
7. **Webhooks**: Add for production reliability
8. **Email Receipts**: Send transaction confirmations

## Support

For issues or questions:
1. Check Stripe Dashboard logs
2. Review server API logs
3. Test with Stripe test cards
4. Verify database schema matches
5. Check environment variables

---

**Last Updated**: November 3, 2025
**Implementation Version**: 1.0

