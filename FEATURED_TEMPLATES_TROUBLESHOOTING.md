# Featured Templates Troubleshooting Guide

## Issue: "User must have their profile published before being featured"

### Why This Happens

When you try to feature a user's design but get this error, it means the user's profile is not published. The `is_published` field in their database is set to `false`.

### How to Fix

#### For the User:
The user needs to:
1. Log in to their dashboard at `/dashboard`
2. Go to **Settings** or **Profile Settings**
3. Find the "Publish Profile" toggle or button
4. **Enable/publish their profile**
5. **Save the changes**

#### For the Admin:
Once the user has published their profile, you can:
1. Go to `/admin/users`
2. Find the user in the list
3. Look for their status:
   - ✅ **Published** badge or **Premium** badge = Can be featured
   - ❌ **No published badge** = Cannot be featured yet
4. Optionally check the template badge to see what design they have
5. Click the ⭐ star icon next to published users
6. Confirm the action

### Visual Indicators in Admin Panel

The admin users page now shows:

**Status Column:**
- 👑 **Premium** badge (purple) for premium users
- 🚫 **Banned** badge (red) for banned users
- 🎨 **Template Badge** (blue) showing the template name, or gray "No Template"
- ⭐ **Featured** badge (pink) for featured creators

**Actions Column:**
- ⭐ **Star Icon** (solid pink = featured, outline = not featured)
- Hover over it to see the tooltip

### Improved Error Messages

The system now provides detailed error messages:

**When profile is not published:**
```
Cannot feature [User Name]:

❌ User's profile is not published

The user needs to:
1. Log in to their dashboard
2. Publish their profile

Then you can feature their design.
```

**When API returns error:**
```
❌ Error:

User [User Name] must have their profile published before being featured
```

### Requirements to Feature a User

A user MUST meet these criteria to be featured:
1. ✅ Have their profile `is_published` set to `true`

That's it! Any published user with any design (with or without a template selection) can be featured. The system automatically checks this requirement before allowing you to feature them.

### Database Fields Added

The featured templates system uses these fields in the `users` table:
- `is_featured_creator` (BOOLEAN) - Whether the user is featured
- `featured_creator_since` (TIMESTAMP) - When they were featured
- `template` (VARCHAR) - The template they're using

### API Endpoints

- `POST /api/admin/users/[id]/featured` - Toggle featured status
- `GET /api/templates/featured` - Get all featured templates (for premium users)

### Best Practices

1. **Before featuring a user**, always check:
   - They have an active, well-designed profile
   - Their template badge shows a valid template name
   - They are published (`is_published = true`)

2. **Communicate with users** you want to feature:
   - Let them know they're being featured
   - Ask them to ensure their profile looks good
   - Confirm they have a template selected

3. **Monitor featured users regularly**:
   - Check if their profiles are still active
   - Remove featured status if they unpublish or delete their account
   - Rotate featured users periodically to keep it fresh

### Migration Required

If you haven't already, run the migration:

```bash
# Using Supabase SQL Editor
cat database/migrations/011_add_featured_templates.sql | pbcopy
# Paste into Supabase SQL Editor and run
```

Or via CLI:
```bash
psql YOUR_DATABASE_URL < database/migrations/011_add_featured_templates.sql
```

### Support

If you continue to see this error after the user has set a template:
1. Check the database directly to verify the `template` field value
2. Look at the API logs in the terminal for detailed error info
3. Ensure the migration `011_add_featured_templates.sql` was run successfully
4. Verify the user has `is_published = true`

---

**Last Updated:** November 11, 2025
**Version:** 1.0.0

