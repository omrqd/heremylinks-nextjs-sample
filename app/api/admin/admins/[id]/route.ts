import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PUT - Update admin role/permissions
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is master admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, is_admin, admin_role')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser?.is_admin || adminUser.admin_role !== 'master_admin') {
      return NextResponse.json({ error: 'Master admin access required' }, { status: 403 });
    }

    const targetUserId = params.id;
    const body = await request.json();
    const { adminRole, permissions } = body;

    if (!adminRole) {
      return NextResponse.json({ 
        error: 'Admin role is required' 
      }, { status: 400 });
    }

    // Prevent modifying self if it would remove master admin status
    if (targetUserId === adminUser.id && adminRole !== 'master_admin') {
      return NextResponse.json({ 
        error: 'You cannot remove your own master admin status' 
      }, { status: 400 });
    }

    // Get target user
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, is_admin, admin_role')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetUser.is_admin) {
      return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
    }

    // Update admin role and permissions
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        admin_role: adminRole,
        admin_permissions: JSON.stringify(permissions || [])
      })
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating admin:', updateError);
      return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
    }

    // Log the action
    await supabaseAdmin.from('admin_logs').insert({
      admin_email: session.user.email,
      action: 'update_admin',
      target_email: targetUser.email,
      details: `Updated admin role from ${targetUser.admin_role} to ${adminRole}`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated admin role for ${targetUser.email}`,
      admin: {
        ...updatedUser,
        admin_permissions: permissions || []
      }
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove admin access
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is master admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, is_admin, admin_role')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser?.is_admin || adminUser.admin_role !== 'master_admin') {
      return NextResponse.json({ error: 'Master admin access required' }, { status: 403 });
    }

    const targetUserId = params.id;

    // Prevent removing self
    if (targetUserId === adminUser.id) {
      return NextResponse.json({ 
        error: 'You cannot remove your own admin access' 
      }, { status: 400 });
    }

    // Get target user
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, is_admin')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetUser.is_admin) {
      return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
    }

    // Remove admin access
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_admin: false,
        admin_role: null,
        admin_permissions: null
      })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('Error removing admin:', updateError);
      return NextResponse.json({ error: 'Failed to remove admin' }, { status: 500 });
    }

    // Log the action
    await supabaseAdmin.from('admin_logs').insert({
      admin_email: session.user.email,
      action: 'remove_admin',
      target_email: targetUser.email,
      details: `Removed admin access from ${targetUser.email}`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: `Successfully removed admin access from ${targetUser.email}`
    });
  } catch (error) {
    console.error('Error removing admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

