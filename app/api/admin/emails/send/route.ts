import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST - Send bulk email
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
      fromEmail,
      fromName,
      targetType, // 'all' or 'specific'
      targetUserId, // Required if targetType is 'specific'
      subject,
      bodyHtml,
      bodyText
    } = body;

    // Validate required fields
    if (!fromEmail || !subject || !bodyHtml || !targetType) {
      return NextResponse.json({ 
        error: 'From email, subject, body, and target type are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      return NextResponse.json({ 
        error: 'Invalid from email format' 
      }, { status: 400 });
    }

    if (targetType === 'specific' && !targetUserId) {
      return NextResponse.json({ 
        error: 'Target user ID is required for specific emails' 
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
      return NextResponse.json({ error: 'No users found to email' }, { status: 404 });
    }

    // Create sent_email record
    const { data: sentEmail, error: insertError } = await supabaseAdmin
      .from('sent_emails')
      .insert({
        from_email: fromEmail,
        from_name: fromName || null,
        subject,
        body_html: bodyHtml,
        body_text: bodyText || null,
        target_type: targetType,
        target_user_id: targetType === 'specific' ? targetUserId : null,
        recipients_count: targetUsers.length,
        sent_count: 0,
        failed_count: 0,
        status: 'sending',
        sent_by: adminUser.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating sent_email record:', insertError);
      return NextResponse.json({ error: 'Failed to create email record' }, { status: 500 });
    }

    console.log(`Starting to send ${targetUsers.length} emails from ${fromEmail}...`);

    // Send emails and track individual deliveries
    let emailsSent = 0;
    let emailsFailed = 0;
    const recipientRecords: any[] = [];

    for (const user of targetUsers) {
      const recipientRecord: any = {
        sent_email_id: sentEmail.id,
        user_id: user.id,
        user_email: user.email,
        status: 'pending'
      };

      try {
        console.log(`Sending email to ${user.email}...`);
        
        const result = await resend.emails.send({
          from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
          to: user.email,
          subject: subject,
          html: bodyHtml,
          text: bodyText || undefined
        });
        
        console.log(`✓ Email sent successfully to ${user.email}`, result);
        emailsSent++;
        recipientRecord.status = 'sent';
        recipientRecord.sent_at = new Date().toISOString();
        
        // Add small delay between emails to avoid rate limiting
        if (targetUsers.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error: any) {
        console.error(`✗ Error sending email to ${user.email}:`, error);
        emailsFailed++;
        recipientRecord.status = 'failed';
        recipientRecord.error_message = error.message || 'Unknown error';
      }

      recipientRecords.push(recipientRecord);
    }

    // Insert all recipient records
    await supabaseAdmin
      .from('email_recipients')
      .insert(recipientRecords);

    // Update sent_email record with final counts and status
    const finalStatus = 
      emailsFailed === 0 ? 'sent' :
      emailsSent === 0 ? 'failed' :
      'partial';

    await supabaseAdmin
      .from('sent_emails')
      .update({
        sent_count: emailsSent,
        failed_count: emailsFailed,
        status: finalStatus,
        sent_at: new Date().toISOString()
      })
      .eq('id', sentEmail.id);

    console.log(`Email campaign complete. Sent: ${emailsSent}, Failed: ${emailsFailed}`);

    // Log admin action
    await supabaseAdmin.from('admin_logs').insert({
      admin_email: session.user.email,
      action: 'send_bulk_email',
      target_email: targetType === 'all' ? 'all_users' : targetUsers[0]?.email,
      details: `Sent email "${subject}" to ${emailsSent} users. ${emailsFailed} failed.`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      emailId: sentEmail.id,
      recipientCount: targetUsers.length,
      sent: emailsSent,
      failed: emailsFailed,
      status: finalStatus,
      message: `Successfully sent ${emailsSent} of ${targetUsers.length} emails`
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

