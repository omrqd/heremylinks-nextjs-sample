-- Migration: Add premium_end_date column to users table
-- Description: Adds column to track when premium subscriptions expire (for promo codes and other premium grants)
-- Date: 2025-11-11

-- Add premium_end_date column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS premium_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for performance when checking expired premium users
CREATE INDEX IF NOT EXISTS idx_users_premium_end_date 
ON users(premium_end_date) 
WHERE premium_end_date IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.premium_end_date IS 'Date when premium subscription expires (NULL = no expiration or not premium)';

