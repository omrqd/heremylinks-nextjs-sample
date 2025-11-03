# 🚀 Quick Setup Guide - Stripe Premium Payments

## ✅ Steps to Get Started (5 minutes)

### 1. Run the Supabase Migration

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `SUPABASE_MIGRATION.sql`
6. Click **Run** or press `Ctrl+Enter`

You should see success messages and no errors!

### 2. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 3. Add Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Payment Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_paste_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_paste_your_publishable_key_here
```

### 4. Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 5. Test the Payment Flow! 🎉

1. Visit: `http://localhost:3000/dashboard/verified`
2. Click **"Start Monthly Plan"** or **"Get Lifetime Access"**
3. Use this test card:
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)
4. Complete the checkout
5. You should see the **PRO badge** appear next to your logo! ✨

## 🎨 What You'll See

### Before Payment
- Regular dashboard without PRO badge
- "Get Premium" button in sidebar
- Free plan features

### After Payment
- **Beautiful PRO badge** next to logo (animated gradient!)
- Premium plan shown in `/dashboard/billing`
- Transaction history displayed
- Cancel subscription option (for monthly)

## 📱 Pages Updated

- **`/dashboard`** - Shows PRO badge when premium
- **`/dashboard/verified`** - Premium purchase page (2 plans)
- **`/dashboard/billing`** - View plan status & billing history

## 🧪 Test Card Numbers

All these work in Stripe test mode:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Success (default) |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0025 0000 3155` | Requires authentication |

## 💡 Troubleshooting

### Issue: "Module not found: stripe"
**Solution**: Run `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`

### Issue: PRO badge not showing after payment
**Check**:
1. Look at Network tab - verify `/api/billing/verify-session` returns success
2. Check database: `SELECT is_premium, premium_plan_type FROM users WHERE email = 'your@email.com'`
3. Refresh the page

### Issue: Stripe keys not working
**Check**:
1. Make sure you're using **test mode** keys (start with `pk_test_` and `sk_test_`)
2. Verify keys are in `.env.local` (not `.env`)
3. Restart dev server after adding keys

### Issue: Payment succeeds but database not updated
**Check**:
1. Open browser DevTools → Network tab
2. Look for the `/api/billing/verify-session` call
3. Check the response for errors
4. Verify Supabase migration ran successfully

## 🎯 Next Steps After Testing

Once you confirm payments work:

1. **For Production**: Switch to live Stripe keys (start with `pk_live_` and `sk_live_`)
2. **Optional**: Set up Stripe webhooks for more reliability
3. **Recommended**: Add custom domain support for premium users
4. **Enhancement**: Create premium themes/templates

## 📊 Database Structure

### Users Table (New Fields)
- `is_premium` - Boolean (true for premium users)
- `premium_plan_type` - 'monthly' or 'lifetime'
- `premium_started_at` - When premium was activated
- `premium_expires_at` - NULL for lifetime, date for monthly
- `stripe_customer_id` - Stripe customer reference
- `stripe_subscription_id` - Subscription ID (monthly only)

### Billing Transactions Table
- Records all payments
- Linked to user by email
- Tracks amount, status, plan type
- Stores Stripe transaction IDs

## 🔒 Security Notes

✅ Session verification prevents unauthorized premium activation
✅ Email validation ensures session belongs to user
✅ Payment status verified before granting premium
✅ Row Level Security (RLS) enabled on all tables
✅ Transactions logged for auditing

## 📞 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check the terminal/server logs
3. Verify environment variables are set correctly
4. Ensure Supabase migration ran successfully
5. Test with different browsers/incognito mode

---

**Ready to test?** Run `npm run dev` and visit `/dashboard/verified`! 🚀

