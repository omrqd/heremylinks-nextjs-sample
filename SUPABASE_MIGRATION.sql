-- ============================================================
-- Supabase Migration: Add Premium & Billing Support
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Add premium fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_plan_type VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS premium_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium, premium_plan_type);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- Step 2: Create billing_transactions table
CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  plan_type VARCHAR(20) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'succeeded',
  event_type VARCHAR(100) DEFAULT NULL,
  external_id VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_billing_transactions_email ON billing_transactions(email);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_created_at ON billing_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_external_id ON billing_transactions(external_id);

-- Step 3: Enable Row Level Security
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for billing_transactions
CREATE POLICY "Users can view their own billing transactions" ON billing_transactions
  FOR SELECT USING (
    email IN (SELECT email FROM users WHERE auth.uid()::text = id::text)
  );

CREATE POLICY "Service role can insert billing transactions" ON billing_transactions
  FOR INSERT WITH CHECK (true);

-- Step 5: Grant permissions
GRANT ALL ON billing_transactions TO authenticated;
GRANT ALL ON billing_transactions TO service_role;

-- ============================================================
-- Verification: Run these to confirm migration success
-- ============================================================

-- Check users table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'is_premium', 
    'premium_plan_type', 
    'premium_started_at', 
    'premium_expires_at',
    'stripe_customer_id',
    'stripe_subscription_id'
  );

-- Check billing_transactions table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'billing_transactions';

-- ============================================================
-- Test Data (Optional - for development only)
-- ============================================================

-- Uncomment to create a test premium user
/*
UPDATE users 
SET 
  is_premium = TRUE,
  premium_plan_type = 'lifetime',
  premium_started_at = NOW(),
  premium_expires_at = NULL,
  stripe_customer_id = 'cus_test_123456789'
WHERE email = 'your-test-email@example.com';
*/

-- ============================================================
-- Success!
-- ============================================================
-- If no errors appeared above, your database is ready!
-- Next steps:
-- 1. Add Stripe keys to .env.local
-- 2. Restart your dev server
-- 3. Visit /dashboard/verified to test payments

