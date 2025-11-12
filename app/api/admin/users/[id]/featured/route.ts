import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST - Toggle featured creator status
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;
    const body = await request.json();
    const { isFeatured } = body;

    // Get target user info
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, email, name, is_featured_creator, template, is_published, bio')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user profile is published (we feature the entire user design, not just template)
    if (isFeatured && !targetUser.is_published) {
      return NextResponse.json({ 
        error: `User ${targetUser.name || targetUser.username} must have their profile published before being featured` 
      }, { status: 400 });
    }

    // Update featured creator status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_featured_creator: isFeatured,
        featured_creator_since: isFeatured ? new Date().toISOString() : null
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating featured creator status:', updateError);
      return NextResponse.json({ error: 'Failed to update featured status' }, { status: 500 });
    }

    // Log the action
    await supabaseAdmin.from('admin_logs').insert({
      admin_email: session.user.email,
      action: isFeatured ? 'add_featured_creator' : 'remove_featured_creator',
      target_email: targetUser.email,
      details: isFeatured 
        ? `Marked ${targetUser.email} as featured template creator`
        : `Removed featured creator status from ${targetUser.email}`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: isFeatured 
        ? `${targetUser.name || targetUser.username} is now a featured creator`
        : `Removed featured creator status from ${targetUser.name || targetUser.username}`,
      isFeatured
    });
  } catch (error) {
    console.error('Error toggling featured creator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

