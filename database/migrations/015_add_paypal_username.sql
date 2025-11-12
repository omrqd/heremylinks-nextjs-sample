-- Add PayPal.me username to payment configs
-- This is required because PayPal.me username is NOT the same as email username

ALTER TABLE payment_configs
ADD COLUMN IF NOT EXISTS paypal_username VARCHAR(255);

COMMENT ON COLUMN payment_configs.paypal_username IS 'PayPal.me username (e.g., if link is paypal.me/johnsmith, username is johnsmith)';

