-- ============================================================
-- RLS Policies for Defense-in-Depth Security
-- ============================================================
-- These policies are OPTIONAL since Service Role bypasses RLS
-- But they add extra security if someone gets the anon key
-- ============================================================

-- Note: Your Service Role Key will bypass ALL these policies
-- Your API routes (with NextAuth checks) are the real security layer

-- ============================================================
-- Users Table Policies
-- ============================================================

-- Allow anyone to view published profiles (for public bio pages)
CREATE POLICY "Public can view published user profiles"
  ON users FOR SELECT
  USING (is_published = true);

-- This policy will be bypassed by Service Role anyway,
-- but it ensures if someone gets the anon key, they can only:
-- 1. View published profiles (public bio pages)
-- 2. Cannot modify any user data (your API routes control this)

-- ============================================================
-- Bio Links Table Policies
-- ============================================================

-- Allow anyone to view bio links of published users
CREATE POLICY "Public can view bio links of published users"
  ON bio_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = bio_links.user_id 
      AND users.is_published = true
    )
  );

-- ============================================================
-- Social Links Table Policies
-- ============================================================

-- Allow anyone to view social links of published users
CREATE POLICY "Public can view social links of published users"
  ON social_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = social_links.user_id 
      AND users.is_published = true
    )
  );

-- ============================================================
-- Accounts Table Policies
-- ============================================================

-- No public policies needed for accounts
-- Service Role handles all account operations
-- If someone gets the anon key, they can't access any accounts

-- ============================================================
-- Verify RLS is enabled
-- ============================================================

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'accounts', 'bio_links', 'social_links')
ORDER BY tablename;

-- ============================================================
-- Summary
-- ============================================================
-- 
-- Your Security Model:
-- 1. NextAuth checks user sessions ✅
-- 2. API routes verify authentication ✅
-- 3. Service Role bypasses RLS (trusted) ✅
-- 4. RLS policies protect if anon key leaks (defense-in-depth) ✅
--
-- With Service Role:
-- - Your API routes can do ANYTHING (by design)
-- - RLS doesn't restrict your app
-- - RLS only protects against anon key misuse
--
-- Without Service Role (if using anon key):
-- - Only published data is visible
-- - No write operations allowed
-- - Extra layer of protection
-- ============================================================

