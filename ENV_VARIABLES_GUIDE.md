# 🔐 Environment Variables Guide

Complete guide for all environment variables needed in your `.env.local` file.

---

## 📝 Required Environment Variables

### **1. NextAuth**

```env
# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-random-secret-key-here

# Application URL
NEXTAUTH_URL=http://localhost:3000
# Production: NEXTAUTH_URL=https://heremylinks.com
```

---

### **2. Google OAuth**

```env
# Get these from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

**Setup:**
1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://heremylinks.com/api/auth/callback/google`

---

### **3. Apple Sign In** (Optional)

```env
# Service ID from Apple Developer Portal
APPLE_ID=com.heremylinks.web

# JWT Token (generate with generate-apple-secret.js)
APPLE_SECRET=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Setup:**
1. Apple Developer Portal → Certificates, Identifiers & Profiles
2. Create Service ID
3. Generate JWT using `node generate-apple-secret.js`

---

### **4. Supabase Database**

```env
# Get these from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ⭐ NEW: Service Role Key (for RLS bypass)
# CRITICAL: Never expose this to the client! Server-side only.
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find:**
- Supabase Dashboard → Settings → API
- **Project URL** = `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** = `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** = `SUPABASE_SERVICE_ROLE_KEY` ⭐

⚠️ **Service Role Key Security:**
- ✅ Has full admin access to your database
- ✅ Bypasses ALL RLS policies
- ❌ NEVER expose to client-side code
- ✅ Only used in server-side API routes

---

### **5. Cloudflare R2 (Storage)**

```env
# Get these from: Cloudflare Dashboard → R2 → Manage R2 API Tokens
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=heremylinks
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

**Setup:**
1. Cloudflare Dashboard → R2
2. Create bucket: `heremylinks`
3. Create R2 API token with read/write permissions
4. Set bucket to public (or use custom domain)

---

### **6. Resend (Email Service)**

```env
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_your_api_key_here

# Optional: Custom from email (requires domain verification)
# Default: onboarding@resend.dev
FROM_EMAIL=noreply@heremylinks.com
```

**Setup:**
1. Sign up at https://resend.com
2. Create API Key
3. Add to `.env.local`
4. (Optional) Verify your domain for custom FROM_EMAIL

**Test Mode vs Production:**
- **Test Mode** (no domain): Can only send to your signup email
- **Production** (domain verified): Can send to any email

---

## 📋 Complete `.env.local` Template

```env
# ============================================================
# NextAuth Configuration
# ============================================================
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# ============================================================
# OAuth Providers
# ============================================================

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Apple Sign In (Optional)
APPLE_ID=com.heremylinks.web
APPLE_SECRET=jwt-token-from-generate-apple-secret

# ============================================================
# Supabase Database
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================
# Cloudflare R2 (Storage)
# ============================================================
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=heremylinks
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# ============================================================
# Email Service
# ============================================================
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=noreply@heremylinks.com

# ============================================================
# Production Only (Optional)
# ============================================================
NEXT_PUBLIC_APP_URL=https://heremylinks.com
```

---

## 🔒 Security Best Practices

### **Never Commit These:**
```gitignore
# Already in .gitignore
.env.local
.env*.local
.env.production
```

### **Client vs Server:**

**Client-Side (Browser accessible):**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_APP_URL`

**Server-Side Only (NEVER expose):**
- ❌ `NEXTAUTH_SECRET`
- ❌ `GOOGLE_CLIENT_SECRET`
- ❌ `APPLE_SECRET`
- ❌ `SUPABASE_SERVICE_ROLE_KEY` ⚠️ CRITICAL
- ❌ `R2_SECRET_ACCESS_KEY`
- ❌ `RESEND_API_KEY`

### **Rotation Schedule:**

| Secret | Rotate Every |
|--------|--------------|
| NextAuth Secret | 1 year |
| OAuth Secrets | When compromised |
| **Service Role Key** | **When compromised** ⚠️ |
| R2 Keys | 6 months |
| Resend Key | 6 months |

---

## 🌍 Environment-Specific Values

### **Development (`.env.local`)**
```env
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Production (Deployment Platform)**
```env
NEXTAUTH_URL=https://heremylinks.com
NEXT_PUBLIC_APP_URL=https://heremylinks.com
```

---

## ✅ Verification Checklist

- [ ] All `NEXT_PUBLIC_*` variables are in `.env.local`
- [ ] All server-side secrets are in `.env.local`
- [ ] **Service Role Key** is added ⭐
- [ ] `.env.local` is in `.gitignore`
- [ ] OAuth redirect URIs match your domains
- [ ] Supabase URL and keys are correct
- [ ] R2 bucket is created and configured
- [ ] Resend domain is verified (or using test mode)
- [ ] Dev server restarts after changing `.env.local`

---

## 🧪 Testing Environment Variables

```bash
# Restart dev server after changing .env.local
npm run dev

# Check if variables are loaded (in API route):
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Has Service Role Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
```

---

## 🆘 Troubleshooting

### **"Missing Supabase Service Role Key"**
→ Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and restart server

### **"Authentication failed" for Google**
→ Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### **"Upload failed" for images**
→ Verify all R2 variables are set and bucket exists

### **"Email not sent"**
→ Check `RESEND_API_KEY` and domain verification

---

## 📞 Where to Get Each Key

| Variable | Location |
|----------|----------|
| NextAuth Secret | `openssl rand -base64 32` |
| Google OAuth | [console.cloud.google.com](https://console.cloud.google.com/) |
| Apple Secret | `node generate-apple-secret.js` |
| Supabase Keys | [app.supabase.com](https://app.supabase.com) → Settings → API |
| R2 Keys | [dash.cloudflare.com](https://dash.cloudflare.com) → R2 |
| Resend Key | [resend.com/api-keys](https://resend.com/api-keys) |

---

## 🎉 You're All Set!

Once all variables are configured:
1. Restart your dev server
2. Test login with Google
3. Test email/password signup
4. Test file uploads
5. Test email verification

Everything should work! 🚀

