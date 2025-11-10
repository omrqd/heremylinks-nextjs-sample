# Template System

## Overview

The template system allows users to browse and apply pre-designed templates from featured users. Users can preview templates and apply them with a single click, copying all design settings while preserving their own content and profile picture.

## Features

### ✅ What Gets Copied
When a user applies a template, the following settings are copied:
- **Template/Layout** (`template`)
- **Theme color** (`theme_color`)
- **Background color** (`background_color`)
- **Background image** (`background_image`)
- **Background video** (`background_video`)
- **Card background color** (`card_background_color`)
- **Card background image** (`card_background_image`)
- **Card background video** (`card_background_video`)
- **Username color** (`username_color`)
- **Bio color** (`bio_color`)
- **Custom text color** (`custom_text_color`)
- **Hero image** (`hero_image`)
- **Hero height** (`hero_height`)
- **Hide profile picture setting** (`hide_profile_picture`)

### ❌ What Does NOT Get Copied
The following personal information is preserved:
- **Profile picture** (`profile_image`)
- **Name** (`name`)
- **Bio** (`bio`)
- **Username** (`username`)
- **Links** (`bio_links`)
- **Social links** (`social_links`)
- **Custom text** (`custom_text`)
- **Premium status**
- **Any other personal content**

## File Structure

```
app/
├── dashboard/
│   └── templates/
│       ├── page.tsx              # Main templates page
│       └── templates.module.css  # Styles
└── api/
    └── templates/
        ├── preview/
        │   └── route.ts          # GET - Fetch template data
        └── apply/
            └── route.ts          # POST - Apply template
```

## API Endpoints

### 1. Preview Template
**GET** `/api/templates/preview?username={username}`

**Response:**
```json
{
  "username": "mrcoperlive",
  "name": "Mr Coper",
  "bio": "...",
  "template": "template3",
  "themeColor": "#667eea",
  "backgroundColor": "#ffffff",
  "backgroundImage": "...",
  "backgroundVideo": "...",
  ...
}
```

### 2. Apply Template
**POST** `/api/templates/apply`

**Request:**
```json
{
  "sourceUsername": "mrcoperlive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Template applied successfully"
}
```

## Adding New Templates

To add a new template user, simply add their username to the array in `page.tsx`:

```typescript
const TEMPLATE_USERS = [
  'mrcoperlive',
  'moramoqa',
  'newusername',  // Add here
];
```

**Requirements for template users:**
- Must have `is_published = true` in database
- Should have a complete, attractive profile design
- Profile should be accessible at `/{username}`

## User Flow

1. **Browse Templates**
   - User visits `/dashboard/templates`
   - Templates load as iframes showing live previews
   - Hover to see "Full Preview" button

2. **Preview Template**
   - Click "Full Preview" to open template in new tab
   - See the full design in action

3. **Apply Template**
   - Click "Apply Template" button
   - Confirmation dialog appears
   - On confirm, template settings are copied
   - User is redirected to dashboard with new design

4. **Result**
   - All design settings updated
   - Profile picture and content preserved
   - Ready to customize further if needed

## UI Design

### Layout
- Dashboard sidebar and topbar (consistent with analytics/billing pages)
- **Horizontal slider/carousel** layout showing templates
- Each card contains:
  - Live iframe preview
  - Template author info
  - Feature badges
  - Apply button

### Navigation
- **Left/Right Arrow Buttons**: Navigate between templates
- **Swipe Gesture Support**: Swipe left/right on touch devices
- **Mouse Wheel**: Scroll horizontally with mouse wheel
- **Scroll Snap**: Templates snap to center for better viewing

### Features Displayed
- Template name
- Background type (video/image)
- Author avatar and name
- Swipe indicator with pulsing animation

### Responsive
- Desktop: 450px wide cards
- Tablet: 380px wide cards
- Mobile: 320px wide cards
- Small Mobile: 280px wide cards

## Technical Details

### Preview System
Templates are loaded in iframes with `pointer-events: none` to prevent interaction while still showing the live design.

```css
.templateIframe {
  width: 100%;
  height: 100%;
  border: none;
  pointer-events: none;
}
```

### Slider System
Horizontal carousel with smooth scrolling and snap behavior:

```css
.templatesSlider {
  display: flex;
  gap: 2rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* Hide scrollbar */
}

.templateCard {
  flex: 0 0 450px;
  min-width: 450px;
  scroll-snap-align: center;
}
```

### Navigation Controls
- **Arrow Buttons**: Positioned absolutely on left/right, scroll container by 450px
- **Touch Support**: `-webkit-overflow-scrolling: touch` for smooth mobile scrolling
- **Scroll Snap**: Templates automatically snap to center position
- **Hidden Scrollbar**: Scrollbar hidden for cleaner look, but scrolling still works

### Apply Process

1. **Validation**
   - Check user is authenticated
   - Verify source template exists
   - Verify source user is published

2. **Copy Settings**
   - Fetch all design settings from source user
   - Update current user's design settings
   - Preserve personal content

3. **Confirmation**
   - Show success message
   - Redirect to dashboard
   - User sees new design immediately

### Security

- **Authentication**: Required for applying templates
- **RLS**: Users can only update their own profile
- **Published Check**: Only published profiles can be used as templates
- **No Content Copy**: Links and personal info are never copied

## Console Logging

When applying a template, you'll see:
```
📋 [Template Apply] User: user@example.com Source: mrcoperlive
✨ [Template Apply] Applying template settings...
✅ [Template Apply] Template applied successfully!
```

## Troubleshooting

### Template not loading
**Check:**
1. Is the username correct?
2. Is `is_published = true` in database?
3. Check browser console for errors

### Apply button not working
**Check:**
1. User is authenticated?
2. Network tab for API errors
3. Check server console logs

### Design not updating after apply
**Check:**
1. Hard refresh the dashboard (Cmd/Ctrl + Shift + R)
2. Check database if fields were updated:
   ```sql
   SELECT template, theme_color, background_image 
   FROM users 
   WHERE email = 'user@example.com';
   ```

## Future Enhancements

Potential features:
- 🎨 Template categories (business, personal, creative, etc.)
- ⭐ Template ratings and favorites
- 🔍 Search and filter templates
- 📸 Static screenshots instead of iframes (better performance)
- 🎯 Premium-only templates
- 📝 Template descriptions and tags
- 👥 User-submitted templates
- 📱 Mobile preview mode
- 🎨 Customization wizard after applying
- 💾 Save custom templates
- 📊 Track which templates are most popular

## Best Practices

### For Template Creators
- Use high-quality images
- Test on different screen sizes
- Use contrasting colors for readability
- Avoid too many animations
- Keep it professional

### For Users
- Preview before applying
- Customize after applying to make it your own
- Test your new design on mobile
- Update your links to match the new style

---

**Your template system is ready to use! 🎨**

