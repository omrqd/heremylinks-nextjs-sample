import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all sent notifications with details
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

    // Get all notifications with sender and receiver info
    // Group by created_at, title, message to identify broadcast notifications
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select(`
        id,
        title,
        message,
        type,
        link,
        email_sent,
        created_at,
        created_by,
        user_id,
        users:user_id (
          id,
          username,
          email,
          name
        ),
        creator:created_by (
          id,
          username,
          email,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Group notifications by creation details to identify batch sends
    const groupedNotifications = new Map();
    
    notifications?.forEach((notif: any) => {
      // Round timestamp to nearest minute for better grouping of batch sends
      const timestamp = new Date(notif.created_at);
      timestamp.setSeconds(0, 0); // Reset seconds and milliseconds
      const roundedTime = timestamp.toISOString();
      
      // Create a unique key for grouping (same time window, title, message, creator, type)
      const groupKey = `${notif.title}|${notif.message}|${notif.type}|${notif.link || ''}|${notif.created_by}|${roundedTime}`;
      
      if (!groupedNotifications.has(groupKey)) {
        groupedNotifications.set(groupKey, {
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          link: notif.link,
          email_sent: notif.email_sent,
          created_at: notif.created_at,
          created_by: notif.creator,
          target_type: 'specific',
          target_users: [],
          notification_ids: []
        });
      }
      
      const group = groupedNotifications.get(groupKey);
      group.target_users.push(notif.users);
      group.notification_ids.push(notif.id);
    });

    // Convert map to array and determine target type
    const formattedNotifications = Array.from(groupedNotifications.values()).map(group => {
      // If sent to more than 1 user, likely a broadcast to all users
      if (group.target_users.length > 1) {
        group.target_type = 'all';
      }
      return group;
    });

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a notification or group of notifications
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const notificationIds = searchParams.get('ids')?.split(',') || [];

    if (notificationIds.length === 0) {
      return NextResponse.json({ error: 'No notification IDs provided' }, { status: 400 });
    }

    // Delete notifications
    const { error: deleteError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .in('id', notificationIds);

    if (deleteError) {
      console.error('Error deleting notifications:', deleteError);
      return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: notificationIds.length
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

