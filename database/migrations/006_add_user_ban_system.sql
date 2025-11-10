-- ************************************************************
-- Migration: Add User Ban System
-- Description: Adds fields to support user banning functionality
-- ************************************************************

-- Add ban-related fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for faster ban checks
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned) WHERE is_banned = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN users.is_banned IS 'Whether the user is currently banned from the platform';
COMMENT ON COLUMN users.ban_reason IS 'Custom message explaining why the user was banned';
COMMENT ON COLUMN users.banned_at IS 'Timestamp when the user was banned';
COMMENT ON COLUMN users.banned_by IS 'Admin user ID who banned this user';

