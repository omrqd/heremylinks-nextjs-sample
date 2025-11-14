# Forgot Password - NULL vs FALSE Fix

## The Problem ❌

The password reset tokens were being inserted with `used: null` instead of `used: false`, causing validation queries to fail.

### Root Cause

When inserting tokens, the database adapter was converting the boolean `false` to `null`:

```sql
-- SQL Query
INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used) 
VALUES (?, ?, ?, false)

-- What actually got inserted
{
  user_id: '66a46220-dc55-4000-afff-4e783350cbb5',
  token_hash: 'cc4fc33c...',
  expires_at: 2025-11-14T21:49:02.643Z,
  used: null  ← PROBLEM! Should be false
}
```

Then when validating:
```sql
SELECT ... WHERE token_hash = ? AND user_id = ? AND used = false
-- Returns 0 rows because NULL ≠ FALSE in PostgreSQL!
```

---

## The Solution ✅

### 1. Pass `false` as a Parameter (Not Literal)

**File:** `app/api/auth/forgot-password/route.ts`

```typescript
// ❌ Before (false as SQL literal)
await db.query(
  'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used) VALUES (?, ?, ?, false)',
  [user.id, resetTokenHash, expiresAt]
);

// ✅ After (false as parameter)
await db.query(
  'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used) VALUES (?, ?, ?, ?)',
  [user.id, resetTokenHash, expiresAt, false]  ← false passed as param
);
```

### 2. Check for Both `false` AND `null` in Queries

**Files:** 
- `app/api/auth/validate-reset-token/route.ts`
- `app/api/auth/reset-password/route.ts`

```typescript
// ❌ Before (only checks for false)
SELECT ... WHERE token_hash = ? AND user_id = ? AND used = false

// ✅ After (checks for both false and null)
SELECT ... WHERE token_hash = ? AND user_id = ? AND (used = false OR used IS NULL)
```

This ensures we can find tokens even if they were inserted with `null` value.

### 3. Add Explicit Used Token Check

```typescript
// After retrieving token, check if it's been used
if (tokenRecord.used === true) {
  return NextResponse.json({
    valid: false,
    error: 'This reset link has already been used. Please request a new one.'
  });
}
```

### 4. Simplified DELETE Query

```typescript
// ✅ Delete ALL tokens for user (simpler, more reliable)
await db.query(
  'DELETE FROM password_reset_tokens WHERE user_id = ?',
  [user.id]
);
```

---

## Files Modified

### 1. `/app/api/auth/forgot-password/route.ts`
- Changed INSERT to pass `false` as parameter (not literal)
- Simplified DELETE query

### 2. `/app/api/auth/validate-reset-token/route.ts`
- Added `OR used IS NULL` to SELECT query
- Added explicit check for `used === true`

### 3. `/app/api/auth/reset-password/route.ts`
- Added `OR used IS NULL` to SELECT query
- Added explicit check for `used === true`

### 4. `/app/reset-password/page.tsx`
- Added `useRef` to prevent duplicate validation calls (React Strict Mode fix)

---

## How to Test

### 1. Request New Reset Link

1. Go to: http://localhost:3000/login
2. Click "Forgot password?"
3. Enter your email: `omarandnasr2@gmail.com`
4. Click "Send Reset Link"
5. Wait for success message

### 2. Check Your Email

- **IMPORTANT:** Check for the **NEWEST** email
- Previous links won't work (they were deleted)
- Look for the most recent "Reset Your Password" email

### 3. Click Reset Link

- Click the "Reset Password" button in the email (with WHITE text ✅)
- You should see the password reset form (NOT an error!)

### 4. Reset Password

1. Enter new password (min 6 characters)
2. Confirm password
3. Click "Reset Password"
4. You should see success message
5. Auto-redirect to login page

### 5. Login with New Password

- Try logging in with your new password
- Old password should NO longer work
- Token should be marked as `used = true`

---

## Why This Happened

### PostgreSQL NULL vs FALSE

In PostgreSQL (Supabase):
- `NULL` means "unknown/no value"
- `FALSE` means "explicitly false"
- `NULL ≠ FALSE` (they are NOT equal!)

```sql
-- These return DIFFERENT results!
SELECT * FROM table WHERE column = false;   -- Only finds false values
SELECT * FROM table WHERE column IS NULL;   -- Only finds null values
SELECT * FROM table WHERE column = false OR column IS NULL;  -- Finds both!
```

### Database Adapter Behavior

The Supabase adapter was treating SQL literals differently than parameters:

```typescript
// Literal in SQL (might be converted to null)
VALUES (?, ?, ?, false)

// Parameter (properly handled as boolean)
VALUES (?, ?, ?, ?)
params: [user.id, hash, expiry, false]
```

---

## Verification

After testing, verify in database:

```sql
-- Check latest token
SELECT 
  prt.*,
  u.email,
  prt.expires_at > NOW() as is_valid,
  prt.used
FROM password_reset_tokens prt
JOIN users u ON prt.user_id = u.id
WHERE u.email = 'omarandnasr2@gmail.com'
ORDER BY prt.created_at DESC
LIMIT 1;

-- Should show:
-- used: false (before password reset)
-- used: true (after password reset)
```

---

## Summary

✅ **Fixed:** Boolean value handling in INSERT queries  
✅ **Fixed:** NULL vs FALSE in SELECT queries  
✅ **Fixed:** Duplicate validation calls (React Strict Mode)  
✅ **Fixed:** Email button text color (white)  
✅ **Enhanced:** Explicit "used token" checks  
✅ **Simplified:** DELETE query logic  

---

## Next Steps

1. ✅ Check your email (omarandnasr2@gmail.com)
2. ✅ Click the NEWEST reset link
3. ✅ Reset your password
4. ✅ Verify you can login with new password
5. ✅ Verify old password doesn't work
6. ✅ Verify link can only be used once

**Status:** Ready to test! 🚀

**Email:** Check for the newest "Reset Your Password - HereMyLinks" email in omarandnasr2@gmail.com

