# HereMyLinks - All-in-one Bio Links Builder

A modern, full-featured bio link builder application built with Next.js.

---

## 🎯 Current Stack

### **Authentication**
- **NextAuth v5** (beta.29)
  - Google OAuth
  - Apple Sign In
  - Email/Password with verification
  - JWT-based sessions

### **Database**
- **Supabase PostgreSQL**
  - User profiles
  - Bio links
  - Social links
  - Full relational database

### **Storage**
- **Cloudflare R2**
  - Profile images
  - Hero images
  - Link images
  - Background media

### **Email**
- **Resend**
  - Email verification
  - Welcome emails
  - Notifications

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create `.env.local`:

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Apple Sign In
APPLE_ID=com.heremylinks.web
APPLE_SECRET=your-jwt-token

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=heremylinks
R2_PUBLIC_URL=https://xxx

# Resend Email
RESEND_API_KEY=re_xxx
```

### 3. Set Up Database
1. Create a Supabase project
2. Run `database/supabase-schema.sql` in SQL Editor
3. Disable RLS (run `database/DISABLE_RLS_NOW.sql`)

### 4. Configure OAuth Providers
See `QUICK_START.md` for detailed OAuth setup instructions.

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
heremylinks-nextjs-sample/
├── app/
│   ├── [username]/          # Public bio pages
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── links/          # Bio links management
│   │   ├── upload/         # File uploads
│   │   └── user/           # User profile
│   ├── dashboard/          # User dashboard
│   ├── login/              # Login/signup page
│   └── page.tsx            # Homepage
├── components/             # Reusable components
├── contexts/               # React contexts
├── database/               # SQL schemas
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # Supabase database adapter
│   ├── supabase.ts        # Supabase client
│   └── r2.ts              # Cloudflare R2 storage
└── public/                # Static assets
```

---

## 🔐 Authentication Flow

### Email/Password Signup
1. User enters email
2. Creates password
3. Receives verification email
4. Verifies email with code
5. Redirects to dashboard

### OAuth (Google/Apple)
1. User clicks "Continue with Google/Apple"
2. OAuth provider authentication
3. Callback to `/api/auth/callback/[provider]`
4. User profile created if new
5. Redirects to dashboard

---

## 📊 Database Schema

### Tables
- **users**: User profiles and settings
- **accounts**: OAuth accounts (linked to NextAuth)
- **bio_links**: User-created bio links
- **social_links**: Social media links

Row Level Security (RLS) is **disabled** since NextAuth handles authentication.

---

## 🎨 Features

- ✅ Multiple bio page templates
- ✅ Drag-and-drop link reordering
- ✅ Custom themes and colors
- ✅ Image uploads and cropping
- ✅ Background images/videos
- ✅ Social media integration
- ✅ Analytics tracking
- ✅ Custom domains (coming soon)
- ✅ QR code generation (coming soon)

---

## 🛠️ Development

### Run Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
```

---

## 📚 Documentation

- `QUICK_START.md` - Quick setup guide
- `REVERTED_TO_NEXTAUTH.md` - Complete authentication setup
- `database/supabase-schema.sql` - Database schema
- `generate-apple-secret.js` - Apple JWT generator

---

## 🌐 Deployment

### Environment Variables for Production
Update these in your deployment platform:
- Set `NEXTAUTH_URL` to your production domain
- Update OAuth redirect URIs in Google/Apple console
- Use production Supabase credentials
- Configure R2 bucket for production

### Hosting Options
- ✅ Vercel (recommended for Next.js)
- ✅ DigitalOcean (your current setup)
- ✅ Railway
- ✅ AWS
- ✅ Any Node.js hosting

---

## 🐛 Troubleshooting

### Authentication Issues
- Verify OAuth credentials in `.env.local`
- Check redirect URIs match exactly
- Ensure NEXTAUTH_SECRET is set

### Database Issues
- Verify Supabase credentials
- Check RLS is disabled
- Review SQL query logs

### Storage Issues
- Verify R2 credentials
- Check bucket permissions
- Ensure R2_PUBLIC_URL is correct

---

## 📄 License

Private project for HereMyLinks.com

---

## 🤝 Support

For issues or questions, contact the development team.

---

**Built with ❤️ using Next.js, NextAuth, and Supabase**
