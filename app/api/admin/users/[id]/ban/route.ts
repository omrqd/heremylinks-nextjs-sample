import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST - Ban a user
export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    const body = await request.json();
    const { banReason } = body;

    // Check if user exists
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('email, username, is_admin')
      .eq('id', params.id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent banning yourself
    if (targetUser.email === session.user.email) {
      return NextResponse.json({ error: 'Cannot ban your own account' }, { status: 400 });
    }

    // Prevent banning other admins (unless you're master admin)
    if (targetUser.is_admin && adminUser.admin_role !== 'master_admin') {
      return NextResponse.json({ error: 'Only master admin can ban other admins' }, { status: 403 });
    }

    // Ban the user
    const { data: bannedUser, error: banError } = await supabaseAdmin
      .from('users')
      .update({
        is_banned: true,
        ban_reason: banReason || 'Your account has been banned. Please contact support for more information.',
        banned_at: new Date().toISOString(),
        banned_by: adminUser.id,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (banError) {
      console.error('Error banning user:', banError);
      return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
    }

    console.log('✅ User banned:', {
      user_id: params.id,
      username: targetUser.username,
      banned_by: adminUser.id,
    });

    return NextResponse.json({ 
      user: bannedUser, 
      message: 'User banned successfully' 
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Unban a user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    // Check if user exists
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('id', params.id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Unban the user
    const { data: unbannedUser, error: unbanError } = await supabaseAdmin
      .from('users')
      .update({
        is_banned: false,
        ban_reason: null,
        banned_at: null,
        banned_by: null,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (unbanError) {
      console.error('Error unbanning user:', unbanError);
      return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
    }

    console.log('✅ User unbanned:', {
      user_id: params.id,
      username: targetUser.username,
      unbanned_by: adminUser.id,
    });

    return NextResponse.json({ 
      user: unbannedUser, 
      message: 'User unbanned successfully' 
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

