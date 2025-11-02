# ⚡ Quick Supabase Setup - Start Here!

## 🎯 You Need 3 Things:

1. ✅ Create Supabase project (2 minutes)
2. ✅ Run the database schema (1 minute)
3. ✅ Add credentials to `.env.local` (30 seconds)

---

## Step 1: Create Supabase Project (2 min)

Go to: [https://supabase.com/dashboard](https://supabase.com/dashboard)

1. Click **"New Project"**
2. Fill in:
   - Name: `heremylinks`
   - Database Password: (create a strong password - save it!)
   - Region: (choose closest to you)
3. Click **"Create new project"**
4. Wait ~2 minutes for project to be ready

---

## Step 2: Get Your Credentials (30 sec)

Once project is ready:

1. Go to **Settings** (⚙️ icon) → **API**
2. Copy two values:

```
Project URL: https://xxxxx.supabase.co
Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Run Database Schema (1 min)

1. Go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open this file: `database/supabase-schema.sql`
4. Copy **EVERYTHING** from that file
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter`)
7. You should see: ✅ **"Success"**

---

## Step 4: Update .env.local (30 sec)

Edit `.env.local` in your project root and update these two lines:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual values from Step 2!

---

## Step 5: Test It! (1 min)

```bash
# Start dev server
npm run dev
```

You should see:
```
✅ Supabase Database connected successfully
```

Visit `http://localhost:3000` and try:
- Creating an account
- Logging in
- Adding a link

---

## ✅ Verify Everything Works

### Check in Supabase Dashboard:

1. Go to **Table Editor**
2. You should see 4 tables:
   - `users`
   - `accounts`
   - `bio_links`
   - `social_links`

### Test in Your App:

1. Open `http://localhost:3000`
2. Click **"Sign Up"**
3. Create an account
4. Check **Table Editor** → **users** table
5. Your new user should appear! 🎉

---

## 🆘 Troubleshooting

### "Missing Supabase environment variables"
- Make sure you updated `.env.local` with real values
- Variable names must be exact: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after changing `.env.local`

### "relation 'users' does not exist"
- You forgot to run the schema SQL!
- Go back to Step 3 and run `supabase-schema.sql` in SQL Editor

### "Supabase connection error"
- Check your Project URL is correct (should end with `.supabase.co`)
- Check your Anon key is the full key (very long string starting with `eyJ`)

---

## 🎉 That's It!

Total time: **~5 minutes**

Your app is now running on Supabase! 🚀

**Next:** Check out `SUPABASE_SETUP.md` for more details about:
- Security features (Row Level Security)
- Database schema
- Advanced configuration

---

## 📊 What You Got:

✅ **Fully managed PostgreSQL database**  
✅ **Automatic backups**  
✅ **Row Level Security enabled**  
✅ **Free tier** (500MB database, 50K users)  
✅ **Visual dashboard** for managing data  
✅ **No server maintenance needed**  

Congratulations! You're now using a modern, serverless database! 💚

