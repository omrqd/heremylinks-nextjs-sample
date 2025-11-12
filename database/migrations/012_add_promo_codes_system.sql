-- Migration: Add Promo Codes System
-- Description: Allows admins to create promo codes that users can redeem for premium subscriptions
-- Date: 2025-11-11

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  premium_duration_days INTEGER NOT NULL, -- Number of days of premium to grant
  max_redemptions INTEGER DEFAULT NULL, -- NULL = infinite, number = max times it can be redeemed
  current_redemptions INTEGER DEFAULT 0, -- How many times it's been redeemed
  assigned_user_id UUID DEFAULT NULL, -- NULL = anyone can use, UUID = only this user
  created_by UUID NOT NULL REFERENCES users(id), -- Admin who created it
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- Optional expiration date
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promo_code_redemptions table (track who redeemed what)
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  premium_duration_days INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_promo_codes_assigned_user ON promo_codes(assigned_user_id) WHERE assigned_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promo_code_redemptions_promo_code ON promo_code_redemptions(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_redemptions_user ON promo_code_redemptions(user_id);

-- Add constraint to prevent duplicate redemptions by same user for same code
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_promo_redemption 
ON promo_code_redemptions(promo_code_id, user_id);

-- Add comments
COMMENT ON TABLE promo_codes IS 'Promo codes that grant premium subscriptions';
COMMENT ON TABLE promo_code_redemptions IS 'Track which users redeemed which promo codes';
COMMENT ON COLUMN promo_codes.max_redemptions IS 'NULL = infinite redemptions, number = max times code can be used';
COMMENT ON COLUMN promo_codes.assigned_user_id IS 'NULL = anyone can use, UUID = only this specific user can redeem';

