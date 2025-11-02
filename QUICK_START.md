# 🚀 Quick Start Guide

## ✅ Current Setup
- **Auth**: NextAuth (Google, Apple, Email/Password)
- **Database**: Supabase PostgreSQL
- **Storage**: Cloudflare R2

---

## 📝 Environment Variables

Create `.env.local` with:

```env
# NextAuth
NEXTAUTH_SECRET=generate-with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple Sign In
APPLE_ID=com.heremylinks.web
APPLE_SECRET=your-jwt-token

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=heremylinks
R2_PUBLIC_URL=https://your-r2-url

# Email Service
RESEND_API_KEY=re_your_key
```

---

## 🏃 Run Locally

```bash
npm run dev
```

Visit: http://localhost:3000

---

## 🔐 Configure OAuth

### Google
1. [Google Cloud Console](https://console.cloud.google.com/)
2. OAuth 2.0 Client
3. Redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://heremylinks.com/api/auth/callback/google`

### Apple
1. [Apple Developer Portal](https://developer.apple.com/)
2. Service ID: `com.heremylinks.web`
3. Return URLs:
   - `http://localhost:3000/api/auth/callback/apple`
   - `https://heremylinks.com/api/auth/callback/apple`
4. Generate JWT:
   ```bash
   node generate-apple-secret.js
   ```

---

## 📊 Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Run `database/supabase-schema.sql` in SQL Editor
3. **DISABLE RLS**:
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
   ALTER TABLE bio_links DISABLE ROW LEVEL SECURITY;
   ALTER TABLE social_links DISABLE ROW LEVEL SECURITY;
   ```

---

## ✅ Test Authentication

1. **Email/Password**: Sign up → Verify email → Login
2. **Google**: Click "Continue with Google"
3. **Apple**: Click "Continue with Apple"

---

## 📚 Full Documentation

See `REVERTED_TO_NEXTAUTH.md` for complete setup details.

---

## 🎉 You're Ready!

Everything is configured. Just add your environment variables and start building! 🚀

