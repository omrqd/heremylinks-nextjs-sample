# ✅ RLS ENABLED WITH SERVICE ROLE KEY

Your application now uses **Supabase Row Level Security (RLS)** with the **Service Role Key** approach.

---

## 🎯 What Changed

### ✅ **Before (RLS Disabled)**
```
User Request → API Route → NextAuth Check → Regular Supabase Client → Database
                              ✅                    🔓 No RLS
```

### ✅ **After (RLS Enabled with Service Role)**
```
User Request → API Route → NextAuth Check → Admin Supabase Client → Database
                              ✅                🔑 Service Role      🔒 RLS Enabled
                                                   (Bypasses RLS)
```

---

## 🔐 Security Model

### **Your Security Layers (In Order)**

1. **NextAuth Session Check** (Primary Security)
   ```typescript
   const session = await auth();
   if (!session?.user?.email) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```
   - ✅ All API routes check this first
   - ✅ Unauthorized users get 401 error

2. **Service Role Key** (Trusted Backend)
   - ✅ Bypasses ALL RLS policies
   - ✅ Only available server-side
   - ✅ Never exposed to client

3. **RLS Policies** (Defense-in-Depth)
   - ✅ Protects if anon key leaks
   - ⚠️ Service Role bypasses these
   - 📝 Optional but recommended

---

## 📁 Files Changed

### **1. New File: `lib/supabase-admin.ts`**
```typescript
// Admin client using Service Role Key
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← Bypasses RLS
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
```

### **2. Updated: `lib/db.ts`**
```typescript
// Before
import { supabase } from './supabase';

// After
import { supabaseAdmin } from './supabase-admin';

// All queries now use supabaseAdmin
let query = supabaseAdmin.from(table).select('*');
```

### **3. Environment Variables**
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx        # For public access (if needed)
SUPABASE_SERVICE_ROLE_KEY=xxx            # NEW: Admin access, bypasses RLS
```

⚠️ **IMPORTANT**: Service Role Key = **FULL ADMIN ACCESS**. Never expose it to the client!

---

## 🛡️ RLS Policies (Optional)

### **Current Setup:**
- ✅ RLS is **ENABLED** on all tables
- ⚠️ No policies created yet (all access goes through Service Role)
- ✅ Your API routes enforce authorization

### **To Add Defense-in-Depth Policies:**

Run `database/enable-rls-policies.sql` in Supabase SQL Editor.

**What these policies do:**
1. Allow public to view **published** profiles only
2. Protect against anon key misuse
3. Don't affect your API routes (Service Role bypasses them)

**Should you run them?**
- ✅ **YES** for production (extra security layer)
- ⚠️ Optional for development
- 📝 Doesn't hurt, adds protection

---

## 🧪 Testing

### **Test 1: Login**
```bash
# Visit: http://localhost:3000/login
# Sign in with existing account
# Should work normally ✅
```

### **Test 2: Dashboard**
```bash
# Visit: http://localhost:3000/dashboard
# Load profile, links, etc.
# Everything should work ✅
```

### **Test 3: Create Link**
```bash
# In dashboard, add a new bio link
# Should save successfully ✅
```

### **Expected Logs:**
```bash
✅ Supabase Admin connected successfully (Service Role)
🔍 SQL Query: SELECT * FROM users WHERE email = ?
✅ Query result: 1 rows
```

If you see these logs, RLS is working with Service Role!

---

## ❓ Common Questions

### **Q: Will my app break with RLS enabled?**
**A:** No! Service Role bypasses RLS. Your app works exactly the same.

### **Q: Do I need to create RLS policies?**
**A:** Not required (Service Role bypasses them), but recommended for defense-in-depth.

### **Q: What if someone gets my anon key?**
**A:** Without RLS policies, they can access raw data. With policies, they can only view published profiles.

### **Q: Can users bypass my API routes?**
**A:** No! All database access goes through your server-side API routes, which check NextAuth sessions.

### **Q: What's the performance impact?**
**A:** Zero! Service Role bypasses RLS, so no policy evaluation overhead.

---

## 🔄 Reverting (If Needed)

### **To Disable RLS:**

```sql
-- Run in Supabase SQL Editor
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE bio_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_links DISABLE ROW LEVEL SECURITY;
```

### **To Use Anon Key Again:**

In `lib/db.ts`:
```typescript
// Change this:
import { supabaseAdmin } from './supabase-admin';

// Back to:
import { supabase } from './supabase';

// And change all instances of supabaseAdmin back to supabase
```

---

## ✅ Benefits of This Approach

| Benefit | Description |
|---------|-------------|
| ✅ **Simple** | Just swap the client, everything works |
| ✅ **Secure** | NextAuth checks + Service Role = trusted |
| ✅ **Fast** | No RLS policy evaluation overhead |
| ✅ **Flexible** | Can add RLS policies for extra protection |
| ✅ **Standard** | Industry-standard pattern for NextAuth + Supabase |

---

## 🎉 You're All Set!

Your application now has:
- ✅ RLS enabled on all tables
- ✅ Service Role Key for trusted backend access
- ✅ NextAuth session checks on all API routes
- ✅ Optional RLS policies for defense-in-depth

**Everything should work exactly as before!** 🚀

---

## 📞 Need Help?

If you see any errors:
1. Check that `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
2. Restart your dev server: `npm run dev`
3. Check logs for connection confirmation

If queries fail with RLS errors, it means the Service Role Key isn't being used correctly.

