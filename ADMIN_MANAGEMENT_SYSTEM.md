# Admin Management System

## Overview
A comprehensive admin management system that allows master admins to add, remove, and manage admin users with role-based access control and granular permissions.

## Features

### 1. **Role-Based Access Control (RBAC)**
Six predefined admin roles with different access levels:

- **Master Admin** - Full access to everything, can manage other admins
- **User Manager** - Can manage users and view analytics
- **Payment Manager** - Can view payments and transactions
- **Notification Manager** - Can send notifications and emails
- **Content Manager** - Can manage site content
- **Analytics Viewer** - Can view analytics only

### 2. **Granular Permissions**
10 specific permissions that can be assigned to any admin:

| Permission | Description | Icon |
|------------|-------------|------|
| View Users | View user list and profiles | users |
| Manage Users | Edit and delete users | user-edit |
| Ban Users | Ban/unban user accounts | user-slash |
| View Transactions | View payment transactions | credit-card |
| Manage Payments | Handle payment operations | dollar-sign |
| Send Notifications | Send in-app notifications | bell |
| Send Emails | Send email notifications | envelope |
| View Analytics | Access analytics dashboard | chart-line |
| Manage Content | Edit site content | file-alt |
| View Logs | View admin activity logs | history |

### 3. **Admin Management Actions**

#### Add Admin
- Select any non-admin user
- Choose a role (Master Admin, User Manager, etc.)
- Select specific permissions
- System tracks who granted admin access and when

#### Edit Admin
- Update admin role
- Modify permissions
- Cannot edit your own master admin status (safety feature)
- All changes are logged

#### Remove Admin
- Revoke admin access from users
- Cannot remove yourself (safety feature)
- All removals are logged

### 4. **Safety Features**

- **Self-Protection**: Cannot remove your own admin access
- **Master Admin Protection**: Cannot demote yourself from master admin
- **Audit Trail**: All admin actions are logged in `admin_logs` table
- **Access Control**: Only master admins can manage other admins
- **Confirmation Dialogs**: Prompts before removing admin access

## Database Schema

### Users Table (Admin Fields)
```sql
is_admin BOOLEAN DEFAULT FALSE
admin_role VARCHAR(50) DEFAULT NULL
admin_permissions TEXT DEFAULT NULL  -- JSON array
admin_created_at TIMESTAMP
admin_created_by UUID  -- References users(id)
```

### Admin Logs Table
```sql
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_email VARCHAR(255),
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### GET /api/admin/admins
List all admin users with their roles and permissions.

**Auth**: Master Admin required

**Response**:
```json
{
  "success": true,
  "admins": [
    {
      "id": "user-id",
      "username": "johndoe",
      "email": "john@example.com",
      "name": "John Doe",
      "profile_image": "url",
      "admin_role": "master_admin",
      "admin_permissions": ["view_users", "manage_users"],
      "admin_created_at": "2025-01-01T00:00:00Z",
      "creator": {
        "name": "Admin Name",
        "username": "admin"
      }
    }
  ]
}
```

### POST /api/admin/admins
Grant admin access to a user.

**Auth**: Master Admin required

**Request**:
```json
{
  "userId": "user-id",
  "adminRole": "user_manager",
  "permissions": ["view_users", "manage_users"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully granted admin access to user@example.com",
  "admin": { /* admin object */ }
}
```

### PUT /api/admin/admins/[id]
Update admin role and permissions.

**Auth**: Master Admin required

**Request**:
```json
{
  "adminRole": "payment_manager",
  "permissions": ["view_transactions", "manage_payments"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully updated admin role for user@example.com",
  "admin": { /* updated admin object */ }
}
```

### DELETE /api/admin/admins/[id]
Remove admin access from a user.

**Auth**: Master Admin required

**Response**:
```json
{
  "success": true,
  "message": "Successfully removed admin access from user@example.com"
}
```

## UI Components

### Admin List View
- **Card-based layout** showing all admins
- **Avatar or initials** for each admin
- **Role badges** with color coding
- **Permission chips** showing specific permissions
- **Edit and Remove buttons** for each admin
- **Meta information**: Added date and who granted access

### Add Admin Modal
- **User selector**: Dropdown of all non-admin users
- **Role selector**: Radio buttons with role descriptions
- **Permission checkboxes**: Grid layout for easy selection
- **Save/Cancel actions**

### Edit Admin Modal
- **Similar to Add Modal** but pre-populated with current values
- **Cannot edit own master admin status**
- **Shows current admin name in header**

## Role Definitions & Recommended Permissions

### Master Admin
- **Full Access**: All permissions
- **Can**: Manage other admins, access everything
- **Recommended For**: Site owners, senior administrators

### User Manager
- **Primary Focus**: User management
- **Recommended Permissions**:
  - View Users ✓
  - Manage Users ✓
  - Ban Users ✓
  - View Analytics (optional)
- **Can**: Handle user accounts, support tickets
- **Recommended For**: Customer support managers

### Payment Manager
- **Primary Focus**: Financial operations
- **Recommended Permissions**:
  - View Transactions ✓
  - Manage Payments ✓
  - View Analytics (optional)
- **Can**: View and manage payments, refunds
- **Recommended For**: Finance team, accountants

### Notification Manager
- **Primary Focus**: Communication
- **Recommended Permissions**:
  - Send Notifications ✓
  - Send Emails ✓
  - View Users (optional)
- **Can**: Send announcements, email campaigns
- **Recommended For**: Marketing team, community managers

### Content Manager
- **Primary Focus**: Site content
- **Recommended Permissions**:
  - Manage Content ✓
  - View Analytics (optional)
- **Can**: Edit pages, blog posts, etc.
- **Recommended For**: Content creators, editors

### Analytics Viewer
- **Primary Focus**: Read-only analytics
- **Recommended Permissions**:
  - View Analytics ✓
  - View Users (read-only)
  - View Transactions (read-only)
- **Can**: View reports and dashboards
- **Recommended For**: Stakeholders, analysts

## Security Features

### Authentication & Authorization
1. **Session Validation**: Every request validates user session
2. **Admin Check**: Verifies user has admin status
3. **Role Check**: Ensures user has required role (master_admin for management)
4. **Action Logging**: All admin actions are logged with IP address

### Audit Trail
All admin management actions are logged:
- **create_admin**: When admin access is granted
- **update_admin**: When role/permissions are changed
- **remove_admin**: When admin access is revoked

Log Entry Example:
```json
{
  "admin_email": "master@example.com",
  "action": "create_admin",
  "target_email": "newadmin@example.com",
  "details": "Granted user_manager role to newadmin@example.com",
  "ip_address": "192.168.1.1",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Protection Mechanisms
1. **Self-Protection**: Admins cannot remove their own access
2. **Master Admin Lock**: Cannot demote yourself from master admin
3. **Confirmation Dialogs**: Warns before destructive actions
4. **Non-Admin Filter**: Only shows non-admin users in add dialog
5. **Master Admin Guard**: Only master admins can manage admins

## Usage Guide

### Adding Your First Admin

1. **Navigate to Admin Panel**
   - Go to `/admin/admins`
   - You must be logged in as master admin

2. **Click "Add Admin"**
   - Select a user from the dropdown
   - Choose appropriate role
   - Select specific permissions if needed

3. **Save**
   - User immediately gets admin access
   - They can log in to admin panel
   - Access is based on their role and permissions

### Editing Admin Permissions

1. **Find the admin** in the list
2. **Click "Edit"** button
3. **Update role** or permissions
4. **Save changes**
   - Updates take effect immediately
   - Admin may need to refresh their session

### Removing Admin Access

1. **Find the admin** in the list
2. **Click "Remove"** button (not available for master admins)
3. **Confirm** the action
4. **Admin access revoked**
   - User becomes regular user
   - Loses access to admin panel

## Best Practices

### Role Assignment
1. **Principle of Least Privilege**: Give minimum necessary access
2. **Use Specific Permissions**: Combine roles with granular permissions
3. **Regular Audits**: Review admin list periodically
4. **Document Reasons**: Keep notes on why admins were added

### Master Admin Management
1. **Limit Master Admins**: Only give to trusted senior staff
2. **Always Have Backup**: Have at least 2 master admins
3. **Never Remove All**: System should always have 1+ master admin
4. **Secure Accounts**: Enforce strong passwords for master admins

### Permission Strategy
1. **Start Restrictive**: Add permissions as needed
2. **Review Regularly**: Check if permissions are still necessary
3. **Use Roles First**: Only add custom permissions if needed
4. **Document Access**: Keep records of why permissions were granted

## Troubleshooting

### Cannot See Admin Panel
**Problem**: User can't access `/admin/admins`

**Solutions**:
1. Check if user has `is_admin = true` in database
2. Verify user has `admin_role = 'master_admin'`
3. Check session authentication
4. Try logging out and back in

### Cannot Add New Admin
**Problem**: "Master admin access required" error

**Solutions**:
1. Only master admins can add admins
2. Check your `admin_role` in database
3. Contact existing master admin

### Cannot Remove Admin
**Problem**: Remove button disabled or error

**Possible Reasons**:
1. Trying to remove yourself (not allowed)
2. Trying to remove a master admin (only they can remove themselves)
3. Not logged in as master admin

### Permission Changes Not Working
**Problem**: Updated permissions not taking effect

**Solutions**:
1. User needs to log out and log back in
2. Clear browser cache
3. Check `admin_permissions` JSON in database is valid
4. Verify session is refreshed

## Future Enhancements

### Planned Features
- [ ] Time-limited admin access (auto-expire)
- [ ] Admin activity dashboard
- [ ] Permission templates (pre-configured sets)
- [ ] Bulk admin operations
- [ ] Email notifications when granted/revoked admin access
- [ ] Admin access request system
- [ ] Two-factor authentication for admin accounts
- [ ] IP whitelist for admin access
- [ ] Detailed audit log viewer in UI
- [ ] Role hierarchy and delegation

### Advanced Permissions
- [ ] Read vs Write permissions (view vs edit)
- [ ] Resource-level permissions (specific users/payments)
- [ ] Time-based access (business hours only)
- [ ] Geographic restrictions
- [ ] Action approval workflows

## Files Created

### API Routes
1. `/app/api/admin/admins/route.ts` - List and add admins
2. `/app/api/admin/admins/[id]/route.ts` - Update and remove admins

### UI Pages
1. `/app/admin/admins/page.tsx` - Admin management interface

### Database
- Uses existing admin fields in users table
- Uses existing admin_logs table for audit trail

## Testing Checklist

- [✓] List all admins
- [✓] Add new admin with role
- [✓] Add admin with custom permissions
- [✓] Edit admin role
- [✓] Edit admin permissions
- [✓] Remove admin access
- [✓] Cannot remove self
- [✓] Cannot demote self from master admin
- [✓] Only master admins can access page
- [✓] Audit logs created for all actions
- [✓] TypeScript compilation passes
- [✓] No linter errors
- [✓] UI displays correctly
- [✓] Modals work properly
- [✓] Error messages display
- [✓] Success messages display

## Summary

The admin management system provides:
- ✅ Complete role-based access control
- ✅ Granular permission management
- ✅ Beautiful, intuitive UI
- ✅ Comprehensive audit trail
- ✅ Safety features to prevent accidents
- ✅ Full CRUD operations for admin management
- ✅ Master admin protection
- ✅ Production-ready security

All features are fully implemented and tested! 🎉

