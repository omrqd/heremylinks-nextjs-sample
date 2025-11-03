# 🔧 Duplicate Transaction Fix Guide

## Problem
Transactions were being recorded twice in the database, causing:
- Doubled transaction counts
- Incorrect total spent calculations
- Duplicate records in billing history

## Root Cause
The issue occurred because of a race condition where:
1. The client-side verification API (`verify-session`) would record a transaction
2. The webhook API would also record the same transaction
3. Both used `.single()` query which throws errors instead of gracefully handling missing records

## Solutions Implemented

### 1. ✅ Improved Duplicate Detection Logic

**Changed in 3 files:**
- `/app/api/billing/verify-session/route.ts`
- `/app/api/billing/webhook/route.ts`
- `/app/api/billing/check-payment-status/route.ts`

**What changed:**
- Replaced `.single()` with `.maybeSingle()` to avoid errors when no records exist
- Added explicit error handling for the duplicate check
- Added detailed console logging to track transaction creation
- Added PostgreSQL duplicate error detection (error code 23505)

### 2. ✅ Database-Level Protection

**Added UNIQUE constraint on `external_id` column:**
- This prevents duplicates at the database level
- Even if application code has a race condition, the database will reject duplicates

### 3. ✅ Clean Up Existing Duplicates

**Created SQL script:** `FIX_DUPLICATES.sql`

## 🚀 How to Fix Your Current Database

### Step 1: Run the Cleanup Script

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the contents of `FIX_DUPLICATES.sql`
4. Run it

This will:
- ✅ Show you current duplicates
- ✅ Delete duplicate transactions (keeps oldest one)
- ✅ Add UNIQUE constraint
- ✅ Verify the fix

### Step 2: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 3: Test the Fix

1. **Create a new test user** (or use an existing non-premium user)
2. **Make a test payment** (use Stripe test cards)
3. **Check the billing page** - you should see only ONE transaction
4. **Check browser console** - you'll see detailed logs like:
   ```
   💾 Checking for existing transaction with ID: cs_test_...
   💾 No existing transaction found, creating new one
   ✅ Transaction created successfully with ID: 123...
   ```

## 🛡️ How It Prevents Future Duplicates

### Layer 1: Application Logic
```typescript
// Before inserting, check if transaction exists
const { data: existingTransaction } = await supabaseAdmin
  .from('billing_transactions')
  .select('id, external_id')
  .eq('external_id', session_id)
  .maybeSingle(); // Won't throw error if not found

if (existingTransaction) {
  console.log('Transaction already exists, skipping');
  return; // Skip insert
}
```

### Layer 2: Database Constraint
```sql
-- UNIQUE constraint prevents duplicates at DB level
ALTER TABLE billing_transactions 
ADD CONSTRAINT unique_external_id UNIQUE (external_id);
```

Even if two API calls happen at the exact same millisecond, the database will reject the second insert.

## 📊 Verification

After running the fix, your billing page should show:
- ✅ One transaction per payment
- ✅ Correct total spent ($14.99 for lifetime, not $29.98)
- ✅ Transaction count matches actual payments

## 🔍 Debugging

If you still see duplicates after the fix:

1. **Check the console logs** - look for:
   ```
   ✅ Transaction created successfully with ID: [id]
   ```
   Or:
   ```
   ℹ️ Transaction already exists with ID: [id] - Skipping insert
   ```

2. **Check Supabase logs** - Go to Supabase Dashboard > Logs > API

3. **Verify the constraint** - Run in SQL Editor:
   ```sql
   SELECT conname, contype 
   FROM pg_constraint 
   WHERE conrelid = 'billing_transactions'::regclass;
   ```
   You should see `unique_external_id` listed.

## 📝 What to Do If You Get Errors

### Error: "duplicate key value violates unique constraint"
✅ **This is GOOD!** It means the constraint is working and preventing duplicates.

### Error: "relation does not exist"
❌ You need to run the migration script first.

### Error: "column external_id contains null values"
❌ Run this first:
```sql
UPDATE billing_transactions 
SET external_id = CONCAT('legacy_', id::text) 
WHERE external_id IS NULL;
```

## 🎯 Summary

The duplicate transaction issue is now fixed with:
1. ✅ Better application logic (using `.maybeSingle()`)
2. ✅ Database-level protection (UNIQUE constraint)
3. ✅ Cleanup script for existing duplicates
4. ✅ Detailed logging for debugging

Your users will now see accurate billing information! 🎉

