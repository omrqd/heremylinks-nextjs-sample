import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - List all promo codes with stats
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('is_admin, admin_role')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all promo codes with creator info
    const { data: promoCodes, error: promosError } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (promosError) {
      console.error('Error fetching promo codes:', promosError);
      return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 });
    }

    // Get creator names and assigned user names
    const creatorIds = Array.from(new Set(promoCodes?.map(p => p.created_by) || []));
    const assignedUserIds = Array.from(new Set(promoCodes?.filter(p => p.assigned_user_id).map(p => p.assigned_user_id) || []));
    const allUserIds = Array.from(new Set([...creatorIds, ...assignedUserIds]));

    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, username, email')
      .in('id', allUserIds);

    const usersMap = new Map(users?.map(u => [u.id, u]) || []);

    // Enrich promo codes with creator and assigned user info
    const enrichedPromoCodes = promoCodes?.map(promo => ({
      ...promo,
      creator: usersMap.get(promo.created_by),
      assigned_user: promo.assigned_user_id ? usersMap.get(promo.assigned_user_id) : null
    }));

    return NextResponse.json({
      success: true,
      promoCodes: enrichedPromoCodes || []
    });
  } catch (error) {
    console.error('Error in GET /api/admin/promos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new promo code
export async function POST(request: Request) {
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
    const {
      code,
      premiumDurationDays,
      maxRedemptions,
      assignedUserId,
      expiresAt
    } = body;

    // Validation
    if (!code || !premiumDurationDays) {
      return NextResponse.json({ 
        error: 'Code and premium duration are required' 
      }, { status: 400 });
    }

    if (premiumDurationDays < 1) {
      return NextResponse.json({ 
        error: 'Premium duration must be at least 1 day' 
      }, { status: 400 });
    }

    if (maxRedemptions !== null && maxRedemptions < 1) {
      return NextResponse.json({ 
        error: 'Max redemptions must be at least 1 or null for infinite' 
      }, { status: 400 });
    }

    // Check if code already exists
    const { data: existingCode } = await supabaseAdmin
      .from('promo_codes')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existingCode) {
      return NextResponse.json({ 
        error: 'Promo code already exists' 
      }, { status: 400 });
    }

    // If assigned to specific user, verify user exists
    if (assignedUserId) {
      const { data: assignedUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', assignedUserId)
        .single();

      if (!assignedUser) {
        return NextResponse.json({ 
          error: 'Assigned user not found' 
        }, { status: 404 });
      }
    }

    // Create promo code
    const { data: newPromoCode, error: createError } = await supabaseAdmin
      .from('promo_codes')
      .insert({
        code: code.toUpperCase(),
        premium_duration_days: premiumDurationDays,
        max_redemptions: maxRedemptions,
        assigned_user_id: assignedUserId || null,
        created_by: adminUser.id,
        expires_at: expiresAt || null
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating promo code:', createError);
      return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_logs')
      .insert({
        admin_id: adminUser.id,
        action: 'create_promo_code',
        target_type: 'promo_code',
        target_id: newPromoCode.id,
        details: {
          code: newPromoCode.code,
          premium_duration_days: premiumDurationDays,
          max_redemptions: maxRedemptions,
          assigned_user_id: assignedUserId
        }
      });

    console.log('✅ Promo code created:', newPromoCode.code);

    return NextResponse.json({
      success: true,
      promoCode: newPromoCode,
      message: 'Promo code created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/admin/promos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

