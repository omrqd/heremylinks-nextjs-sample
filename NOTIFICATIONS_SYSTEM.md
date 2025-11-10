# 🔔 Notification System - Complete Implementation

## Overview

A complete notification system that allows admins to send notifications to users, with real-time display, email integration, and read/unread tracking.

---

## 🗄️ Database Schema

### Notifications Table

Run the migration: `database/migrations/007_add_notifications_system.sql`

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',  -- 'info', 'success', 'warning', 'error'
  link TEXT DEFAULT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
```

**Fields:**
- `id` - Unique notification ID
- `user_id` - User who receives the notification
- `title` - Notification title (max 255 chars)
- `message` - Notification message (text)
- `type` - Notification type: info, success, warning, error
- `link` - Optional action link/URL
- `is_read` - Read status (default: false)
- `email_sent` - Whether email was sent (default: false)
- `created_at` - Timestamp

---

## 📡 API Endpoints

### 1. User Endpoints

#### GET `/api/notifications`
Get user's notifications with filtering

**Query Parameters:**
- `limit` - Number of notifications (default: 50)
- `unreadOnly` - Show only unread notifications (true/false)

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "Welcome!",
      "message": "Welcome to HereMyLinks",
      "type": "info",
      "link": "https://example.com",
      "is_read": false,
      "email_sent": true,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### GET `/api/notifications/unread-count`
Get count of unread notifications

**Response:**
```json
{
  "count": 5
}
```

#### PATCH `/api/notifications/[id]/read`
Mark a single notification as read

**Response:**
```json
{
  "success": true
}
```

#### PATCH `/api/notifications/read-all`
Mark all user's notifications as read

**Response:**
```json
{
  "success": true,
  "updated": 10
}
```

### 2. Admin Endpoints

#### POST `/api/admin/notifications/send`
Send notifications to users (Admin only)

**Request Body:**
```json
{
  "targetType": "all" | "specific",
  "targetUserId": "uuid",  // Required if targetType is 'specific'
  "title": "Notification Title",
  "message": "Notification message",
  "type": "info" | "success" | "warning" | "error",
  "link": "https://example.com",  // Optional
  "sendEmail": true | false
}
```

**Response:**
```json
{
  "success": true,
  "notificationsSent": 150,
  "emailsSent": 150
}
```

**Features:**
- Send to specific user or all users
- Optional email alerts via Resend
- Beautiful HTML email template
- Support for different notification types
- Optional action links
- Email tracking

---

## 🎨 User Interface

### 1. User Dashboard Notifications

**Location:** `/app/dashboard/page.tsx`

**Features:**
- Bell icon in top bar with unread count badge
- Dropdown showing 5 most recent notifications
- Red badge showing unread count (e.g., "3")
- Real-time updates every 30 seconds
- Click to view all notifications
- Color-coded by type (info/success/warning/error)
- Visual indicator for unread notifications

**Bell Icon Badge:**
- Shows count of unread notifications
- Red background (#ef4444)
- Displays "9+" if more than 9 unread
- Only visible when unread > 0

**Dropdown Features:**
- Shows latest 5 notifications
- Title and truncated message (80 chars)
- Timestamp with relative time
- Type icon (info/success/warning/error)
- "Show all notifications" button
- Empty state: "No notifications yet"

### 2. All Notifications Page

**Location:** `/app/dashboard/notifications/page.tsx`

**Features:**
- Full list of all notifications
- Filter tabs: "All" and "Unread"
- Individual "Mark as read" buttons
- "Mark all as read" button (when unread > 0)
- Full notification content
- Clickable action links (if provided)
- Timestamps
- Color-coded type indicators
- Read/unread visual distinction
- Empty state for no notifications

**UI Elements:**
- Header with title and unread count
- Filter tabs for All/Unread
- Notification cards with:
  - Type icon with color
  - Title (bold)
  - Full message
  - Timestamp
  - Action link (if available)
  - Mark as read button
  - Visual "unread" indicator (purple dot)

### 3. Admin Send Notifications Page

**Location:** `/app/admin/notifications/page.tsx`

**Features:**
- Beautiful dark gradient design
- Send to all users or specific user
- User selection dropdown (loads all users)
- Notification type selector (info/success/warning/error)
- Title and message fields
- Optional action link
- Optional email alert checkbox
- Success/error messages
- Form validation
- Auto-clears on successful send

**Form Fields:**
1. **Send To:** Radio buttons (All Users / Specific User)
2. **Select User:** Dropdown (if specific user selected)
3. **Notification Type:** Grid of 4 options with icons
   - Info (blue)
   - Success (green)
   - Warning (yellow)
   - Error (red)
4. **Title:** Text input (required)
5. **Message:** Textarea (required)
6. **Action Link:** URL input (optional)
7. **Send Email Alert:** Checkbox (optional)

---

## ✉️ Email Integration

### Setup Resend

1. **Get API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Get your API key

2. **Add to `.env.local`:**
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```

3. **Verify Domain:**
   - Add your domain to Resend
   - Verify DNS records
   - Or use Resend's test domain for development

### Email Template

Beautiful HTML email with:
- Company logo
- Notification type badge
- Title and message
- Action button (if link provided)
- Footer with company info
- Responsive design
- Professional styling

**Email Triggers:**
- Only when "Send Email Alert" is checked
- Sends to user's registered email
- Tracks email_sent status in database
- Graceful error handling (notification still saved if email fails)

---

## 🔄 Real-Time Updates

### Dashboard Auto-Refresh

The user dashboard automatically refreshes notifications every 30 seconds:

```typescript
useEffect(() => {
  const loadNotifications = async () => {
    // Load unread count and recent notifications
  };
  
  loadNotifications();
  
  // Refresh every 30 seconds
  const interval = setInterval(loadNotifications, 30000);
  return () => clearInterval(interval);
}, [status]);
```

**What Gets Updated:**
- Unread notification count
- Recent 5 notifications in dropdown
- Badge visibility and count

---

## 🎯 Notification Types

### Info (Default)
- **Icon:** fa-info-circle
- **Color:** Blue (#3b82f6)
- **Use Cases:** General updates, announcements

### Success
- **Icon:** fa-check-circle
- **Color:** Green (#10b981)
- **Use Cases:** Achievements, successful actions

### Warning
- **Icon:** fa-exclamation-triangle
- **Color:** Yellow/Orange (#f59e0b)
- **Use Cases:** Important notices, reminders

### Error
- **Icon:** fa-times-circle
- **Color:** Red (#ef4444)
- **Use Cases:** Critical alerts, issues

---

## 🚀 Usage Examples

### 1. Send Notification to All Users

```json
POST /api/admin/notifications/send
{
  "targetType": "all",
  "title": "New Feature Available!",
  "message": "We've just launched our new analytics dashboard. Check it out now!",
  "type": "success",
  "link": "/dashboard/analytics",
  "sendEmail": true
}
```

### 2. Send Warning to Specific User

```json
POST /api/admin/notifications/send
{
  "targetType": "specific",
  "targetUserId": "user-uuid-here",
  "title": "Account Verification Required",
  "message": "Please verify your email address to continue using premium features.",
  "type": "warning",
  "link": "/dashboard/settings",
  "sendEmail": true
}
```

### 3. Send Error Notification (No Email)

```json
POST /api/admin/notifications/send
{
  "targetType": "specific",
  "targetUserId": "user-uuid-here",
  "title": "Payment Failed",
  "message": "Your recent payment attempt failed. Please update your payment method.",
  "type": "error",
  "link": "/dashboard/billing",
  "sendEmail": false
}
```

---

## 📋 Testing Checklist

### Database
- [ ] Run migration successfully
- [ ] Verify table exists in Supabase
- [ ] Check indexes are created
- [ ] Test constraints (foreign key, etc.)

### API Endpoints
- [ ] GET /api/notifications - Returns user's notifications
- [ ] GET /api/notifications?unreadOnly=true - Filters unread
- [ ] GET /api/notifications?limit=5 - Limits results
- [ ] GET /api/notifications/unread-count - Returns count
- [ ] PATCH /api/notifications/[id]/read - Marks as read
- [ ] PATCH /api/notifications/read-all - Marks all read
- [ ] POST /api/admin/notifications/send - Sends to all users
- [ ] POST /api/admin/notifications/send - Sends to specific user

### User Dashboard
- [ ] Bell icon appears in top bar
- [ ] Badge shows when unread > 0
- [ ] Badge displays correct count
- [ ] Badge shows "9+" when count > 9
- [ ] Clicking bell opens dropdown
- [ ] Dropdown shows recent 5 notifications
- [ ] Dropdown shows "No notifications" when empty
- [ ] "Show all notifications" navigates to full page
- [ ] Auto-refresh works (30s interval)

### Notifications Page
- [ ] Page displays all notifications
- [ ] Filter tabs work (All/Unread)
- [ ] "Mark as read" button works
- [ ] "Mark all as read" button works
- [ ] Timestamps display correctly
- [ ] Action links work (if provided)
- [ ] Read/unread visual distinction
- [ ] Empty state displays correctly

### Admin Send Page
- [ ] Page accessible to admins only
- [ ] User dropdown loads all users
- [ ] Notification type selector works
- [ ] Form validation works
- [ ] Success message displays
- [ ] Error handling works
- [ ] Form clears after successful send

### Email Integration
- [ ] Email sends when checkbox is checked
- [ ] Email doesn't send when checkbox is unchecked
- [ ] Email contains correct content
- [ ] Email template renders correctly
- [ ] Action button works in email
- [ ] email_sent field updates correctly

---

## 🔧 Configuration

### Environment Variables

```env
# Required for notifications
RESEND_API_KEY=re_your_api_key_here

# Already configured
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Email Settings

Edit `/app/api/admin/notifications/send/route.ts` to customize:

```typescript
// Company branding
from: 'HereMyLinks <notifications@heremylinks.com>',

// Email template colors
background: '#f8f9ff',
primaryColor: '#8B5CF6',
textColor: '#1e293b',
```

---

## 🐛 Troubleshooting

### Notifications Not Showing

1. Check database migration ran successfully
2. Verify user is authenticated
3. Check browser console for API errors
4. Verify Supabase connection

### Email Not Sending

1. Check RESEND_API_KEY is set
2. Verify domain is configured in Resend
3. Check browser console for errors
4. Verify email address is valid
5. Check Resend dashboard for delivery logs

### Badge Not Updating

1. Check browser console for API errors
2. Verify auto-refresh is working (30s interval)
3. Clear browser cache
4. Check network tab for API calls

### Admin Can't Send Notifications

1. Verify user is admin (check is_admin in database)
2. Check admin route protection in middleware
3. Verify API endpoint permissions
4. Check browser console for errors

---

## 📚 Files Created/Modified

### New Files

1. `database/migrations/007_add_notifications_system.sql` - Database schema
2. `app/api/notifications/route.ts` - Get user notifications
3. `app/api/notifications/unread-count/route.ts` - Get unread count
4. `app/api/notifications/[id]/read/route.ts` - Mark as read
5. `app/api/notifications/read-all/route.ts` - Mark all read
6. `app/api/admin/notifications/send/route.ts` - Send notifications
7. `app/admin/notifications/page.tsx` - Admin send page
8. `app/dashboard/notifications/page.tsx` - User notifications page
9. `NOTIFICATIONS_SYSTEM.md` - This documentation

### Modified Files

1. `app/dashboard/page.tsx` - Added bell icon, dropdown, auto-refresh
2. `app/admin/page.tsx` - Already had notifications link

---

## 🎉 Features Summary

✅ Send notifications to specific user or all users
✅ Optional email alerts via Resend
✅ Beautiful HTML email template
✅ Real-time notification count badge
✅ Dropdown with recent 5 notifications
✅ Full notifications page with filtering
✅ Mark as read/unread functionality
✅ Color-coded notification types
✅ Optional action links in notifications
✅ Auto-refresh every 30 seconds
✅ Admin-only send interface
✅ User-friendly UI/UX
✅ Responsive design
✅ Empty states
✅ Error handling
✅ Loading states

---

## 🚀 Next Steps (Optional Enhancements)

1. **Push Notifications**
   - Add web push notifications
   - Implement service worker
   - Request notification permissions

2. **Advanced Filtering**
   - Filter by type
   - Filter by date range
   - Search notifications

3. **Notification Preferences**
   - Let users choose notification types
   - Email preference settings
   - Frequency settings

4. **Notification Templates**
   - Pre-defined notification templates
   - Quick send common messages
   - Template management

5. **Scheduled Notifications**
   - Schedule notifications for future
   - Recurring notifications
   - Batch processing

6. **Analytics**
   - Track notification open rates
   - Email delivery statistics
   - User engagement metrics

---

**🎯 Status: COMPLETE AND READY TO TEST!**

Run the database migration and start testing the full notification system!

