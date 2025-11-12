# Admin Bulk Email System

## Overview
A comprehensive bulk email management system that allows admins to send professional HTML emails to all users or specific users, with monitoring, tracking, and a rich text editor.

## Features

### 📧 **Email Sending**
- **Bulk Email to All Users** - Send to entire user base
- **Targeted Email to Specific User** - Send to individual users
- **Custom From Address** - Set any email address (e.g., no-reply@heremylinks.com, omar@heremylinks.com)
- **Custom From Name** - Set sender display name
- **Rich Text Editor** - Full WYSIWYG editor with formatting, images, links
- **HTML & Plain Text** - Automatically generates plain text version

### 📊 **Email Monitoring**
- **Delivery Tracking** - Track sent, failed, and pending emails
- **Recipient Count** - See how many users received email
- **Status Monitoring** - Sent, partial, failed, pending statuses
- **Detailed Statistics** - Individual recipient delivery status
- **Email History** - Complete log of all sent campaigns

### 🎨 **Rich Text Editor**
- **Formatting Tools** - Bold, italic, underline, strikethrough
- **Headers** - H1, H2, H3 options
- **Lists** - Ordered and bullet lists
- **Colors** - Text and background colors
- **Alignment** - Left, center, right, justify
- **Links** - Insert hyperlinks
- **Images** - Embed images
- **Clean Formatting** - Remove formatting tool

## Database Schema

### Tables Created

#### 1. `sent_emails`
Tracks all email campaigns sent through the admin panel.

```sql
CREATE TABLE sent_emails (
  id UUID PRIMARY KEY,
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  target_type VARCHAR(50) NOT NULL, -- 'all' or 'specific'
  target_user_id UUID REFERENCES users(id),
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  sent_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  sent_at TIMESTAMP
);
```

#### 2. `email_recipients`
Tracks individual email delivery status for each recipient.

```sql
CREATE TABLE email_recipients (
  id UUID PRIMARY KEY,
  sent_email_id UUID REFERENCES sent_emails(id),
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  created_at TIMESTAMP
);
```

## API Endpoints

### GET /api/admin/emails
List all sent emails with monitoring data.

**Auth**: Admin required

**Response**:
```json
{
  "success": true,
  "emails": [
    {
      "id": "email-id",
      "from_email": "no-reply@heremylinks.com",
      "from_name": "HereMyLinks Team",
      "subject": "Important Update",
      "body_html": "<p>Email content...</p>",
      "target_type": "all",
      "recipients_count": 100,
      "sent_count": 98,
      "failed_count": 2,
      "status": "partial",
      "created_at": "2025-01-01T00:00:00Z",
      "sent_at": "2025-01-01T00:01:00Z",
      "sender": {
        "name": "Admin Name",
        "username": "admin",
        "email": "admin@heremylinks.com"
      }
    }
  ]
}
```

### POST /api/admin/emails/send
Send bulk email campaign.

**Auth**: Admin required

**Request**:
```json
{
  "fromEmail": "no-reply@heremylinks.com",
  "fromName": "HereMyLinks Team",
  "targetType": "all",
  "targetUserId": "user-id",
  "subject": "Welcome!",
  "bodyHtml": "<h1>Welcome!</h1><p>Thank you for joining...</p>",
  "bodyText": "Welcome! Thank you for joining..."
}
```

**Response**:
```json
{
  "success": true,
  "emailId": "sent-email-id",
  "recipientCount": 100,
  "sent": 98,
  "failed": 2,
  "status": "partial",
  "message": "Successfully sent 98 of 100 emails"
}
```

### DELETE /api/admin/emails/[id]
Delete sent email record from history.

**Auth**: Admin required

**Response**:
```json
{
  "success": true,
  "message": "Email record deleted successfully"
}
```

## Email Statuses

| Status | Description |
|--------|-------------|
| `pending` | Email queued for sending |
| `sending` | Currently being sent |
| `sent` | All emails delivered successfully |
| `partial` | Some emails sent, some failed |
| `failed` | All emails failed to deliver |

## Recipient Statuses

| Status | Description |
|--------|-------------|
| `pending` | Waiting to be sent |
| `sent` | Successfully delivered |
| `failed` | Delivery failed |
| `bounced` | Email bounced back |
| `opened` | Recipient opened email (if tracking enabled) |

## UI Components

### Email List View
- **Card-based layout** showing all sent emails
- **Status icons** with color coding
  - Green: Sent successfully
  - Yellow: Partial success
  - Red: Failed
  - Blue: Sending/Pending
- **Delivery statistics** (sent/failed counts)
- **View/Hide button** to expand email body
- **Delete button** to remove from history
- **Target information** (all users or specific user)
- **Timestamp** showing when sent

### Send Email Modal
- **From Email Input** - Manual entry (not dropdown)
- **From Name Input** - Optional sender name
- **Target Selection** - Radio buttons for all/specific
- **User Search** - Autocomplete search (if specific)
- **Subject Input** - Email subject line
- **Rich Text Editor** - Full WYSIWYG editor
- **Send Button** - With loading state

### Rich Text Editor Features
```
┌──────────────────────────────────────────┐
│ [H1▾] [B] [I] [U] [S] [•] [1.] [≡] ...  │  ← Toolbar
├──────────────────────────────────────────┤
│                                          │
│  Type your email content here...        │  ← Editor
│                                          │
│                                          │
└──────────────────────────────────────────┘
```

## Sending Process

### 1. Prepare Email
```javascript
// Admin fills out form
{
  fromEmail: "no-reply@heremylinks.com",
  fromName: "HereMyLinks",
  subject: "Welcome!",
  bodyHtml: "<h1>Welcome!</h1>...",
  targetType: "all"
}
```

### 2. Create Record
```javascript
// Insert into sent_emails table
const sentEmail = await supabaseAdmin
  .from('sent_emails')
  .insert({
    from_email,
    from_name,
    subject,
    body_html,
    body_text,
    target_type,
    recipients_count: targetUsers.length,
    status: 'sending',
    sent_by: adminUser.id
  });
```

### 3. Send Emails
```javascript
// Send to each recipient with Resend API
for (const user of targetUsers) {
  try {
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: user.email,
      subject: subject,
      html: bodyHtml,
      text: bodyText
    });
    
    emailsSent++;
    // Record success in email_recipients
  } catch (error) {
    emailsFailed++;
    // Record failure in email_recipients
  }
  
  // Rate limiting delay
  await delay(100ms);
}
```

### 4. Update Status
```javascript
// Update final counts and status
await supabaseAdmin
  .from('sent_emails')
  .update({
    sent_count: emailsSent,
    failed_count: emailsFailed,
    status: finalStatus,
    sent_at: new Date()
  });
```

## Performance & Rate Limiting

### Sending Strategy
- **Sequential sending** - One email at a time
- **100ms delay** between emails
- **Rate limit protection** - Prevents API throttling
- **Error tracking** - Individual failures don't stop campaign

### Scalability
| Recipients | Est. Time | Notes |
|------------|-----------|-------|
| 10 users | ~1 second | Very fast |
| 100 users | ~10 seconds | Good performance |
| 1000 users | ~2 minutes | Acceptable |
| 10000 users | ~17 minutes | Consider queue system |

### Optimization Options
1. **Batch Sending** - Send to multiple recipients per request
2. **Queue System** - Use background jobs for large campaigns
3. **Parallel Processing** - Multiple sending threads
4. **CDN for Images** - Host images on CDN, not inline

## Best Practices

### From Email Address
- Use **verified domains** in Resend
- Common patterns:
  - `no-reply@heremylinks.com` - Automated emails
  - `support@heremylinks.com` - Support emails
  - `omar@heremylinks.com` - Personal touch
  - `team@heremylinks.com` - Team communications

### Subject Lines
- Keep under 50 characters
- Avoid spam trigger words
- Be clear and specific
- Use personalization when possible
- Test before sending

### Email Content
- **Responsive design** - Works on mobile
- **Plain text fallback** - Auto-generated
- **Unsubscribe link** - Required by law in many regions
- **Contact information** - Include sender info
- **Test thoroughly** - Preview before sending

### Compliance
- **CAN-SPAM Act** (US) - Include unsubscribe, physical address
- **GDPR** (EU) - Get consent, allow opt-out
- **CASL** (Canada) - Require consent for commercial emails
- **Best practice** - Only email users who opted in

## Security Features

### Authentication & Authorization
- Only admins can send emails
- All sends logged with sender info
- IP address tracking for audit

### Validation
- Email format validation
- Required field checks
- XSS protection in editor
- SQL injection prevention

### Audit Trail
- All emails logged in `admin_logs`
- Track who sent what, when
- Delivery status for each recipient
- Failed delivery error messages

## Error Handling

### Common Errors
| Error | Cause | Solution |
|-------|-------|----------|
| Invalid email format | Bad from email | Validate format |
| Resend API error | API down or rate limit | Retry or queue |
| User not found | Invalid target user ID | Validate before sending |
| No recipients | All users banned | Check user filters |

### Error Recovery
- Individual failures don't stop campaign
- Each failure logged separately
- Admin notified of failures
- Retry option for failed sends

## Monitoring & Analytics

### Email Dashboard Shows:
1. **Total emails sent** - All time count
2. **Recent campaigns** - Last 50 emails
3. **Delivery rates** - Success percentage
4. **Failed deliveries** - With error details
5. **Popular subjects** - Most sent topics
6. **Sending patterns** - When emails are sent

### Per-Email Metrics:
- Recipients count
- Sent count
- Failed count
- Delivery rate
- Send duration
- Status
- Error messages (if any)

## Usage Guide

### Sending to All Users

1. **Click "Send Email"** button
2. **Enter from email**: `no-reply@heremylinks.com`
3. **Enter from name**: `HereMyLinks Team` (optional)
4. **Select "All Users"**
5. **Enter subject**: `Important Announcement`
6. **Compose email** in rich text editor
7. **Click "Send Email"**
8. **Wait for confirmation** (may take time for large user bases)
9. **View in sent emails** list with delivery stats

### Sending to Specific User

1. **Click "Send Email"** button
2. **Enter from details**
3. **Select "Specific User"**
4. **Search for user** by email or name
5. **Select user** from results
6. **Enter subject and body**
7. **Click "Send Email"**
8. **Email sent immediately** to that one user

### Monitoring Sent Emails

1. **View sent emails list** on main page
2. **Check status** (green = success, yellow = partial, red = failed)
3. **Click "View"** to see full email body
4. **Check delivery stats** (X sent, Y failed)
5. **Delete old campaigns** if needed (Delete button)

## Rich Text Editor Guide

### Formatting Text
- **Bold**: Select text → Click **B**
- **Italic**: Select text → Click *I*
- **Underline**: Select text → Click <u>U</u>
- **Color**: Click color picker → Choose color

### Adding Links
1. Select text
2. Click link icon
3. Enter URL
4. Click OK

### Adding Images
1. Click image icon
2. Enter image URL
3. Image embeds in email

### Headers
1. Select text
2. Click header dropdown
3. Choose H1, H2, or H3

## Troubleshooting

### Emails not sending
**Check**:
- Resend API key is valid
- From email is verified domain
- Users have valid email addresses
- Not hitting rate limits

### Partial failures
**Cause**: Some user emails invalid
**Solution**: Check failed recipients in logs

### Rich text editor not loading
**Cause**: react-quill not installed
**Solution**: Run `npm install`

### From email rejected
**Cause**: Domain not verified in Resend
**Solution**: Verify domain in Resend dashboard

## Installation Steps

### 1. Run Database Migration
```bash
# Run the migration
psql your_database < database/migrations/010_add_sent_emails_system.sql
```

### 2. Install Dependencies
```bash
npm install react-quill
```

### 3. Configure Resend
- Verify your domain in Resend
- Set RESEND_API_KEY in .env

### 4. Access Page
Navigate to: `/admin/emails`

## Files Created

### Database
- `/database/migrations/010_add_sent_emails_system.sql` - Database schema

### API Routes
- `/app/api/admin/emails/route.ts` - List emails (GET)
- `/app/api/admin/emails/send/route.ts` - Send email (POST)
- `/app/api/admin/emails/[id]/route.ts` - Delete email (DELETE)

### UI
- `/app/admin/emails/page.tsx` - Admin emails page with editor

### Configuration
- `package.json` - Added react-quill dependency

## Dependencies

- **react-quill** (^2.0.0) - Rich text editor
- **resend** (^6.2.2) - Email sending service
- **@supabase/supabase-js** (^2.78.0) - Database client

## Summary

The bulk email system provides:
- ✅ Professional email sending with rich text
- ✅ Bulk or targeted campaigns
- ✅ Complete monitoring and tracking
- ✅ Custom from addresses
- ✅ Delivery statistics
- ✅ Full audit trail
- ✅ Mobile-responsive emails
- ✅ Error handling and recovery
- ✅ WYSIWYG editor
- ✅ Production-ready

Perfect for sending announcements, newsletters, updates, and marketing campaigns! 📧🎉

