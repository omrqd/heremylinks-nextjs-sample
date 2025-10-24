# Social Media Profile Import Feature

## Overview
The dashboard now supports automatic profile import from Instagram, Facebook, and TikTok! Simply paste a social media profile URL and the system will extract the username and generate a personalized bio link page.

## Supported Platforms

### 🎨 Instagram
- **URL Formats:**
  - `https://instagram.com/username`
  - `https://www.instagram.com/username`
  - `https://instagram.com/@username`

### 👥 Facebook
- **URL Formats:**
  - `https://facebook.com/username`
  - `https://www.facebook.com/username`
  - `https://fb.com/username`

### 🎵 TikTok
- **URL Formats:**
  - `https://tiktok.com/@username`
  - `https://www.tiktok.com/@username`
  - `https://tiktok.com/username`

## How It Works

### 1. Paste URL
In the dashboard's right sidebar AI Builder section, paste any supported social media profile URL.

### 2. Automatic Extraction
The system automatically:
- Detects the platform (Instagram, Facebook, or TikTok)
- Extracts the username from the URL
- Validates the URL format

### 3. Profile Generation
Once extracted:
- Updates the profile name to `@username`
- Generates a profile avatar using the username
- Updates the bio link URL to `heremylinks.com/username`
- Adds platform-specific bio links
- Shows the profile picture in the phone preview

### 4. Real Data Scraping
The feature now scrapes **real profile data** from social media platforms:
- ✅ **Real profile images** - Fetches actual profile pictures
- ✅ **Real usernames** - Extracts the actual display name
- ✅ **Real bios** - Gets the user's bio/description
- ⚡ **Live data** - Fresh data fetched on demand
- 🔄 **Fallback system** - Uses UI Avatars if scraping fails

## Example Usage

```javascript
// Try these URLs in the AI Builder:
https://instagram.com/nike
https://facebook.com/zuck
https://tiktok.com/@charlidamelio
```

## Implementation Details

### Current Implementation: Web Scraping

The system uses **server-side web scraping** via a Next.js API route (`/api/scrape-profile`):

```typescript
// API Route: app/api/scrape-profile/route.ts
POST /api/scrape-profile
{
  "platform": "instagram",
  "username": "cristiano"
}

Response:
{
  "username": "cristiano",
  "displayName": "Cristiano Ronaldo",
  "bio": "Professional footballer...",
  "profileImage": "https://...",
  "platform": "instagram",
  "success": true
}
```

### How It Works:

1. **Server-Side Scraping**: Avoids CORS issues by scraping on the server
2. **HTML Parsing**: Extracts data from:
   - Meta tags (`og:title`, `og:image`, `og:description`)
   - JSON-LD structured data
   - Embedded JavaScript data objects
3. **Multiple Fallbacks**: Tries different parsing methods for reliability
4. **Error Handling**: Returns fallback data if scraping fails

### Alternative: Official APIs

For higher reliability and compliance, you can integrate official APIs:

### Instagram Graph API
```javascript
// Requires Facebook Developer account and access token
const fetchInstagramProfile = async (username) => {
  const response = await fetch(
    `https://graph.instagram.com/${userId}?fields=username,name,profile_picture_url&access_token=${ACCESS_TOKEN}`
  );
  return await response.json();
};
```

### Facebook Graph API
```javascript
// Requires Facebook App ID and access token
const fetchFacebookProfile = async (username) => {
  const response = await fetch(
    `https://graph.facebook.com/${username}?fields=name,picture&access_token=${ACCESS_TOKEN}`
  );
  return await response.json();
};
```

### TikTok API
```javascript
// Requires TikTok Developer approval
// TikTok's public API is more restrictive
// Consider using web scraping with proper rate limiting
```

## Features Implemented

✅ URL validation and parsing  
✅ Username extraction for all three platforms  
✅ Dynamic profile name updates  
✅ Profile image display in phone preview  
✅ Automatic bio link generation  
✅ Platform-specific notifications  
✅ Error handling for invalid URLs  
✅ Loading states during generation  

## User Interface Updates

1. **Top Bar Profile**: Displays extracted username
2. **Link Display**: Shows personalized heremylinks.com URL
3. **Phone Preview**: 
   - Shows profile image
   - Updates display name
   - Auto-generates bio links
4. **AI Builder**: 
   - Updated description
   - Example URLs hint
   - Platform-specific feedback

## Code Structure

### Key Functions

- `extractSocialMediaInfo()`: Parses URLs and extracts platform/username
- `fetchProfileData()`: Simulates API calls to get profile data
- `handleGenerate()`: Main handler that orchestrates the import process

### State Management

```typescript
interface ProfileData {
  username: string;
  displayName: string;
  profileImage: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | null;
}
```

## Future Enhancements

- [ ] Integration with real social media APIs
- [ ] Support for more platforms (YouTube, Twitter, LinkedIn)
- [ ] Fetch actual follower counts and bio descriptions
- [ ] Import existing social media posts as bio links
- [ ] Automatic profile verification
- [ ] Scheduled profile updates
- [ ] Multi-account management

## Technical Notes

### Current Status
✅ **Real Data Scraping** - Now fetches actual profile data  
✅ **Instagram** - Extracts username, bio, and profile picture  
✅ **Facebook** - Scrapes public profile information  
✅ **TikTok** - Gets user data from embedded JSON  
✅ **Error Handling** - Graceful fallbacks on failure  
✅ **Server-Side** - Avoids CORS and client-side limitations  

### Limitations & Considerations

⚠️ **Rate Limiting**: 
- Social media platforms may block excessive requests
- Implement caching and rate limiting for production

⚠️ **Terms of Service**:
- Web scraping may violate platform ToS
- Consider official APIs for commercial use
- Public data only - respects user privacy

⚠️ **Reliability**:
- HTML structure changes may break scrapers
- Implement monitoring and alerts
- Regular maintenance required

⚠️ **Private Profiles**:
- Only works with public profiles
- Returns fallback data for private accounts

### Recommendations for Production

1. **Implement Caching**: Store scraped data temporarily
2. **Rate Limiting**: Limit requests per user/IP
3. **Queue System**: Process requests asynchronously
4. **Monitoring**: Track success/failure rates
5. **Official APIs**: Migrate to official APIs when possible
6. **Legal Review**: Ensure compliance with platform ToS

