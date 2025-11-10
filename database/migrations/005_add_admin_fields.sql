-- Migration: Add Admin User Fields
-- Created: 2025-11-08
-- Purpose: Add admin functionality to users table

-- Add admin fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_role VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_permissions TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_created_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_created_by UUID DEFAULT NULL;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN users.is_admin IS 'Whether user has admin access';
COMMENT ON COLUMN users.admin_role IS 'Admin role: master_admin, user_manager, payment_manager, notification_manager, etc.';
COMMENT ON COLUMN users.admin_permissions IS 'JSON array of specific permissions';
COMMENT ON COLUMN users.admin_created_at IS 'When admin privileges were granted';
COMMENT ON COLUMN users.admin_created_by IS 'UUID of admin who granted privileges';

-- Admin roles:
-- master_admin: Full access to everything
-- user_manager: Can view/edit/delete users
-- payment_manager: Can view payments and transactions
-- notification_manager: Can send notifications and emails
-- content_manager: Can manage site content
-- analytics_viewer: Can view analytics only

