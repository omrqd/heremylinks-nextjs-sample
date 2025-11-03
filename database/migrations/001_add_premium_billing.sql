-- Migration: Add Premium and Billing Support
-- Date: 2025-11-03
-- Description: Adds premium subscription fields to users table and creates billing_transactions table

-- ============================================================
-- Step 1: Add premium fields to users table
-- ============================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE AFTER is_verified,
ADD COLUMN IF NOT EXISTS premium_plan_type VARCHAR(20) DEFAULT NULL COMMENT 'monthly or lifetime' AFTER is_premium,
ADD COLUMN IF NOT EXISTS premium_started_at TIMESTAMP NULL DEFAULT NULL AFTER premium_plan_type,
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP NULL DEFAULT NULL COMMENT 'NULL for lifetime, future date for monthly' AFTER premium_started_at,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) DEFAULT NULL AFTER premium_expires_at,
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) DEFAULT NULL COMMENT 'For monthly subscriptions' AFTER stripe_customer_id;

-- Add indexes for premium fields
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium, premium_plan_type);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);

-- ============================================================
-- Step 2: Create billing_transactions table
-- ============================================================

CREATE TABLE IF NOT EXISTS billing_transactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL,
  plan_type VARCHAR(20) NOT NULL COMMENT 'monthly or lifetime',
  amount DECIMAL(10,2) NOT NULL COMMENT 'Amount in dollars (e.g., 3.99 or 14.99)',
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'succeeded' COMMENT 'succeeded, pending, failed, refunded',
  event_type VARCHAR(100) DEFAULT NULL COMMENT 'Stripe event type',
  external_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe payment/session ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_external_id (external_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Verification Queries
-- ============================================================

-- Verify users table has new columns
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
  AND COLUMN_NAME IN (
    'is_premium', 
    'premium_plan_type', 
    'premium_started_at', 
    'premium_expires_at',
    'stripe_customer_id',
    'stripe_subscription_id'
  );

-- Verify billing_transactions table exists
SHOW TABLES LIKE 'billing_transactions';

-- ============================================================
-- Sample Test Data (Optional - for development only)
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
WHERE email = 'your-test-email@example.com'
LIMIT 1;
*/

-- ============================================================
-- Rollback Instructions (if needed)
-- ============================================================

/*
-- To rollback this migration, run:

DROP TABLE IF EXISTS billing_transactions;

ALTER TABLE users 
DROP COLUMN IF EXISTS stripe_subscription_id,
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS premium_expires_at,
DROP COLUMN IF EXISTS premium_started_at,
DROP COLUMN IF EXISTS premium_plan_type,
DROP COLUMN IF EXISTS is_premium;
*/

