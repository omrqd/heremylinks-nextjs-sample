# Page View Tracking - Live Visitors System

## Overview

The analytics system now tracks **actual page visitors** (people viewing your profile page) in real-time, not just link clicks. This provides accurate live visitor counts showing who is currently on your page.

## How It Works

### 1. **Page View Tracking**
When someone visits your public profile page (`/{username}`):
- A unique session ID is generated
- Initial page view is recorded with visitor details (IP, location, device, etc.)
- A "heartbeat" signal is sent every 15 seconds to update `last_seen` timestamp
- Session automatically expires after 60 seconds of inactivity

### 2. **Live Visitor Count**
The analytics dashboard shows:
- **Real-time count** of visitors currently on your page
- Updated every 10 seconds
- Only counts visitors active in the last 60 seconds
- Based on heartbeat signals, not just clicks

### 3. **Heartbeat System**
```
User opens page → Initial tracking
    ↓
Every 15 seconds → Send heartbeat (update last_seen)
    ↓
If no heartbeat for 60 seconds → Session expires → No longer counted as "live"
```

## Database Schema

### Table: `page_views`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Profile owner |
| `visitor_ip` | VARCHAR(45) | Visitor IP address |
| `session_id` | VARCHAR(255) | Unique session identifier |
| `visitor_country` | VARCHAR(100) | Country name |
| `visitor_city` | VARCHAR(100) | City name |
| `visitor_region` | VARCHAR(100) | Region/State |
| `user_agent` | TEXT | Browser user agent |
| `device_type` | VARCHAR(50) | desktop, mobile, tablet |
| `browser` | VARCHAR(100) | Browser name |
| `os` | VARCHAR(100) | Operating system |
| `referrer` | TEXT | Referrer URL |
| `first_seen` | TIMESTAMP | First visit time |
| `last_seen` | TIMESTAMP | Last heartbeat time |

### Unique Constraint
- `(user_id, session_id)` ensures one record per session

## API Endpoints

### Track Page View
**Endpoint:** `POST /api/track/page-view`

**Request:**
```json
{
  "username": "yourname",
  "sessionId": "1730726400000_abc123xyz"
}
```

**Purpose:**
- Initial visit: Creates new page view record
- Heartbeat: Updates `last_seen` timestamp

**Response:**
```json
{
  "success": true
}
```

### Get Live Visitors
**Endpoint:** `GET /api/analytics/live`

**Response:**
```json
{
  "totalLiveVisitors": 5,
  "visitorDetails": [
    {
      "country": "United States",
      "city": "New York",
      "lastSeen": "2025-11-04T12:00:00Z"
    }
  ],
  "timestamp": "2025-11-04T12:00:30Z",
  "timeWindow": "60 seconds"
}
```

## Client-Side Implementation

### PublicBioPage Component

Added to `/app/[username]/PublicBioPage.tsx`:

```typescript
useEffect(() => {
  // Generate unique session ID
  const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Track page view
  const trackPageView = async () => {
    await fetch('/api/track/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username,
        sessionId: sessionId,
      }),
    });
  };
  
  // Initial tracking
  trackPageView();
  
  // Heartbeat every 15 seconds
  const heartbeatInterval = setInterval(trackPageView, 15000);
  
  // Cleanup
  return () => clearInterval(heartbeatInterval);
}, [user.username]);
```

## Setup Instructions

### 1. Run Database Migration

```sql
-- In Supabase SQL Editor
-- Run: database/migrations/004_add_page_views.sql
```

Or use the updated main schema:
```sql
-- Run: database/supabase-schema.sql
```

### 2. No Code Changes Needed

The system is automatically active! Just:
1. Apply the database migration
2. Restart your development server (if running)
3. Visit your public page

### 3. Test Live Visitors

**Test 1: Single Visitor**
1. Open Analytics Dashboard
2. In another browser/tab, visit `localhost:3000/yourusername`
3. Within 10 seconds, you'll see "1 Live Visitor"
4. Close the page tab
5. After 60 seconds, it will show "0 Live Visitors"

**Test 2: Multiple Visitors**
1. Open your public page in multiple browsers/incognito tabs
2. Check Analytics Dashboard
3. You'll see the total count of all open sessions

**Test 3: Heartbeat System**
1. Open your public page
2. Watch your terminal/console for heartbeat logs:
   ```
   👁️ [Page View] Initializing tracking for session: ...
   💚 [Page View] Heartbeat sent
   💚 [Page View] Heartbeat sent
   👋 [Page View] Session ending: ...
   ```

## Console Logging

### Client Side (Browser Console)
```
👁️ [Page View] Initializing tracking for session: 1730726400000_abc123
💚 [Page View] Heartbeat sent
💚 [Page View] Heartbeat sent
👋 [Page View] Session ending: 1730726400000_abc123
```

### Server Side (Terminal)
```
👁️ [Page View] Tracking view for: yourname Session: 1730726400000_abc123
📍 [Page View] Visitor IP: ::1 Device: desktop
✨ [Page View] New session detected
✅ [Page View] Session created successfully
💚 [Page View] Updating heartbeat for existing session
🔴 Live page visitors found: 1
🔴 Total live visitors (active sessions): 1
```

## Differences: Page Views vs Link Clicks

### Before (Link Clicks Only):
- ❌ Visitor must click a link to be tracked
- ❌ Only shows "live" based on link interaction
- ❌ Doesn't track people just viewing the page

### After (Page View Tracking):
- ✅ Tracks all page visitors immediately
- ✅ Real-time heartbeat updates
- ✅ Accurate "live" count of actual page viewers
- ✅ Still tracks link clicks separately for detailed analytics

## Automatic Cleanup

Old sessions automatically become "inactive" after 60 seconds without a heartbeat. No manual cleanup needed!

The database will grow with sessions, but you can optionally add a cleanup job:

```sql
-- Optional: Clean up old page_views (older than 24 hours)
DELETE FROM page_views 
WHERE last_seen < NOW() - INTERVAL '24 hours';
```

## Performance

- **Lightweight**: Each heartbeat is ~200 bytes
- **Efficient**: Uses upsert logic (update if exists, insert if new)
- **Scalable**: Indexed on `last_seen` for fast queries
- **Minimal overhead**: Heartbeat every 15s = 4 requests/minute per visitor

## Privacy Considerations

- IP addresses are stored (for unique counting)
- Session IDs are temporary and non-personal
- No cookies are used
- Sessions auto-expire after 60 seconds
- Consider anonymizing IPs for GDPR compliance

## Troubleshooting

### Issue: Live visitors always showing 0
**Check:**
1. Database migration applied?
   ```sql
   SELECT * FROM page_views LIMIT 5;
   ```
2. Public page is loading?
3. Browser console shows heartbeats?
4. Terminal shows tracking logs?

### Issue: Visitor count not decreasing
**Check:**
1. Heartbeat stopped when page closed?
2. 60-second timeout configured correctly?
3. Check `last_seen` timestamps in database:
   ```sql
   SELECT session_id, last_seen, NOW() - last_seen as age 
   FROM page_views 
   ORDER BY last_seen DESC;
   ```

### Issue: Multiple counts for same person
**Expected:** Opening the page in multiple tabs/browsers creates multiple sessions
**Solution:** This is correct behavior - each tab is a unique visitor

## Future Enhancements

Potential additions:
- 📊 Track session duration (first_seen to last_seen)
- 🗺️ Live visitor map showing locations
- 📈 Page view analytics (separate from link clicks)
- 🔔 Real-time notifications when someone visits
- 📱 Mobile app with push notifications
- 🎯 Track which sections visitors view (scroll depth)

---

**Your live visitor tracking is now fully operational! 🎉**

