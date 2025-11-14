-- Password Reset Tokens Table
-- This table stores one-time use tokens for password resets

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key to users table
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_expires_at ON password_reset_tokens(expires_at);

-- Ensure one active token per user (will be updated on new request)
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_token ON password_reset_tokens(user_id, used);

-- Clean up expired tokens (optional - can be run as a cron job)
-- DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION set_password_reset_token_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_password_reset_token_updated_at ON password_reset_tokens;

CREATE TRIGGER trg_password_reset_token_updated_at
BEFORE UPDATE ON password_reset_tokens
FOR EACH ROW
EXECUTE PROCEDURE set_password_reset_token_updated_at();

