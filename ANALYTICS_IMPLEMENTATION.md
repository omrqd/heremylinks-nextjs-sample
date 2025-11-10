# Analytics Implementation Guide

## Overview

A comprehensive analytics system has been implemented to track link clicks, visitor information, and provide detailed statistics with real-time updates.

## Features

### 1. **Visitor Tracking**
- ✅ Unique visitor identification by IP address
- ✅ Geolocation data (Country, City, Region)
- ✅ Device type detection (Desktop, Mobile, Tablet)
- ✅ Browser identification
- ✅ Operating system detection
- ✅ Referrer tracking

### 2. **Analytics Dashboard**
- ✅ Total unique visitors count
- ✅ Total clicks across all links
- ✅ Today's click statistics
- ✅ Active links count
- ✅ Live visitor tracking (updates every 30 seconds)
- ✅ Top 10 countries by clicks
- ✅ Device breakdown with percentages
- ✅ Link performance table

### 3. **Detailed Link Analytics**
- ✅ Per-link click statistics
- ✅ Unique visitors per link
- ✅ Country distribution with click and visitor counts
- ✅ Device, browser, and OS breakdown
- ✅ Referrer sources
- ✅ Clicks over time (30-day chart data)
- ✅ Recent 50 clicks with details

### 4. **Real-time Features**
- ✅ Live visitor count (visitors in the last 60 seconds)
- ✅ Auto-refresh every 10 seconds
- ✅ Visual indicator for live visitors

## Database Schema

### Table: `link_analytics`

```sql
CREATE TABLE link_analytics (
  id UUID PRIMARY KEY,
  link_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Visitor Information
  visitor_ip VARCHAR(45) NOT NULL,
  visitor_country VARCHAR(100),
  visitor_city VARCHAR(100),
  visitor_region VARCHAR(100),
  
  -- Device Information
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  
  -- Referrer
  referrer TEXT,
  
  -- Timestamp
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (link_id) REFERENCES bio_links(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Indexes Created
- `idx_link_analytics_link_id` - Fast lookups by link
- `idx_link_analytics_user_id` - Fast lookups by user
- `idx_link_analytics_clicked_at` - Time-based queries
- `idx_link_analytics_visitor_ip` - Unique visitor counting
- `idx_link_analytics_user_link` - Combined user and link queries
- `idx_link_analytics_unique_visitor` - Daily unique visitor tracking

## API Endpoints

### 1. Track Click
**Endpoint:** `POST /api/track/click`

**Request Body:**
```json
{
  "linkId": "uuid"
}
```

**Functionality:**
- Records visitor information (IP, location, device, browser, OS)
- Uses IP geolocation API (ip-api.com)
- Updates link click_count
- Inserts analytics record

**Response:**
```json
{
  "success": true
}
```

### 2. Analytics Stats
**Endpoint:** `GET /api/analytics/stats`

**Authentication:** Required (session-based)

**Response:**
```json
{
  "totalUniqueVisitors": 150,
  "totalClicks": 320,
  "clicksToday": 25,
  "links": [
    {
      "id": "uuid",
      "title": "My Link",
      "url": "https://example.com",
      "click_count": 50,
      "uniqueVisitors": 35,
      "totalClicks": 50,
      "clicksToday": 5
    }
  ],
  "topCountries": [
    { "country": "United States", "clicks": 120 },
    { "country": "United Kingdom", "clicks": 45 }
  ],
  "deviceBreakdown": {
    "mobile": 180,
    "desktop": 120,
    "tablet": 20
  }
}
```

### 3. Link Details
**Endpoint:** `GET /api/analytics/link/[linkId]`

**Authentication:** Required (session-based)

**Response:**
```json
{
  "link": {
    "id": "uuid",
    "title": "My Link",
    "url": "https://example.com"
  },
  "totalClicks": 50,
  "uniqueVisitors": 35,
  "countries": [
    {
      "country": "United States",
      "clicks": 30,
      "uniqueVisitors": 20
    }
  ],
  "deviceBreakdown": { "mobile": 30, "desktop": 20 },
  "browserBreakdown": { "Chrome": 25, "Safari": 15, "Firefox": 10 },
  "osBreakdown": { "iOS": 20, "Windows": 15, "macOS": 10, "Android": 5 },
  "referrerBreakdown": { "Direct": 30, "google.com": 10, "twitter.com": 10 },
  "clicksOverTime": [
    { "date": "2025-11-01", "clicks": 5 },
    { "date": "2025-11-02", "clicks": 8 }
  ],
  "recentClicks": [
    {
      "country": "United States",
      "city": "New York",
      "device": "mobile",
      "browser": "Chrome",
      "os": "iOS",
      "timestamp": "2025-11-04T12:00:00Z"
    }
  ]
}
```

### 4. Live Visitors
**Endpoint:** `GET /api/analytics/live`

**Authentication:** Required (session-based)

**Functionality:**
- Returns visitors active in the last 60 seconds (1 minute)
- Counts unique IPs per link and overall
- Provides real-time insights

**Response:**
```json
{
  "totalLiveVisitors": 5,
  "linkLiveVisitors": [
    { "linkId": "uuid", "liveVisitors": 3 },
    { "linkId": "uuid2", "liveVisitors": 2 }
  ],
  "timestamp": "2025-11-04T12:00:00Z"
}
```

## Frontend Components

### Analytics Dashboard (`/dashboard/analytics`)

**Features:**
- Overview statistics cards
- Real-time live visitor indicator
- Link performance table
- Top countries list
- Device breakdown with visual progress bars
- Modal for detailed link analytics

**Auto-refresh:**
- Live visitors update every 30 seconds
- User can manually refresh by reloading the page

**Modal View:**
- Displays detailed analytics for a selected link
- Country distribution
- Device, browser, and OS breakdowns
- Recent clicks with timestamps and locations

## Setup Instructions

### 1. Run Database Migration

**For Supabase:**
```bash
# Apply the migration
psql your_database < database/migrations/003_add_analytics.sql

# Or use Supabase Dashboard SQL Editor
# Copy and paste the migration script
```

**Migration includes:**
- `link_analytics` table creation
- Indexes for performance
- RLS policies for security
- Helper views (optional)

### 2. Environment Variables

Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. IP Geolocation API

The system uses **ip-api.com** (free tier: 45 requests/minute).

**Alternatives:**
- **ipapi.co** (1,000 requests/day free)
- **ipgeolocation.io** (30,000 requests/month free)
- **MaxMind GeoLite2** (local database, unlimited)

To change the geolocation provider, modify the `getGeolocation()` function in `/app/api/track/click/route.ts`.

### 4. Testing

**Test the tracking:**
1. Publish your profile
2. Visit your public page: `yoursite.com/yourusername`
3. Click on one of your links
4. Go to Analytics Dashboard
5. Verify the click was recorded

**Test real-time updates:**
1. Open Analytics Dashboard
2. Keep it open
3. Click links on your public page from another device/browser
4. Watch the live visitor count update

## Security & Privacy

### Row Level Security (RLS)
- Users can only view analytics for their own links
- Public tracking endpoint is open but doesn't expose sensitive data
- Service role is used for backend operations

### Privacy Considerations
- IP addresses are stored for unique visitor counting
- No personally identifiable information (PII) is collected
- Consider adding a privacy policy to your site
- You may want to anonymize IPs after a certain period

### GDPR Compliance
To comply with GDPR:
1. Add a cookie/tracking consent banner
2. Implement IP anonymization (e.g., hash IPs)
3. Provide data export and deletion options
4. Add analytics opt-out functionality

## Performance Optimization

### Indexes
All necessary indexes are created automatically. These ensure:
- Fast link performance queries
- Efficient unique visitor counting
- Quick time-based lookups

### Caching Recommendations
- Cache geolocation results for 1 hour
- Use Redis for live visitor counts (optional)
- Consider aggregating old analytics data

### Rate Limiting
Consider implementing rate limiting on the tracking endpoint to prevent abuse:
```typescript
// Example with upstash/ratelimit
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
});
```

## Troubleshooting

### Issue: Geolocation not working
**Solution:** 
- Check if IP is localhost (127.0.0.1) - geolocation won't work
- Verify ip-api.com is accessible
- Check API rate limits (45 req/min for free tier)

### Issue: Live visitors always showing 0
**Solution:**
- Ensure tracking endpoint is being called
- Check if analytics records are being inserted
- Verify the 60-second time window calculation

### Issue: Duplicate visitors
**Solution:**
- Unique visitors are counted by IP address
- If the same person uses different networks, they count as different visitors
- This is expected behavior for IP-based tracking

### Issue: Analytics not appearing
**Solution:**
- Verify RLS policies are set correctly
- Check if user is authenticated
- Ensure link belongs to the authenticated user
- Check browser console for API errors

## Future Enhancements

Potential features to add:
- 📊 Visual charts (line charts, pie charts) using Chart.js or Recharts
- 📅 Custom date range filtering
- 📤 Export analytics to CSV/PDF
- 🔔 Real-time notifications for new visitors
- 🌐 Heatmap of visitor locations
- 📈 Conversion tracking
- 🔗 UTM parameter tracking
- 🎯 A/B testing for different link titles/layouts

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure database migrations have been applied
4. Check API endpoint responses in Network tab

---

**Built with ❤️ for heremylinks**

