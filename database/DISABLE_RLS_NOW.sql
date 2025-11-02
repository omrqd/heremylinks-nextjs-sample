-- ============================================================
-- URGENT: Disable RLS to Allow User Creation
-- ============================================================
-- Run this in Supabase SQL Editor RIGHT NOW
-- ============================================================

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE bio_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_links DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by anyone" ON users;
DROP POLICY IF EXISTS "Anyone can create a user account" ON users;

DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;

DROP POLICY IF EXISTS "Users can view their own bio links" ON bio_links;
DROP POLICY IF EXISTS "Public bio links are viewable by anyone" ON bio_links;
DROP POLICY IF EXISTS "Users can insert their own bio links" ON bio_links;
DROP POLICY IF EXISTS "Users can update their own bio links" ON bio_links;
DROP POLICY IF EXISTS "Users can delete their own bio links" ON bio_links;

DROP POLICY IF EXISTS "Users can view their own social links" ON social_links;
DROP POLICY IF EXISTS "Public social links are viewable by anyone" ON social_links;
DROP POLICY IF EXISTS "Users can insert their own social links" ON social_links;
DROP POLICY IF EXISTS "Users can update their own social links" ON social_links;
DROP POLICY IF EXISTS "Users can delete their own social links" ON social_links;

-- Verify RLS is disabled
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '❌ STILL ENABLED (BAD)'
    ELSE '✅ DISABLED (GOOD)'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'accounts', 'bio_links', 'social_links')
ORDER BY tablename;

