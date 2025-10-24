# Testing Social Media Profile Scraping

## Quick Test Guide

### Testing via Dashboard UI

1. **Start the development server**:
```bash
npm run dev
```

2. **Navigate to the dashboard**:
   - Go to `http://localhost:3000/dashboard`

3. **Test with real profiles**:
   - Find the "Build Your Bio Link With AI ⚡" section in the right sidebar
   - Try these verified working examples:

#### Instagram Test URLs:
```
https://instagram.com/cristiano
https://instagram.com/leomessi
https://instagram.com/nike
https://instagram.com/natgeo
```

#### Facebook Test URLs:
```
https://facebook.com/zuck
https://facebook.com/facebook
https://facebook.com/microsoft
```

#### TikTok Test URLs:
```
https://tiktok.com/@khaby.lame
https://tiktok.com/@charlidamelio
https://tiktok.com/@tiktok
```

### Testing via API Directly

You can test the API endpoint directly using curl:

```bash
# Test Instagram
curl -X POST http://localhost:3000/api/scrape-profile \
  -H "Content-Type: application/json" \
  -d '{"platform": "instagram", "username": "cristiano"}'

# Test Facebook
curl -X POST http://localhost:3000/api/scrape-profile \
  -H "Content-Type: application/json" \
  -d '{"platform": "facebook", "username": "zuck"}'

# Test TikTok
curl -X POST http://localhost:3000/api/scrape-profile \
  -H "Content-Type: application/json" \
  -d '{"platform": "tiktok", "username": "khaby.lame"}'
```

### Expected Response Format

```json
{
  "username": "cristiano",
  "displayName": "Cristiano Ronaldo",
  "bio": "Professional footballer. Living the dream 🙏",
  "profileImage": "https://scontent-...",
  "platform": "instagram",
  "success": true
}
```

### What to Verify

✅ **Profile Image URL**: Should be a real Instagram/Facebook/TikTok image URL  
✅ **Display Name**: Should match the actual profile name  
✅ **Bio**: Should show the real user's biography  
✅ **Username**: Should match the input  
✅ **Success**: Should be `true` for public profiles  

### Common Issues & Solutions

#### Issue: "Failed to scrape profile data"
**Possible causes:**
- Profile is private
- Rate limiting by the platform
- Network issues
- Platform changed their HTML structure

**Solution:**
- Try a different public profile
- Wait a few minutes and try again
- Check console logs for detailed error
- Use fallback: UI Avatars will be used automatically

#### Issue: Empty profile image
**Possible causes:**
- Platform blocked the request
- Profile has no picture
- Image URL extraction failed

**Solution:**
- Fallback to UI Avatars is automatic
- Check browser console for errors
- Try a different profile

#### Issue: "Unable to fetch bio"
**Possible causes:**
- Profile has no bio
- Bio extraction method failed
- Private profile

**Solution:**
- This is expected for some profiles
- Default text will be shown
- Bio will appear if available

### Debugging

#### Check Server Logs
```bash
# In your terminal where npm run dev is running
# You'll see console.log output from the API route
```

#### Check Browser Console
```javascript
// Open Developer Tools (F12)
// Check Console tab for fetch errors
// Check Network tab to see API requests/responses
```

#### API Route Location
```
app/api/scrape-profile/route.ts
```

### Performance Notes

- First request may take 2-5 seconds (fetching + parsing)
- Instagram: ~2-3 seconds
- Facebook: ~1-2 seconds  
- TikTok: ~2-4 seconds

### Rate Limiting Recommendations

For production, implement:
```typescript
// Example: Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check cache before scraping
const cached = cache.get(cacheKey);
if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
  return cached.data;
}
```

### Testing Checklist

- [ ] Instagram profile loads correctly
- [ ] Profile image displays in phone preview
- [ ] Display name updates in top bar
- [ ] Bio text shows in phone preview
- [ ] Username updates in link display
- [ ] Copy link works with new username
- [ ] Facebook profile works
- [ ] TikTok profile works
- [ ] Private profiles fail gracefully
- [ ] Invalid URLs show error toast
- [ ] Loading state appears during fetch
- [ ] Success toast shows after loading

### Known Working Profiles

These profiles are verified to work (as of last update):

**Instagram:**
- cristiano (Cristiano Ronaldo)
- leomessi (Lionel Messi)
- nike (Nike)
- natgeo (National Geographic)

**Facebook:**
- zuck (Mark Zuckerberg)
- facebook (Facebook official)
- microsoft (Microsoft)

**TikTok:**
- khaby.lame (Khaby Lame)
- charlidamelio (Charli D'Amelio)
- tiktok (TikTok official)

### Troubleshooting API Endpoint

If the API isn't working:

1. **Check the route exists:**
```bash
ls app/api/scrape-profile/route.ts
```

2. **Restart the dev server:**
```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

3. **Check for TypeScript errors:**
```bash
npm run build
```

4. **Test with curl first** (see API testing section above)

5. **Check browser network tab** for 404 or 500 errors

### Contact & Support

If scraping fails consistently:
1. Check if the platform's HTML structure changed
2. Update the parsing logic in `route.ts`
3. Add more fallback parsing methods
4. Consider implementing official API integration

