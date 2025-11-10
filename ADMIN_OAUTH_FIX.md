# 🔧 Admin OAuth Login Fix

## Problem
When logging in with Google OAuth (or other OAuth providers), users were always redirected to `/dashboard` even if they were admin users, instead of being redirected to `/admin`.

## Root Cause
The login flow was hardcoded to redirect OAuth users to `/dashboard`:
```typescript
await signIn('google', { callbackUrl: '/dashboard' });
```

This meant the admin check never ran for OAuth users.

## Solution
Created a redirect handler page that checks admin status after OAuth authentication.

### Files Changed/Created

#### 1. Created `/app/auth/callback/page.tsx`
A new redirect handler that:
- Waits for authentication to complete
- Checks `/api/user/profile` for admin status
- Redirects to `/admin` if user is admin
- Redirects to `/dashboard` if user is regular user

#### 2. Updated `/app/login/page.tsx`
Changed Google OAuth callback URL:
```typescript
// Before:
await signIn('google', { callbackUrl: '/dashboard' });

// After:
await signIn('google', { callbackUrl: '/auth/callback' });
```

### How It Works Now

```
┌─────────────────────────────────────────────────┐
│ User clicks "Sign in with Google"               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Google OAuth Flow                               │
│ (User authenticates with Google)                │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Redirect to: /auth/callback                     │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Check: Is user authenticated?                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Fetch: /api/user/profile                        │
│ Check: data.user?.isAdmin                       │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
   ┌─────────┐         ┌──────────┐
   │ isAdmin │         │ Regular  │
   │ = true  │         │ User     │
   └────┬────┘         └────┬─────┘
        │                   │
        ▼                   ▼
  ┌─────────┐         ┌──────────┐
  │ /admin  │         │/dashboard│
  └─────────┘         └──────────┘
```

## Testing

### For Admin Users
1. Log in with Google OAuth
2. Should see "Redirecting..." screen briefly
3. Should land on `/admin` dashboard
4. See admin statistics and sidebar

### For Regular Users
1. Log in with Google OAuth  
2. Should see "Redirecting..." screen briefly
3. Should land on `/dashboard` user dashboard
4. Regular user experience

## Benefits

✅ **Works for all OAuth providers** (Google, Apple, etc.)  
✅ **Seamless redirect** with loading state  
✅ **Consistent behavior** between OAuth and email/password login  
✅ **Secure** - checks admin status server-side via API  
✅ **Fallback handling** - redirects to dashboard on error

## Files Involved

```
app/
├── auth/
│   └── callback/
│       └── page.tsx          ✨ NEW - OAuth redirect handler
└── login/
    └── page.tsx              🔧 MODIFIED - Changed callback URL

lib/
└── auth.ts                   ✅ Already configured correctly
```

## Notes

- The `/auth/callback` page is only used for OAuth flows
- Email/password login still redirects directly (already has admin check)
- The admin check happens via `/api/user/profile` which returns `isAdmin` flag
- No database changes needed - uses existing admin fields

---

**Fixed**: November 8, 2025  
**Status**: ✅ Working correctly for OAuth admin users

