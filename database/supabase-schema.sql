-- ************************************************************
-- Supabase PostgreSQL Schema for heremylinks
-- Converted from MySQL schema
-- ************************************************************

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: users
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  name VARCHAR(255) DEFAULT NULL,
  image TEXT DEFAULT NULL,
  bio VARCHAR(500) DEFAULT 'Add your bio here',
  password VARCHAR(255) DEFAULT NULL,
  provider VARCHAR(50) DEFAULT NULL,
  provider_id VARCHAR(255) DEFAULT NULL,
  profile_image TEXT DEFAULT NULL,
  hero_image TEXT DEFAULT NULL,
  hero_height INTEGER DEFAULT 300,
  hide_profile_picture BOOLEAN DEFAULT FALSE,
  theme_color VARCHAR(10) DEFAULT '#667eea',
  background_color VARCHAR(10) DEFAULT '#ffffff',
  template VARCHAR(50) DEFAULT 'template3',
  background_image VARCHAR(500) DEFAULT NULL,
  background_video VARCHAR(500) DEFAULT NULL,
  card_background_color VARCHAR(10) DEFAULT '#ffffff',
  card_background_image VARCHAR(500) DEFAULT NULL,
  card_background_video VARCHAR(500) DEFAULT NULL,
  custom_text TEXT DEFAULT NULL,
  username_color VARCHAR(10) DEFAULT '#1a1a1a',
  bio_color VARCHAR(10) DEFAULT '#6b7280',
  custom_text_color VARCHAR(10) DEFAULT '#4b5563',
  is_published BOOLEAN DEFAULT FALSE,
  custom_domain VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verification_code VARCHAR(6) DEFAULT NULL,
  verification_code_expires TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  -- Premium/Billing Fields
  is_premium BOOLEAN DEFAULT FALSE,
  premium_plan_type VARCHAR(20) DEFAULT NULL, -- 'monthly' or 'lifetime'
  premium_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  premium_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- NULL for lifetime, future date for monthly
  stripe_customer_id VARCHAR(255) DEFAULT NULL,
  stripe_subscription_id VARCHAR(255) DEFAULT NULL -- For monthly subscriptions
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: accounts (for NextAuth OAuth)
-- ============================================================

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT DEFAULT NULL,
  access_token TEXT DEFAULT NULL,
  expires_at BIGINT DEFAULT NULL,
  token_type VARCHAR(50) DEFAULT NULL,
  scope TEXT DEFAULT NULL,
  id_token TEXT DEFAULT NULL,
  session_state TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_provider_account UNIQUE (provider, provider_account_id)
);

-- Create indexes for accounts table
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider);

-- ============================================================
-- Table: bio_links
-- ============================================================

CREATE TABLE IF NOT EXISTS bio_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(100) DEFAULT NULL,
  image TEXT DEFAULT NULL,
  layout VARCHAR(50) DEFAULT 'simple',
  background_color VARCHAR(10) DEFAULT NULL,
  text_color VARCHAR(10) DEFAULT NULL,
  is_transparent BOOLEAN DEFAULT FALSE,
  "order" INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bio_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for bio_links table
CREATE INDEX IF NOT EXISTS idx_bio_links_user_id ON bio_links(user_id);
CREATE INDEX IF NOT EXISTS idx_bio_links_user_order ON bio_links(user_id, "order");

-- Create trigger for bio_links table
CREATE TRIGGER update_bio_links_updated_at BEFORE UPDATE ON bio_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: social_links
-- ============================================================

CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT social_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for social_links table
CREATE INDEX IF NOT EXISTS idx_social_links_user_id ON social_links(user_id);

-- ============================================================
-- Table: billing_transactions
-- ============================================================

CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  plan_type VARCHAR(20) NOT NULL, -- 'monthly' or 'lifetime'
  amount NUMERIC(10,2) NOT NULL, -- Store in dollars (e.g., 3.99 or 14.99)
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'succeeded', -- 'succeeded', 'pending', 'failed', 'refunded'
  event_type VARCHAR(100) DEFAULT NULL, -- Stripe event type
  external_id VARCHAR(255) UNIQUE NOT NULL, -- Stripe payment/session ID (UNIQUE to prevent duplicates)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for billing_transactions table
CREATE INDEX IF NOT EXISTS idx_billing_transactions_email ON billing_transactions(email);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_created_at ON billing_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_external_id ON billing_transactions(external_id);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bio_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Public profiles are viewable by anyone" ON users
  FOR SELECT USING (is_published = true);

CREATE POLICY "Anyone can create a user account" ON users
  FOR INSERT WITH CHECK (true);

-- Accounts table policies
CREATE POLICY "Users can view their own accounts" ON accounts
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own accounts" ON accounts
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own accounts" ON accounts
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Bio links table policies
CREATE POLICY "Users can view their own bio links" ON bio_links
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Public bio links are viewable by anyone" ON bio_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = bio_links.user_id 
      AND users.is_published = true
    )
  );

CREATE POLICY "Users can insert their own bio links" ON bio_links
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own bio links" ON bio_links
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own bio links" ON bio_links
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Social links table policies
CREATE POLICY "Users can view their own social links" ON social_links
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Public social links are viewable by anyone" ON social_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = social_links.user_id 
      AND users.is_published = true
    )
  );

CREATE POLICY "Users can insert their own social links" ON social_links
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own social links" ON social_links
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own social links" ON social_links
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Billing transactions table policies
CREATE POLICY "Users can view their own billing transactions" ON billing_transactions
  FOR SELECT USING (
    email IN (SELECT email FROM users WHERE auth.uid()::text = id::text)
  );

-- Service role can insert transactions (for API/webhooks)
CREATE POLICY "Service role can insert billing transactions" ON billing_transactions
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- Functions for public access (bypass RLS for API)
-- ============================================================

-- Function to get user by username (public)
CREATE OR REPLACE FUNCTION get_user_by_username(username_param TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM users WHERE username = username_param AND is_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user bio links (public)
CREATE OR REPLACE FUNCTION get_user_bio_links(user_id_param UUID)
RETURNS SETOF bio_links AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM bio_links 
  WHERE user_id = user_id_param 
  AND is_visible = true
  ORDER BY "order" ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user social links (public)
CREATE OR REPLACE FUNCTION get_user_social_links(user_id_param UUID)
RETURNS SETOF social_links AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM social_links 
  WHERE user_id = user_id_param
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Grant permissions
-- ============================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- Success message
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Supabase schema created successfully!';
  RAISE NOTICE '📊 Tables created: users, accounts, bio_links, social_links, billing_transactions';
  RAISE NOTICE '💳 Premium and billing fields added to users table';
  RAISE NOTICE '🔒 Row Level Security enabled on all tables';
  RAISE NOTICE '🔑 Public access functions created';
END $$;

