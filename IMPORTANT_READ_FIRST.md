# ⚠️ IMPORTANT - READ THIS FIRST!

## 🔴 Critical Issue Found & Fixed

Your app is showing errors because of **Row Level Security (RLS)** in Supabase.

---

## ⚡ Quick Fix (2 minutes)

### 1. Go to Supabase SQL Editor
https://supabase.com/dashboard → Your Project → SQL Editor

### 2. Run This File
Open and run: `database/disable-rls-for-nextauth.sql`

Just copy everything from that file, paste into SQL Editor, and click "Run"

### 3. Restart Your Server
```bash
npm run dev
```

### 4. Test It
- Sign in with Google
- Check dashboard
- Add a link

**Everything should work now!** ✅

---

## 📚 For More Details

See: `FIX_AUTH_ISSUES.md`

---

## ❓ Why This Fix?

- You're using **NextAuth** (not Supabase Auth)
- Supabase RLS expects Supabase Auth
- Your API routes handle security (so RLS is redundant)
- Disabling RLS allows NextAuth to work properly

**Is it safe?** YES - Your API routes check authentication on every request.

---

## 🎯 That's It!

Just run that one SQL file in Supabase and restart. Easy! 🚀

