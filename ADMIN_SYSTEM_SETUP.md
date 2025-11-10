# 🛡️ Admin System Setup Guide

This document explains how to set up and use the new admin system for HereMyLinks.

---

## 📋 Overview

The admin system allows you to:
- View platform statistics and analytics
- Manage users (view, edit, delete)
- View transactions and billing information
- Manage other admin users with specific roles
- Send notifications and emails to users
- Configure platform settings

---

## 🚀 Quick Setup

### Step 1: Run Database Migration

Apply the admin system migration to your Supabase database:

```bash
# Copy the contents of database/migrations/005_add_admin_system.sql
# Then run it in Supabase SQL Editor
```

**Or using SQL Editor:**
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Paste contents from `database/migrations/005_add_admin_system.sql`
4. Run the query

This will:
- Add admin fields to users table (`is_admin`, `admin_role`, `admin_permissions`)
- Create `admin_logs` table for audit trail
- Add necessary indexes

### Step 2: Create Your First Master Admin

**Important:** The user MUST have logged in at least once before you can make them an admin.

```bash
# Navigate to your project directory
cd /Users/mora/Documents/heremylinks-nextjs-sample

# Install dependencies if needed
npm install

# Run the script with your email
node scripts/set-master-admin.js your-email@example.com
```

**Example:**
```bash
node scripts/set-master-admin.js admin@heremylinks.com
```

**Expected output:**
```
🔧 Setting master admin for: admin@heremylinks.com
✅ Success! User is now a MASTER ADMIN
📋 Details:
   Email: admin@heremylinks.com
   Role: master_admin
   Permissions: All

🚀 The user can now access the admin dashboard at /admin
```

---

## 🔐 Admin Roles

### Master Admin
- **Role Code:** `master_admin`
- **Full Access:** Can do everything
- **Permissions:**
  - ✅ View/Create/Edit/Delete Users
  - ✅ View/Refund Payments
  - ✅ View/Create/Edit/Delete Admins
  - ✅ View/Create/Edit/Delete/Send Notifications
  - ✅ View/Send Emails
  - ✅ View/Edit Settings
  - ✅ View Logs

### Future Admin Roles (To Be Implemented)
- **User Manager:** Manage users only
- **Payment Manager:** View payments and transactions
- **Notification Manager:** Send notifications
- **Email Manager:** Send emails to users

---

## 🎯 How It Works

### Admin Login Flow

1. **User logs in at `/login`**
   ```
   User enters email/password → NextAuth authenticates
   ```

2. **System checks if user is admin**
   ```typescript
   // In login page
   fetch('/api/user/profile')
     .then(data => {
       if (data.user?.isAdmin) {
         window.location.href = '/admin';  // ← Redirect to admin
       } else {
         window.location.href = '/dashboard';
       }
     })
   ```

3. **Admin Dashboard loads**
   ```
   /admin page checks admin access → Load admin dashboard
   ```

### Security

- ✅ **NextAuth Session Required:** Only authenticated users can access
- ✅ **Admin Check:** `/admin` routes verify `isAdmin` flag
- ✅ **Middleware Protection:** `/admin/*` routes protected by middleware
- ✅ **Database Level:** Admin fields in database
- ✅ **API Protection:** Admin APIs check permissions

---

## 📁 File Structure

```
├── app/
│   ├── admin/
│   │   ├── page.tsx                    # Main admin dashboard
│   │   ├── users/
│   │   │   └── page.tsx               # User management
│   │   ├── transactions/
│   │   │   └── page.tsx               # Transactions (TODO)
│   │   ├── admins/
│   │   │   └── page.tsx               # Admin management (TODO)
│   │   ├── notifications/
│   │   │   └── page.tsx               # Notifications (TODO)
│   │   ├── emails/
│   │   │   └── page.tsx               # Email management (TODO)
│   │   └── settings/
│   │       └── page.tsx               # Settings (TODO)
│   └── api/
│       └── user/
│           └── profile/
│               └── route.ts           # Returns isAdmin flag
├── database/
│   └── migrations/
│       └── 005_add_admin_system.sql   # Admin system migration
├── scripts/
│   └── set-master-admin.js            # Script to create first admin
└── middleware.ts                       # Protects /admin routes
```

---

## 🎨 Admin Dashboard Features

### Current Features (Dummy Data)

✅ **Dashboard Overview**
- Statistics cards (Total Users, Premium Users, Revenue, Subscriptions)
- User growth chart placeholder
- Revenue chart placeholder
- Recent activity feed

✅ **User Management**
- View all users in a table
- Search functionality (UI only)
- User status (Free/Premium)
- Action buttons (View, Edit, Delete - UI only)

### Features To Implement

🔄 **Real Data Integration**
- Connect to actual user database
- Fetch real statistics
- Implement charts with Chart.js or Recharts

🔄 **User CRUD Operations**
- View user details
- Edit user information
- Delete users
- Upgrade/downgrade users manually

🔄 **Transactions**
- View all Stripe transactions
- Filter by date, status, user
- Export transactions

🔄 **Admin Management**
- View all admins
- Add new admins with specific roles
- Edit admin permissions
- Remove admin access

🔄 **Notifications**
- Create notifications
- Send to specific users or all users
- View notification history

🔄 **Email Management**
- Compose emails
- Send to specific users or all users
- Email templates
- Email history

---

## 🔧 Configuration

### Environment Variables

No additional environment variables needed. Uses existing Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Schema

**Users Table (New Fields):**
```sql
is_admin BOOLEAN DEFAULT FALSE              -- Is user an admin
admin_role VARCHAR(50) DEFAULT NULL         -- master_admin, user_manager, etc.
admin_permissions TEXT DEFAULT NULL         -- JSON string of permissions
admin_created_at TIMESTAMP DEFAULT NULL     -- When admin access was granted
admin_created_by VARCHAR(255) DEFAULT NULL  -- Who granted admin access
```

**Admin Logs Table:**
```sql
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY,
  admin_email VARCHAR(255),          -- Who performed the action
  action VARCHAR(100),                -- What action was performed
  target_user_email VARCHAR(255),     -- Who was affected
  description TEXT,                   -- Description of action
  metadata JSONB,                     -- Additional data
  created_at TIMESTAMP                -- When it happened
);
```

---

## 🧪 Testing

### Test Admin Access

1. **Log in with admin account**
   ```
   URL: https://heremylinks.com/login
   Email: your-admin-email@example.com
   Password: your-password
   ```

2. **Should redirect to admin dashboard**
   ```
   URL: https://heremylinks.com/admin
   ```

3. **Try accessing regular dashboard**
   ```
   URL: https://heremylinks.com/dashboard
   (Should still work - admins can access both)
   ```

### Test Non-Admin User

1. **Log in with regular user account**
   ```
   URL: https://heremylinks.com/login
   Email: regular-user@example.com
   Password: password
   ```

2. **Should redirect to regular dashboard**
   ```
   URL: https://heremylinks.com/dashboard
   ```

3. **Try accessing admin dashboard**
   ```
   URL: https://heremylinks.com/admin
   (Should redirect back to /dashboard)
   ```

---

## 📊 Admin Permissions Structure

Master admin permissions (JSON):
```json
{
  "users": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": true
  },
  "payments": {
    "view": true,
    "refund": true
  },
  "admins": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": true
  },
  "notifications": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": true,
    "send": true
  },
  "emails": {
    "view": true,
    "send": true
  },
  "settings": {
    "view": true,
    "edit": true
  },
  "logs": {
    "view": true
  }
}
```

---

## 🚨 Security Best Practices

1. ✅ **Keep admin accounts secure**
   - Use strong passwords
   - Enable 2FA on email accounts

2. ✅ **Limit master admin accounts**
   - Only create master admin for yourself
   - Use role-based admins for team members

3. ✅ **Monitor admin actions**
   - Check `admin_logs` table regularly
   - Review who did what

4. ✅ **Regular access reviews**
   - Review admin list monthly
   - Remove access for inactive admins

5. ✅ **Backup database**
   - Before making bulk changes
   - Use Supabase automatic backups

---

## 🎯 Next Steps

### Immediate Tasks

1. Run the database migration
2. Create your first master admin
3. Test admin login flow
4. Explore the admin dashboard

### Future Development

1. Implement real user management (CRUD operations)
2. Add transaction viewing with Stripe data
3. Create admin management page
4. Build notification system
5. Add email management
6. Implement audit logging UI
7. Add data export functionality
8. Create admin activity dashboard

---

## 💡 Tips

- **Switching Views:** Admins can access both `/admin` and `/dashboard`
- **Quick Access:** Bookmark `/admin` for easy access
- **Mobile:** Admin dashboard is responsive and works on mobile
- **Dark Theme:** Admin uses a beautiful dark theme with purple accents

---

## 🆘 Troubleshooting

### "User not found" when running script
**Solution:** User must log in at least once before being made admin

### Admin dashboard redirects to regular dashboard
**Solution:** Check if `is_admin` is properly set in database

### Can't access admin pages
**Solution:** Check middleware.ts includes `/admin/:path*` in matcher

### Admin permissions not working
**Solution:** Ensure `admin_permissions` is valid JSON string

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs
3. Verify database migration ran successfully
4. Ensure user is properly authenticated

---

**Created:** November 8, 2025  
**Version:** 1.0  
**Status:** Initial Implementation with Dummy Data

