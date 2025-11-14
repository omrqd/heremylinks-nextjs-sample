# Forgot Password Feature - Quick Setup Guide

## 🚀 Quick Start

Follow these steps to enable the forgot password feature:

---

## Step 1: Create Database Table

Run the migration script to create the `password_reset_tokens` table:

### Option A: Using the Setup Script (Recommended)

```bash
# Make it executable
chmod +x run_password_reset_migration.sh

# Run the migration
./run_password_reset_migration.sh
```

### Option B: Manual SQL Execution

```bash
# Using MySQL CLI
mysql -h YOUR_HOST -u YOUR_USER -p YOUR_DATABASE < database/password_reset_tokens.sql

# Or run directly in your database:
# Copy the contents from database/password_reset_tokens.sql
```

---

## Step 2: Verify Environment Variables

Make sure these are set in your `.env.local`:

```env
# Required for password reset emails
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Required for reset link URLs
NEXTAUTH_URL=http://localhost:3000

# Your database credentials (should already exist)
DATABASE_HOST=localhost
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database
```

---

## Step 3: Update Email Sender (Optional)

In `/app/api/auth/forgot-password/route.ts`, update the sender email:

```typescript
from: 'HereMyLinks <no-reply@heremylinks.com>',
```

Change to your **verified Resend domain**.

---

## Step 4: Test the Feature

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to login page:**
   ```
   http://localhost:3000/login
   ```

3. **Click "Forgot password?"**

4. **Enter your email and submit**

5. **Check your email for the reset link**

6. **Click the link and set a new password**

7. **Verify the password has been changed by logging in**

---

## 🔐 How It Works

### User Flow

```
┌─────────────────────────────────────┐
│  1. User clicks "Forgot password?"  │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  2. Enters email address            │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  3. System generates secure token   │
│     (32 bytes, SHA-256 hashed)      │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  4. Email sent with reset link      │
│     (expires in 1 hour)             │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  5. User clicks link                │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  6. Token validated                 │
│     - Not expired?                  │
│     - Not used?                     │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  7. User enters new password        │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  8. Password updated                │
│     Token marked as "used"          │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  9. Auto-redirect to login          │
└─────────────────────────────────────┘
```

### Security Features

✅ **SHA-256 Token Hashing** - Tokens are hashed before storage  
✅ **One-Time Use** - Each token can only be used once  
✅ **Time Expiration** - Tokens expire after 1 hour  
✅ **Email Enumeration Prevention** - Same response for valid/invalid emails  
✅ **Transaction Safety** - Atomic password updates  

---

## 📋 Testing Checklist

### Basic Functionality
- [ ] "Forgot password?" link visible on login page
- [ ] Clicking link shows reset password form
- [ ] Form has email input and "Send Reset Link" button
- [ ] "Back to login" button returns to login screen
- [ ] Email is sent successfully
- [ ] Email contains correct reset link
- [ ] Reset link opens password reset page

### Password Reset Page
- [ ] Token validation happens on page load
- [ ] Invalid/expired tokens show error message
- [ ] Valid tokens show password reset form
- [ ] Form requires password confirmation
- [ ] Password must be at least 6 characters
- [ ] Success message shows after reset
- [ ] Auto-redirect to login works

### Security
- [ ] Token expires after 1 hour
- [ ] Token can only be used once
- [ ] Second attempt shows "link invalid" error
- [ ] Non-existent emails don't reveal user doesn't exist
- [ ] New password works for login
- [ ] Old password no longer works

### UI/UX
- [ ] Mobile responsive
- [ ] Loading states show correctly
- [ ] Error messages are clear
- [ ] Success messages are clear
- [ ] No console errors

---

## 🐛 Troubleshooting

### Email Not Received

**Issue:** User doesn't receive reset email

**Solutions:**
1. Check Resend API key is correct
2. Verify sender domain is verified in Resend
3. Check email is not in spam folder
4. Check Resend dashboard for delivery logs
5. Verify email exists in database

**Debug:**
```bash
# Check if token was created
mysql> SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1;

# Check user email
mysql> SELECT id, email FROM users WHERE email = 'user@example.com';
```

---

### Token Invalid Error

**Issue:** "This reset link is invalid or has expired"

**Possible Causes:**
1. ✅ Token expired (> 1 hour old)
2. ✅ Token already used
3. ✅ Email doesn't match token
4. ✅ Token modified/corrupted

**Debug:**
```bash
# Check token status
mysql> SELECT 
  prt.*, 
  u.email,
  TIMESTAMPDIFF(MINUTE, prt.created_at, NOW()) as age_minutes,
  prt.expires_at < NOW() as is_expired
FROM password_reset_tokens prt
JOIN users u ON prt.user_id = u.id
ORDER BY prt.created_at DESC LIMIT 1;
```

**Solution:** Request a new reset link

---

### Password Not Updated

**Issue:** Password reset succeeds but password doesn't change

**Solutions:**
1. Check database transaction logs
2. Verify bcrypt is hashing correctly
3. Check user_id matches in database
4. Verify database permissions

**Debug:**
```bash
# Check latest password hash
mysql> SELECT id, email, LEFT(password, 10) as pass_hash 
FROM users WHERE email = 'user@example.com';

# Should start with $2a$ or $2b$ (bcrypt)
```

---

### Database Connection Errors

**Issue:** "Failed to reset password" or database errors

**Solutions:**
1. Verify database credentials in `.env.local`
2. Check table exists:
   ```bash
   mysql> SHOW TABLES LIKE 'password_reset_tokens';
   ```
3. Check foreign key constraint:
   ```bash
   mysql> SHOW CREATE TABLE password_reset_tokens;
   ```
4. Run migration again if table is missing

---

## 🔧 Maintenance

### Clean Up Old Tokens

Run this periodically (e.g., daily cron job):

```sql
DELETE FROM password_reset_tokens 
WHERE expires_at < NOW() 
   OR (used = TRUE AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY));
```

**Explanation:**
- Deletes expired tokens
- Deletes used tokens older than 7 days

### Monitor Usage

```sql
-- Count active tokens
SELECT COUNT(*) as active_tokens 
FROM password_reset_tokens 
WHERE used = FALSE AND expires_at > NOW();

-- Count resets in last 24 hours
SELECT COUNT(*) as resets_today
FROM password_reset_tokens
WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Most recent resets
SELECT 
  u.email,
  prt.used,
  prt.created_at,
  prt.expires_at,
  TIMESTAMPDIFF(MINUTE, prt.created_at, NOW()) as age_minutes
FROM password_reset_tokens prt
JOIN users u ON prt.user_id = u.id
ORDER BY prt.created_at DESC
LIMIT 10;
```

---

## 📁 Files Reference

### Frontend
- `app/login/page.tsx` - Login page with forgot password UI
- `app/reset-password/page.tsx` - Password reset page

### Backend API
- `app/api/auth/forgot-password/route.ts` - Send reset link
- `app/api/auth/validate-reset-token/route.ts` - Validate token
- `app/api/auth/reset-password/route.ts` - Reset password

### Database
- `database/password_reset_tokens.sql` - Table schema

### Scripts
- `run_password_reset_migration.sh` - Auto migration script

### Documentation
- `FORGOT_PASSWORD_FEATURE.md` - Complete feature documentation
- `FORGOT_PASSWORD_SETUP.md` - This setup guide

---

## 🎨 Customization

### Change Token Expiration

In `/app/api/auth/forgot-password/route.ts`:

```typescript
// Default: 1 hour
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 1);

// Change to 30 minutes:
expiresAt.setMinutes(expiresAt.getMinutes() + 30);

// Change to 24 hours:
expiresAt.setHours(expiresAt.getHours() + 24);
```

### Customize Email Template

In `/app/api/auth/forgot-password/route.ts`, modify the `html` section:

```typescript
await resend.emails.send({
  from: 'Your Name <no-reply@yourdomain.com>',
  to: email,
  subject: 'Your Custom Subject',
  html: `
    <!-- Your custom HTML here -->
  `,
});
```

### Change Password Requirements

In `/app/reset-password/page.tsx` and `/app/api/auth/reset-password/route.ts`:

```typescript
// Current: minimum 6 characters
if (password.length < 6) {
  // error
}

// Change to 8 characters with complexity:
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
if (!passwordRegex.test(password)) {
  showToast('Password must be at least 8 characters with uppercase, lowercase, and number', 'error');
}
```

---

## 🚀 Production Considerations

### Before Deploying

1. **Environment Variables**
   - Set `NEXTAUTH_URL` to production URL
   - Use production Resend API key
   - Verify database credentials

2. **Email Domain**
   - Use verified domain in Resend
   - Set up SPF/DKIM records
   - Test email delivery

3. **Rate Limiting**
   - Consider adding rate limiting to prevent abuse
   - Limit requests per IP address
   - Limit requests per email address

4. **Monitoring**
   - Set up alerts for failed email sends
   - Monitor token usage patterns
   - Log suspicious activity

5. **Database**
   - Set up automated token cleanup
   - Monitor table size
   - Add indexes if needed

### Recommended Rate Limiting

Add to `/app/api/auth/forgot-password/route.ts`:

```typescript
// Example using redis for rate limiting
const key = `reset_limit:${email}`;
const attempts = await redis.incr(key);
if (attempts === 1) {
  await redis.expire(key, 3600); // 1 hour
}
if (attempts > 3) {
  return NextResponse.json(
    { error: 'Too many reset attempts. Please try again later.' },
    { status: 429 }
  );
}
```

---

## ✅ Summary

You've successfully implemented a secure forgot password feature with:

✨ **Beautiful UI** - Modern, responsive design  
🔐 **Secure Tokens** - SHA-256 hashed, one-time use  
⏰ **Time-Limited** - 1-hour expiration  
📧 **Email Integration** - Professional HTML emails  
🛡️ **Security Best Practices** - Transaction safety, no enumeration  

---

**Need help?** Check the complete documentation in `FORGOT_PASSWORD_FEATURE.md`

**Ready to test?** Visit: http://localhost:3000/login

