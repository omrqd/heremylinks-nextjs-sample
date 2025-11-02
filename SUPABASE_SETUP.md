# 🚀 Supabase Setup Guide

## ✅ What's Been Done

- ✅ Supabase client installed (`@supabase/supabase-js`)
- ✅ MySQL schema converted to PostgreSQL
- ✅ Database adapter updated (`lib/db.ts` now uses Supabase)
- ✅ Supabase configuration created (`lib/supabase.ts`)
- ✅ Row Level Security (RLS) policies added for data protection

---

## 📋 What You Need To Do Now

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name:** heremylinks
   - **Database Password:** (create a strong password)
   - **Region:** Choose closest to your users
4. Click **"Create new project"** (takes ~2 minutes)

---

### Step 2: Get Your Supabase Credentials

Once your project is created:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (something like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

---

### Step 3: Run the Database Schema

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New Query"**
3. Copy the entire contents of `database/supabase-schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** or press `Ctrl+Enter`
6. You should see: ✅ **"Success. No rows returned"**

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the schema
supabase db push database/supabase-schema.sql
```

---

### Step 4: Update Environment Variables

1. Open `.env.local` in your project root
2. Add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep all other variables as they are
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=pJaR4AIYypuXsxsz8Io0bKXuzQasNFrPPXjYsvutG7k=
# ... etc
```

---

### Step 5: Test the Connection

```bash
# Start your development server
npm run dev

# You should see in the console:
# ✅ Supabase Database connected successfully
```

Visit `http://localhost:3000` and try:
- Creating an account
- Logging in
- Adding a link

---

## 📊 Verify Database Setup

### Check Tables Were Created

1. Go to **Table Editor** in Supabase dashboard
2. You should see 4 tables:
   - ✅ `users`
   - ✅ `accounts`
   - ✅ `bio_links`
   - ✅ `social_links`

### Check Row Level Security

1. Go to **Authentication** → **Policies**
2. Each table should have RLS policies enabled
3. You should see policies like:
   - "Users can view their own data"
   - "Public profiles are viewable by anyone"
   - etc.

---

## 🔒 Security Features Included

Your Supabase database includes:

### 1. Row Level Security (RLS)
- Users can only access their own data
- Published profiles are publicly viewable
- Protects against unauthorized access

### 2. UUID Primary Keys
- More secure than auto-increment IDs
- Can't be guessed or enumerated

### 3. Foreign Key Constraints
- Data integrity enforced at database level
- Cascade deletes prevent orphaned records

### 4. Indexes
- Fast queries on username, email
- Optimized for your app's access patterns

### 5. Public Access Functions
- Secure functions to bypass RLS for public pages
- Uses `SECURITY DEFINER` for controlled access

---

## 🆚 MySQL vs Supabase Comparison

| Feature | MySQL (Old) | Supabase (New) |
|---------|------------|----------------|
| **Database** | MySQL 9.4 | PostgreSQL 15 |
| **Hosting** | Self-managed | Fully managed |
| **Backups** | Manual | Automatic |
| **Scaling** | Manual | Automatic |
| **Security** | Manual setup | Built-in RLS |
| **API** | Custom | REST + GraphQL |
| **Dashboard** | phpMyAdmin | Supabase Studio |
| **Cost** | VPS included | Free tier / $25/mo |

---

## 📝 Database Schema Overview

### `users` Table
- Primary user accounts
- Profile information
- Template settings
- Theme customization
- Verification status

### `accounts` Table
- OAuth provider accounts (Google, Apple)
- NextAuth integration
- Token storage

### `bio_links` Table
- User's bio page links
- Images, icons, layouts
- Click tracking
- Ordering and visibility

### `social_links` Table
- Social media links
- Platform icons
- Quick links section

---

## 🔄 Migration Notes

### What Changed:
- ❌ Removed MySQL connection pool
- ✅ Added Supabase client
- ✅ UUID instead of VARCHAR(36) for IDs
- ✅ TIMESTAMP WITH TIME ZONE instead of DATETIME
- ✅ BOOLEAN instead of TINYINT(1)
- ✅ Row Level Security policies added

### What Stayed The Same:
- ✅ Table structure and columns
- ✅ Foreign key relationships
- ✅ Indexes
- ✅ Default values
- ✅ Your API routes (compatible adapter)

---

## 🛠️ Troubleshooting

### Error: "Missing Supabase environment variables"
**Solution:** Make sure you added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`

### Error: "relation 'users' does not exist"
**Solution:** You need to run the `supabase-schema.sql` file in your Supabase SQL Editor

### Error: "new row violates row-level security policy"
**Solution:** The RLS policies are working! Make sure you're authenticated or accessing public data only

### Can't see data in Supabase dashboard
**Solution:** 
1. Click the **"Service Role"** toggle in Table Editor to see all data
2. Or disable RLS temporarily (not recommended for production)

---

## 🎯 Next Steps

Once your database is set up and working:

### Phase 2: Migrate to Supabase Storage
- Replace Cloudflare R2 with Supabase Storage
- Simpler authentication
- Better integration

### Phase 3: Use Supabase Auth (Optional)
- Replace NextAuth with Supabase Auth
- Fewer dependencies
- Built-in magic links, OAuth

---

## 📊 Supabase Free Tier Limits

Perfect for getting started:

- ✅ **Database:** 500 MB
- ✅ **Storage:** 1 GB
- ✅ **Bandwidth:** 2 GB/month
- ✅ **Users:** 50,000 MAU
- ✅ **API Requests:** Unlimited

When you need more, upgrade to Pro ($25/mo):
- 8 GB database
- 100 GB storage
- 250 GB bandwidth
- 100,000 MAU

---

## 🎉 You're Ready!

Your Supabase database is configured and ready to use! 

**Next step:** Add your credentials to `.env.local` and start the dev server!

```bash
npm run dev
```

Then visit `http://localhost:3000` and test your app! 🚀

---

## 📞 Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **SQL Editor:** Test queries in Supabase dashboard
- **Table Editor:** View and edit data visually
- **API Docs:** Auto-generated for your schema

Happy coding! 💚

