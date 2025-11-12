# Featured Templates - Quick Setup Guide

## Setup (2 Minutes)

### Step 1: Run Database Migration ✅

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

```sql
-- Add featured creator fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_featured_creator BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_creator_since TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_is_featured_creator ON users(is_featured_creator) 
WHERE is_featured_creator = TRUE;

-- Add comments
COMMENT ON COLUMN users.is_featured_creator IS 'Whether this user templates are featured for premium users to copy';
COMMENT ON COLUMN users.featured_creator_since IS 'When the user was marked as featured template creator';
```

**Click "Run"** ✅

### Step 2: Test the Feature 🎉

That's it! The code is already in place.

## How to Use

### For Admins

#### Mark User as Featured:
1. Go to **`/admin/users`**
2. Find a user with a nice template
3. Click the **star icon** (☆) in the actions column
4. Confirm the action
5. ✅ User is now featured!
   - Star becomes filled (★) and pink
   - "Featured" badge appears

#### Remove Featured Status:
1. Find user with filled star (★)
2. Click the star icon
3. Confirm removal
4. ✅ Featured status removed

### For Premium Users

#### View Featured Templates:
1. Go to **`/dashboard/templates`**
2. Browse featured templates
3. Preview creator's live profile
4. Copy template to your profile

## Visual Guide

### Admin Users Page

```
User List:
┌──────────────────────────────────────────────────────┐
│ Name     │ Email      │ Status      │ Actions         │
├──────────────────────────────────────────────────────┤
│ John Doe │ john@...   │ [Premium]   │ 👁️ ✏️ 🚫 ☆ 🗑️  │
│          │            │ [Featured]  │                 │
├──────────────────────────────────────────────────────┤
│ Jane S.  │ jane@...   │ [Free]      │ 👁️ ✏️ 🚫 ☆ 🗑️  │
└──────────────────────────────────────────────────────┘
                                          ↑
                                    Star button
```

**Star States:**
- ☆ (Empty, Gray) = Not featured
- ★ (Filled, Pink) = Featured

**Status Badges:**
- 🟣 Premium
- ⚫ Free
- 🔴 Banned
- 🌸 Featured (pink star badge)

## Requirements

### To Feature a User:
- ✅ User must have a template selected
- ✅ User must be published
- ✅ Admin access required

### For Premium Users to View:
- ✅ Must be logged in
- ✅ Must have premium subscription

## API Endpoints Created

1. **`POST /api/admin/users/[id]/featured`**
   - Toggle featured status
   - Admin only

2. **`GET /api/templates/featured`**
   - Get all featured templates
   - Premium users only

## Features

### Admin Features:
- ✅ One-click star toggle
- ✅ Visual feedback (pink star when featured)
- ✅ Featured badge in status column
- ✅ Validation (can't feature user without template)
- ✅ Audit logging (all actions tracked)

### Premium User Features:
- ✅ Browse featured templates
- ✅ See creator information
- ✅ Preview live profiles
- ✅ Copy templates
- ✅ Professional designs

## Common Use Cases

### Use Case 1: Feature Your Best Templates
```
1. Review user profiles
2. Find users with great designs
3. Click star on 5-10 best ones
4. Premium users can now browse them
```

### Use Case 2: Rotate Featured Templates
```
1. Every month, review featured list
2. Remove some old featured users (click star to unfeature)
3. Add new featured users
4. Keep templates fresh and diverse
```

### Use Case 3: Feature Specific Styles
```
Strategy:
- 2 minimal templates
- 2 colorful templates
- 2 professional templates
- 2 creative templates

This gives premium users variety!
```

## Best Practices

### What to Feature ✅
- Professional designs
- Complete profiles
- Good color schemes
- Working links
- Mobile-friendly
- Clean layouts

### What NOT to Feature ❌
- Incomplete profiles
- Broken links
- Test accounts
- Poor designs
- Unpublished profiles

## Troubleshooting

### Error: "User must have a template set"
**Solution**: User needs to select a template in their dashboard settings first

### Star button not working
**Check**: 
1. You're logged in as admin
2. Page is not loading (refresh)
3. Check browser console for errors

### Featured badge not showing
**Solution**: Refresh the page after starring

### Premium user can't see templates
**Check**:
1. User has active premium subscription
2. At least one user is marked as featured
3. Featured users are published

## What's Next?

### Immediate Actions:
1. ✅ Run the database migration
2. ✅ Star 3-5 users with great templates
3. ✅ Test as premium user
4. ✅ Enjoy!

### Future Ideas:
- Email users when they're featured
- Public featured templates page
- Template categories
- Copy counters
- Template ratings

## Files Modified

- ✅ `database/migrations/011_add_featured_templates.sql`
- ✅ `app/api/admin/users/[id]/featured/route.ts`
- ✅ `app/api/templates/featured/route.ts`
- ✅ `app/admin/users/page.tsx`

## Summary

You now have a complete featured templates system:
- ✅ Admin can feature users with star button
- ✅ Featured badge shows in admin panel
- ✅ Premium users get featured templates API
- ✅ All actions are logged
- ✅ Simple one-click toggle

**Time to setup**: ~2 minutes
**Time to feature a user**: ~5 seconds

Perfect for curating quality templates! ⭐✨

