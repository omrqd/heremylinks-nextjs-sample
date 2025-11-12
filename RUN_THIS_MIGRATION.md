# 🚨 URGENT: Run This Migration to Fix Promo Codes

## Error
You're seeing this error when users try to redeem promo codes:
```
Could not find the 'premium_end_date' column of 'users' in the schema cache
```

## Fix
Run the SQL migration to add the missing column.

## Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Open your Supabase project** at https://supabase.com
2. **Go to SQL Editor** (left sidebar)
3. **Copy the SQL below** and paste it:

```sql
-- Add premium_end_date column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS premium_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_premium_end_date 
ON users(premium_end_date) 
WHERE premium_end_date IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.premium_end_date IS 'Date when premium subscription expires (NULL = no expiration or not premium)';
```

4. **Click "Run"** or press Cmd/Ctrl + Enter
5. **Verify success** - You should see "Success. No rows returned"

### Option 2: Command Line

If you have direct database access:

```bash
psql YOUR_DATABASE_URL < database/migrations/013_add_premium_end_date_column.sql
```

## Verify It Worked

1. **Try redeeming a promo code again**
2. **Check the terminal** - Error should be gone
3. **Check user's premium status** - Should show premium with end date

## What This Does

Adds a `premium_end_date` column to track when premium subscriptions expire:
- **Promo codes**: Sets expiration based on duration (e.g., 30 days from now)
- **Regular premium**: Can be NULL for permanent premium
- **Expired check**: System can check if premium has expired

---

**After running this, promo codes will work perfectly!** ✅

