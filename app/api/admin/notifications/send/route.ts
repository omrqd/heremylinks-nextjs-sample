import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST - Send notification(s)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, is_admin, admin_role, name')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      targetType, // 'all' or 'specific'
      targetUserId, // Required if targetType is 'specific'
      title, 
      message, 
      type = 'info', // 'info', 'success', 'warning', 'error'
      link = null,
      sendEmail = false,
    } = body;

    // Validate required fields
    if (!title || !message || !targetType) {
      return NextResponse.json({ 
        error: 'Title, message, and target type are required' 
      }, { status: 400 });
    }

    if (targetType === 'specific' && !targetUserId) {
      return NextResponse.json({ 
        error: 'Target user ID is required for specific notifications' 
      }, { status: 400 });
    }

    let targetUsers: any[] = [];

    // Get target users
    if (targetType === 'all') {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .eq('is_banned', false); // Don't send to banned users

      if (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
      }

      targetUsers = users || [];
    } else {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .eq('id', targetUserId)
        .single();

      if (error || !user) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }

      targetUsers = [user];
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No users found to notify' }, { status: 404 });
    }

    // Create notifications in database
    const notificationsToInsert = targetUsers.map(user => ({
      user_id: user.id,
      title,
      message,
      type,
      link,
      is_read: false,
      email_sent: sendEmail,
      created_by: adminUser.id,
    }));

    const { data: createdNotifications, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToInsert)
      .select();

    if (insertError) {
      console.error('Error creating notifications:', insertError);
      return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 });
    }

    // Send emails if requested
    let emailsSent = 0;
    let emailErrors: string[] = [];

    if (sendEmail) {
      const emailPromises = targetUsers.map(async (user) => {
        try {
          await resend.emails.send({
            from: 'HereMyLinks <notifications@heremylinks.com>',
            to: user.email,
            subject: title,
            html: getNotificationEmailHTML(user.name || user.email, title, message, type, link),
          });
          emailsSent++;
        } catch (error: any) {
          console.error(`Error sending email to ${user.email}:`, error);
          emailErrors.push(`${user.email}: ${error.message}`);
        }
      });

      await Promise.all(emailPromises);
    }

    return NextResponse.json({
      success: true,
      notificationsSent: targetUsers.length,
      emailsSent: sendEmail ? emailsSent : 0,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate beautiful HTML email template
function getNotificationEmailHTML(
  userName: string,
  title: string,
  message: string,
  type: string,
  link: string | null
): string {
  const typeColors = {
    info: { bg: '#3b82f6', icon: 'ℹ️' },
    success: { bg: '#10b981', icon: '✅' },
    warning: { bg: '#f59e0b', icon: '⚠️' },
    error: { bg: '#ef4444', icon: '❌' },
  };

  const typeConfig = typeColors[type as keyof typeof typeColors] || typeColors.info;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ${typeConfig.icon} ${title}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 16px;">
                Hi <strong style="color: #1f2937;">${userName}</strong>,
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid ${typeConfig.bg}; border-radius: 8px;">
                <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
                  ${message}
                </p>
              </div>
              
              ${link ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${link}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View Details
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                You can also view this notification in your dashboard at 
                <a href="https://heremylinks.com/dashboard" style="color: #8b5cf6; text-decoration: none;">
                  heremylinks.com/dashboard
                </a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px;">
                <strong style="color: #1f2937;">HereMyLinks</strong><br>
                Your Bio Link Platform
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://heremylinks.com" style="color: #8b5cf6; text-decoration: none; font-size: 13px; margin: 0 10px;">
                      Website
                    </a>
                    <span style="color: #d1d5db;">•</span>
                    <a href="https://heremylinks.com/support" style="color: #8b5cf6; text-decoration: none; font-size: 13px; margin: 0 10px;">
                      Support
                    </a>
                    <span style="color: #d1d5db;">•</span>
                    <a href="https://heremylinks.com/privacy" style="color: #8b5cf6; text-decoration: none; font-size: 13px; margin: 0 10px;">
                      Privacy
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px;">
                © 2025 HereMyLinks. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

