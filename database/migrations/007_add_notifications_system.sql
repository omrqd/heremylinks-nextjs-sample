-- ************************************************************
-- Migration: Add Notifications System
-- Description: Create notifications table for user notifications
-- ************************************************************

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  link VARCHAR(500) DEFAULT NULL, -- Optional link/action
  is_read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE, -- Track if email was sent
  created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who sent it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'User notifications from admins';
COMMENT ON COLUMN notifications.user_id IS 'User who receives the notification';
COMMENT ON COLUMN notifications.title IS 'Notification title/subject';
COMMENT ON COLUMN notifications.message IS 'Notification message body';
COMMENT ON COLUMN notifications.type IS 'Notification type (info, success, warning, error)';
COMMENT ON COLUMN notifications.link IS 'Optional link for call-to-action';
COMMENT ON COLUMN notifications.is_read IS 'Whether user has read the notification';
COMMENT ON COLUMN notifications.email_sent IS 'Whether email notification was sent';
COMMENT ON COLUMN notifications.created_by IS 'Admin who created the notification';

