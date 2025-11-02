-- Cloudflare D1 Database Schema
-- Converted from MySQL to SQLite syntax

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  email_verified TEXT DEFAULT NULL,
  name TEXT DEFAULT NULL,
  image TEXT DEFAULT NULL,
  bio TEXT DEFAULT 'Add your bio here',
  password TEXT DEFAULT NULL,
  provider TEXT DEFAULT NULL,
  provider_id TEXT DEFAULT NULL,
  profile_image TEXT DEFAULT NULL,
  hero_image TEXT DEFAULT NULL,
  hero_height INTEGER DEFAULT 300,
  hide_profile_picture INTEGER DEFAULT 0,
  theme_color TEXT DEFAULT '#667eea',
  background_color TEXT DEFAULT '#ffffff',
  template TEXT DEFAULT 'template3',
  background_image TEXT DEFAULT NULL,
  background_video TEXT DEFAULT NULL,
  card_background_color TEXT DEFAULT '#ffffff',
  card_background_image TEXT DEFAULT NULL,
  card_background_video TEXT DEFAULT NULL,
  custom_text TEXT DEFAULT NULL,
  username_color TEXT DEFAULT '#1a1a1a',
  bio_color TEXT DEFAULT '#6b7280',
  custom_text_color TEXT DEFAULT '#4b5563',
  is_published INTEGER DEFAULT 0,
  custom_domain TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  verification_code TEXT DEFAULT NULL,
  verification_code_expires TEXT DEFAULT NULL,
  is_verified INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT DEFAULT NULL,
  access_token TEXT DEFAULT NULL,
  expires_at INTEGER DEFAULT NULL,
  token_type TEXT DEFAULT NULL,
  scope TEXT DEFAULT NULL,
  id_token TEXT DEFAULT NULL,
  session_state TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_provider_account ON accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider);

-- Bio Links Table
CREATE TABLE IF NOT EXISTS bio_links (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT NULL,
  image TEXT DEFAULT NULL,
  layout TEXT DEFAULT 'simple',
  background_color TEXT DEFAULT NULL,
  text_color TEXT DEFAULT NULL,
  is_transparent INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  is_visible INTEGER DEFAULT 1,
  click_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bio_links_user_id ON bio_links(user_id);
CREATE INDEX IF NOT EXISTS idx_bio_links_user_order ON bio_links(user_id, "order");

-- Social Links Table
CREATE TABLE IF NOT EXISTS social_links (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_social_links_user_id ON social_links(user_id);

