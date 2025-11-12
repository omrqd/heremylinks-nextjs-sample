import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all admins
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

    // Only master admins can view all admins
    if (adminUser.admin_role !== 'master_admin') {
      return NextResponse.json({ error: 'Master admin access required' }, { status: 403 });
    }

    // Get all admin users
    const { data: admins, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        username,
        email,
        name,
        profile_image,
        is_admin,
        admin_role,
        admin_permissions,
        admin_created_at,
        admin_created_by,
        created_at
      `)
      .eq('is_admin', true)
      .order('admin_created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admins:', error);
      return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }

    // Get creator info for each admin separately
    const adminIds = admins?.map(a => a.admin_created_by).filter(Boolean) || [];
    const uniqueCreatorIds = Array.from(new Set(adminIds));
    
    let creatorsMap: any = {};
    if (uniqueCreatorIds.length > 0) {
      const { data: creators } = await supabaseAdmin
        .from('users')
        .select('id, username, email, name')
        .in('id', uniqueCreatorIds);
      
      creators?.forEach(creator => {
        creatorsMap[creator.id] = creator;
      });
    }

    // Parse admin_permissions JSON and add creator info for each admin
    const formattedAdmins = admins?.map(admin => ({
      ...admin,
      admin_permissions: admin.admin_permissions ? JSON.parse(admin.admin_permissions) : [],
      creator: admin.admin_created_by ? creatorsMap[admin.admin_created_by] : null
    }));

    return NextResponse.json({
      success: true,
      admins: formattedAdmins || []
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add new admin
export async function POST(request: Request) {
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

    const body = await request.json();
    const { userId, adminRole, permissions } = body;

    if (!userId || !adminRole) {
      return NextResponse.json({ 
        error: 'User ID and admin role are required' 
      }, { status: 400 });
    }

    // Verify user exists and is not already an admin
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, is_admin')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.is_admin) {
      return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
    }

    // Update user to admin
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_admin: true,
        admin_role: adminRole,
        admin_permissions: JSON.stringify(permissions || []),
        admin_created_at: new Date().toISOString(),
        admin_created_by: adminUser.id
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error creating admin:', updateError);
      return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
    }

    // Log the action
    await supabaseAdmin.from('admin_logs').insert({
      admin_email: session.user.email,
      action: 'create_admin',
      target_email: targetUser.email,
      details: `Granted ${adminRole} role to ${targetUser.email}`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: `Successfully granted admin access to ${targetUser.email}`,
      admin: {
        ...updatedUser,
        admin_permissions: permissions || []
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

