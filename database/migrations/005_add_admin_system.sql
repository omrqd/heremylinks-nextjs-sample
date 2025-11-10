-- Migration: Add Admin System
-- This adds admin functionality to the users table

-- Add admin fields to users table
ALTER TABLE users 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_role VARCHAR(50) DEFAULT NULL,
ADD COLUMN admin_permissions TEXT DEFAULT NULL,
ADD COLUMN admin_created_at TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN admin_created_by VARCHAR(255) DEFAULT NULL;

-- Add index for faster admin queries
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- Create admin_logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_user_email VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_logs_email (admin_email),
  INDEX idx_admin_logs_created_at (created_at DESC)
);

-- Comments for documentation
COMMENT ON COLUMN users.is_admin IS 'Whether user has admin access';
COMMENT ON COLUMN users.admin_role IS 'Admin role: master_admin, user_manager, payment_manager, notification_manager, etc.';
COMMENT ON COLUMN users.admin_permissions IS 'JSON string of specific permissions';
COMMENT ON TABLE admin_logs IS 'Audit log of all admin actions';

