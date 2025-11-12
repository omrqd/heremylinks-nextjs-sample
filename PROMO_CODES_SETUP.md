# Promo Codes System - Quick Setup Guide

## 🚀 Setup Steps

### 1. Run Database Migration

Execute the SQL migration to create the necessary tables:

```bash
# Using Supabase SQL Editor (Recommended)
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy contents of database/migrations/012_add_promo_codes_system.sql
4. Paste and run in SQL Editor
```

Or via command line:
```bash
psql YOUR_DATABASE_URL < database/migrations/012_add_promo_codes_system.sql
```

### 2. Verify Database Tables

Check that tables were created:
```sql
-- Check promo_codes table
SELECT * FROM promo_codes LIMIT 1;

-- Check promo_code_redemptions table
SELECT * FROM promo_code_redemptions LIMIT 1;
```

### 3. Test the System

#### For Admins:
1. Navigate to `/admin`
2. Click "Promo Codes" in sidebar
3. Create a test promo code:
   - Code: `TEST2025`
   - Duration: 30 days
   - Redemption: Unlimited
4. Verify it appears in the list

#### For Users:
1. Log out and log in as a regular (non-premium) user
2. Go to `/dashboard`
3. Click "Promo Code" in sidebar
4. Enter `TEST2025`
5. Click "Redeem Code"
6. Verify success message
7. Verify premium status is now active

## 📋 Checklist

- [ ] Database migration completed successfully
- [ ] Admin can access `/admin/promos` page
- [ ] Admin can create promo codes
- [ ] Admin can see promo codes in table
- [ ] Admin can delete promo codes
- [ ] Users can see "Promo Code" button in dashboard
- [ ] Users can open promo modal
- [ ] Users can redeem valid codes
- [ ] Premium status updates correctly
- [ ] Error messages show for invalid codes
- [ ] Already premium users get error message
- [ ] Redemption counts increment correctly

## 🎯 Quick Test Scenarios

### Test 1: Create and Redeem Unlimited Code
```
Admin:
1. Create code "UNLIMITED2025", 30 days, unlimited redemptions
2. Verify creation success

User 1:
1. Redeem "UNLIMITED2025"
2. Verify premium granted

User 2:
1. Redeem "UNLIMITED2025"
2. Verify premium granted
3. Verify both users can use same code
```

### Test 2: Limited Redemption Code
```
Admin:
1. Create code "LIMITED5", 7 days, max 1 redemption

User 1:
1. Redeem "LIMITED5"
2. Verify success

User 1 (again):
1. Try to redeem "LIMITED5" again
2. Verify error: "already redeemed"

User 2:
1. Try to redeem "LIMITED5"
2. Verify error: "reached redemption limit"
```

### Test 3: User-Specific Code
```
Admin:
1. Create code "SPECIFIC", 30 days, unlimited, assigned to test@example.com

User (test@example.com):
1. Redeem "SPECIFIC"
2. Verify success

User (different email):
1. Try to redeem "SPECIFIC"
2. Verify error: "not available for your account"
```

### Test 4: Premium User Validation
```
User (already premium):
1. Try to redeem any valid code
2. Verify error: "already have premium subscription"
```

## 🐛 Troubleshooting

### Issue: "Admin access required"
**Solution**: Ensure your user has `is_admin = true` in the database

### Issue: "Promo Codes" not showing in admin sidebar
**Solution**: 
1. Clear browser cache
2. Restart dev server
3. Check console for errors

### Issue: "Promo Code" button not showing in user dashboard
**Solution**:
1. Check `app/dashboard/page.tsx` for the button
2. Clear browser cache
3. Restart dev server

### Issue: Modal not appearing
**Solution**:
1. Check browser console for errors
2. Verify `showPromoModal` state is being set
3. Check z-index conflicts with other modals

### Issue: Code redemption not granting premium
**Solution**:
1. Check API response in Network tab
2. Verify `premium_end_date` is being calculated
3. Check user record in database: `SELECT * FROM users WHERE email = 'user@example.com'`

### Issue: TypeScript errors
**Solution**:
```bash
# Run TypeScript check
npx tsc --noEmit

# If errors persist, check the error messages and fix accordingly
```

## 📖 Additional Resources

- Full Documentation: `PROMO_CODES_SYSTEM.md`
- Database Schema: `database/migrations/012_add_promo_codes_system.sql`
- Admin API: `app/api/admin/promos/route.ts`
- Redeem API: `app/api/promos/redeem/route.ts`

## ✅ You're Ready!

Once all checklist items are complete, your promo code system is fully operational!

**Next Steps**:
1. Create your first real promo code
2. Share it with users
3. Monitor redemptions in `/admin/promos`
4. Track premium user growth

---

**Need Help?** Check the full documentation in `PROMO_CODES_SYSTEM.md`

