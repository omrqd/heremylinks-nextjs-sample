-- Create sent_emails table for tracking all sent emails
CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) DEFAULT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT DEFAULT NULL,
  target_type VARCHAR(50) NOT NULL, -- 'all' or 'specific'
  target_user_id UUID DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sending', 'sent', 'failed', 'partial'
  error_message TEXT DEFAULT NULL,
  sent_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create email_recipients table for tracking individual email deliveries
CREATE TABLE IF NOT EXISTS email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_email_id UUID NOT NULL REFERENCES sent_emails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced', 'opened'
  error_message TEXT DEFAULT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_by ON sent_emails(sent_by);
CREATE INDEX IF NOT EXISTS idx_sent_emails_created_at ON sent_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON sent_emails(status);
CREATE INDEX IF NOT EXISTS idx_sent_emails_target_type ON sent_emails(target_type);

CREATE INDEX IF NOT EXISTS idx_email_recipients_sent_email_id ON email_recipients(sent_email_id);
CREATE INDEX IF NOT EXISTS idx_email_recipients_user_id ON email_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_email_recipients_status ON email_recipients(status);

-- Add comments for documentation
COMMENT ON TABLE sent_emails IS 'Tracks all emails sent through the admin panel';
COMMENT ON TABLE email_recipients IS 'Tracks individual email delivery status for each recipient';

COMMENT ON COLUMN sent_emails.target_type IS 'Whether email was sent to all users or specific user';
COMMENT ON COLUMN sent_emails.status IS 'Overall status of the email campaign';
COMMENT ON COLUMN sent_emails.recipients_count IS 'Total number of intended recipients';
COMMENT ON COLUMN sent_emails.sent_count IS 'Number of successfully sent emails';
COMMENT ON COLUMN sent_emails.failed_count IS 'Number of failed email deliveries';

COMMENT ON COLUMN email_recipients.status IS 'Individual email delivery status';

