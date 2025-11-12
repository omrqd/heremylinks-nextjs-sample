import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all sent emails
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, is_admin, admin_role')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all sent emails
    const { data: emails, error } = await supabaseAdmin
      .from('sent_emails')
      .select(`
        id,
        from_email,
        from_name,
        subject,
        body_html,
        target_type,
        target_user_id,
        recipients_count,
        sent_count,
        failed_count,
        status,
        error_message,
        sent_by,
        created_at,
        sent_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching emails:', error);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    // Get sender info and target user info for each email separately
    const senderIds = Array.from(new Set(emails?.map(e => e.sent_by).filter(Boolean) || []));
    const targetUserIds = Array.from(new Set(emails?.filter(e => e.target_user_id).map(e => e.target_user_id) || []));
    
    let sendersMap: any = {};
    let targetUsersMap: any = {};
    
    if (senderIds.length > 0) {
      const { data: senders } = await supabaseAdmin
        .from('users')
        .select('id, username, email, name')
        .in('id', senderIds);
      
      senders?.forEach(sender => {
        sendersMap[sender.id] = sender;
      });
    }

    if (targetUserIds.length > 0) {
      const { data: targetUsers } = await supabaseAdmin
        .from('users')
        .select('id, username, email, name')
        .in('id', targetUserIds);
      
      targetUsers?.forEach(user => {
        targetUsersMap[user.id] = user;
      });
    }

    // Format emails with sender and target user info
    const formattedEmails = emails?.map(email => ({
      ...email,
      sender: sendersMap[email.sent_by] || null,
      target_user: email.target_user_id ? targetUsersMap[email.target_user_id] : null
    }));

    return NextResponse.json({
      success: true,
      emails: formattedEmails || []
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

