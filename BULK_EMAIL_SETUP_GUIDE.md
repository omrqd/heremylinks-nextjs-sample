# Bulk Email System - Quick Setup Guide

## Quick Start (5 Minutes)

### Step 1: Run Database Migration ✅

You need to add the email tables to your Supabase database.

**Go to Supabase Dashboard** → **SQL Editor** → **New Query**

Copy and paste this SQL:

```sql
-- Create sent_emails table
CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) DEFAULT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT DEFAULT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_user_id UUID DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT DEFAULT NULL,
  sent_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create email_recipients table
CREATE TABLE IF NOT EXISTS email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_email_id UUID NOT NULL REFERENCES sent_emails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT DEFAULT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_by ON sent_emails(sent_by);
CREATE INDEX IF NOT EXISTS idx_sent_emails_created_at ON sent_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON sent_emails(status);
CREATE INDEX IF NOT EXISTS idx_email_recipients_sent_email_id ON email_recipients(sent_email_id);
CREATE INDEX IF NOT EXISTS idx_email_recipients_user_id ON email_recipients(user_id);
```

**Click "Run"** ✅

### Step 2: Install Dependencies ✅

Already done! react-quill is installed.

### Step 3: Configure Resend (if not done) ✅

1. Go to [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### Step 4: Verify Domain in Resend ⚠️

**Important:** You need to verify your domain in Resend to send from custom addresses.

1. Go to Resend Dashboard → Domains
2. Add your domain (heremylinks.com)
3. Add DNS records to your domain provider
4. Wait for verification (usually 5-10 minutes)

**Until verified, you can only send from:**
- `onboarding@resend.dev` (free tier default)

### Step 5: Access the Page 🎉

Navigate to: **`/admin/emails`**

You should see:
- Sent emails list (empty at first)
- "Send Email" button
- Beautiful UI with sidebar

## Usage

### Send Your First Email

1. **Click "Send Email"**
2. **Fill out the form:**
   - From Email: `no-reply@heremylinks.com` (must be verified domain)
   - From Name: `HereMyLinks Team` (optional)
   - Select "All Users" or "Specific User"
   - Subject: `Welcome to HereMyLinks!`
   - Body: Use the rich text editor to compose your email
3. **Click "Send Email"**
4. **Wait for confirmation**
5. **Check the sent emails list** for delivery stats

### Monitor Sent Emails

- View all sent emails in the list
- Click "View" to expand and see full email body
- Check delivery stats (sent/failed counts)
- Delete old campaigns with "Delete" button

## Email Addresses You Can Use

### Before Domain Verification
- `onboarding@resend.dev` - Free tier default

### After Domain Verification (heremylinks.com)
- `no-reply@heremylinks.com` - Automated emails
- `support@heremylinks.com` - Support
- `omar@heremylinks.com` - Personal
- `team@heremylinks.com` - Team
- `hello@heremylinks.com` - Welcome emails
- `updates@heremylinks.com` - Updates & announcements

## Troubleshooting

### "Failed to send email"
**Solution**: Check:
1. Resend API key is set in `.env`
2. Domain is verified in Resend
3. From email uses verified domain

### "No users found to email"
**Solution**: Make sure you have non-banned users in your database

### Rich text editor not showing
**Solution**: 
1. Check browser console for errors
2. Refresh the page
3. Clear browser cache

### Database error
**Solution**: Make sure you ran the SQL migration in Supabase

## Features Overview

### ✅ What's Included
- Send to all users or specific user
- Rich text WYSIWYG editor
- Custom from address and name
- HTML email with auto plain-text version
- Delivery tracking and monitoring
- Failed email logging
- User search (autocomplete)
- Email history with stats
- Delete functionality
- Mobile responsive

### 📧 Email Capabilities
- **Formatting**: Bold, italic, underline, colors
- **Structure**: Headers, lists, alignment
- **Media**: Links, images
- **Styling**: Text/background colors
- **Clean**: Remove formatting tool

### 📊 Monitoring Features
- Total recipients count
- Successfully sent count
- Failed deliveries count
- Status: Sent, Partial, Failed, Pending
- Timestamp of when sent
- Who sent the email
- Target information (all/specific)
- View full email body
- Expandable email preview

## Best Practices

### Subject Lines
- ✅ Keep under 50 characters
- ✅ Be clear and specific
- ✅ Avoid spam trigger words
- ✅ Use action words

### From Address
- ✅ Use recognizable email
- ✅ Match your brand
- ✅ Include sender name
- ❌ Don't use gmail/yahoo

### Email Content
- ✅ Mobile responsive
- ✅ Clear call-to-action
- ✅ Include unsubscribe link
- ✅ Test before sending
- ✅ Keep it concise

### Timing
- ✅ Send during business hours
- ✅ Avoid weekends for business emails
- ✅ Test with small group first
- ❌ Don't spam users

## Support

### Need Help?
- Check the full documentation: `ADMIN_BULK_EMAIL_SYSTEM.md`
- Resend documentation: [resend.com/docs](https://resend.com/docs)
- React Quill docs: [quilljs.com](https://quilljs.com/)

### Common Questions

**Q: Can I send attachments?**
A: Not currently, but you can link to files hosted elsewhere.

**Q: Is there a sending limit?**
A: Resend free tier: 100 emails/day. Paid plans: Much higher limits.

**Q: Can I schedule emails?**
A: Not yet, but can be added as a feature.

**Q: Can I see who opened emails?**
A: The database structure supports it, but tracking isn't implemented yet.

**Q: Can I use templates?**
A: Currently no, but you can copy/paste from previous emails.

## Next Steps

### After Setup
1. Send a test email to yourself
2. Verify it looks good on mobile
3. Check spam folder
4. Send to all users when ready

### Future Enhancements
- Email templates
- Scheduled sending
- Open tracking
- Click tracking
- A/B testing
- Unsubscribe management
- Email analytics dashboard

## Summary

You now have a complete bulk email system that can:
- ✅ Send professional HTML emails
- ✅ Target all users or specific users  
- ✅ Monitor delivery status
- ✅ Track failures
- ✅ Use rich text editor
- ✅ Custom sender information

Perfect for newsletters, announcements, updates, and marketing! 📧✨

