# Quick Analytics Setup Guide

## Step 1: Apply Database Migration

Run this SQL script in your Supabase SQL Editor:

```sql
-- Navigate to: Supabase Dashboard → SQL Editor → New Query
-- Copy and paste from: database/migrations/003_add_analytics.sql
-- Or use the main schema: database/supabase-schema.sql (it's already updated)
```

The migration creates:
- ✅ `link_analytics` table
- ✅ Indexes for performance
- ✅ RLS security policies

## Step 2: Verify Environment Variables

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 3: Test the Analytics

### A. Test Click Tracking

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Publish your profile** (if not already published)

3. **Visit your public page:**
   ```
   http://localhost:3000/yourusername
   ```

4. **Click on a link** - tracking happens automatically

5. **Check the database:**
   ```sql
   SELECT * FROM link_analytics ORDER BY clicked_at DESC LIMIT 10;
   ```

### B. View Analytics Dashboard

1. **Navigate to:** `http://localhost:3000/dashboard/analytics`

2. **You should see:**
   - Total unique visitors
   - Total clicks
   - Today's clicks
   - Active links count
   - Live visitor indicator
   - Link performance table
   - Top countries
   - Device breakdown

3. **Click "View Details"** on any link to see:
   - Country distribution
   - Device/Browser/OS breakdown
   - Recent clicks with locations
   - Referrer sources

### C. Test Real-time Updates

1. **Open Analytics Dashboard** in one browser

2. **Open your public page** in another browser/device

3. **Click on links** on the public page

4. **Watch the live visitor count** update (refreshes every 30 seconds)

## Step 4: Production Considerations

### Geolocation API
Currently using **ip-api.com** (free tier: 45 requests/minute)

**For higher traffic, consider:**
- Upgrade to ip-api.com Pro ($13/month for 10,000 req/min)
- Use MaxMind GeoLite2 (local database, unlimited)
- Use Cloudflare's geolocation headers (if using Cloudflare)

### Privacy & GDPR
- Add a cookie consent banner
- Update your privacy policy
- Consider IP anonymization
- Provide data export/deletion options

### Performance
- Consider caching geolocation results
- Use Redis for live visitor counts (optional)
- Aggregate old analytics data monthly

## Troubleshooting

### Issue: "Table link_analytics does not exist"
**Solution:** Run the migration SQL script in Supabase

### Issue: Geolocation showing "Unknown" for countries
**Solution:** 
- This is normal for localhost (127.0.0.1)
- Deploy to production or use a tool like ngrok for testing
- Check if ip-api.com is accessible from your server

### Issue: Live visitors always 0
**Solution:**
- Make sure clicks are being tracked (check database)
- Wait 30 seconds for auto-refresh
- Click on links within the last 5 minutes

### Issue: "Unauthorized" in Analytics Dashboard
**Solution:**
- Make sure you're logged in
- Check if session is valid
- Verify SUPABASE_SERVICE_ROLE_KEY is set

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/track/click` | POST | Track link clicks | No |
| `/api/analytics/stats` | GET | Overall analytics | Yes |
| `/api/analytics/link/[linkId]` | GET | Detailed link stats | Yes |
| `/api/analytics/live` | GET | Live visitor count | Yes |

## Features Implemented

✅ **Visitor Tracking**
- IP-based unique visitor identification
- Country, City, Region detection
- Device type (Mobile, Desktop, Tablet)
- Browser and OS detection
- Referrer tracking

✅ **Analytics Dashboard**
- Total visitors and clicks
- Today's statistics
- Live visitor count (auto-refresh every 30s)
- Link performance table
- Top 10 countries
- Device breakdown with visual bars

✅ **Detailed Link Analytics Modal**
- Per-link statistics
- Country distribution with click and visitor counts
- Device, Browser, OS breakdowns
- Recent clicks with timestamps and locations
- Referrer sources

✅ **Real-time Updates**
- Live visitor tracking (5-minute window)
- Auto-refresh mechanism
- Visual indicator with pulsing dot

✅ **Security**
- Row Level Security (RLS) policies
- User can only see their own analytics
- Public tracking endpoint (no sensitive data exposed)

## What Happens When a Visitor Clicks a Link?

1. **Visitor clicks a link** on your public page
2. **Tracking API is called** (`/api/track/click`)
3. **System collects:**
   - Visitor's IP address
   - Geolocation (Country, City, Region)
   - Device type (Mobile/Desktop/Tablet)
   - Browser name
   - Operating system
   - Referrer URL
4. **Data is stored** in `link_analytics` table
5. **Link's click_count** is incremented
6. **Link opens** in new tab (user experience not affected)

## Next Steps

1. ✅ Apply the database migration
2. ✅ Test on localhost
3. ✅ Deploy to production
4. ✅ Monitor your analytics
5. 🎯 Add more features (charts, date filters, exports)

## Need Help?

Check the full documentation: `ANALYTICS_IMPLEMENTATION.md`

---

**Enjoy your new analytics system! 📊**

