import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
    }

    // Get current user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, username, is_premium, premium_started_at, premium_plan_type')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already premium
    if (user.is_premium) {
      return NextResponse.json({ 
        error: 'You already have an active premium subscription. You cannot redeem promo codes while premium.' 
      }, { status: 400 });
    }

    // Get promo code
    const { data: promoCode, error: promoError } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (promoError || !promoCode) {
      return NextResponse.json({ 
        error: 'Invalid or inactive promo code' 
      }, { status: 404 });
    }

    // Check if code has expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'This promo code has expired' 
      }, { status: 400 });
    }

    // Check if code is assigned to specific user
    if (promoCode.assigned_user_id && promoCode.assigned_user_id !== user.id) {
      return NextResponse.json({ 
        error: 'This promo code is not available for your account' 
      }, { status: 403 });
    }

    // Check if user has already redeemed this code
    const { data: existingRedemption } = await supabaseAdmin
      .from('promo_code_redemptions')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', user.id)
      .single();

    if (existingRedemption) {
      return NextResponse.json({ 
        error: 'You have already redeemed this promo code' 
      }, { status: 400 });
    }

    // Check if code has redemptions left
    if (promoCode.max_redemptions !== null && 
        promoCode.current_redemptions >= promoCode.max_redemptions) {
      return NextResponse.json({ 
        error: 'This promo code has reached its redemption limit' 
      }, { status: 400 });
    }

    // Calculate new premium end date
    const now = new Date();
    const premiumEndDate = new Date(now.getTime() + (promoCode.premium_duration_days * 24 * 60 * 60 * 1000));

    // Start a transaction-like operation
    // 1. Update user to premium
    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({
        is_premium: true,
        premium_started_at: now.toISOString(),
        premium_plan_type: 'promo',
        premium_end_date: premiumEndDate.toISOString()
      })
      .eq('id', user.id);

    if (updateUserError) {
      console.error('Error updating user to premium:', updateUserError);
      return NextResponse.json({ error: 'Failed to apply premium' }, { status: 500 });
    }

    // 2. Record redemption
    const { error: redemptionError } = await supabaseAdmin
      .from('promo_code_redemptions')
      .insert({
        promo_code_id: promoCode.id,
        user_id: user.id,
        premium_duration_days: promoCode.premium_duration_days
      });

    if (redemptionError) {
      console.error('Error recording redemption:', redemptionError);
      // Rollback user premium status
      await supabaseAdmin
        .from('users')
        .update({
          is_premium: false,
          premium_started_at: null,
          premium_plan_type: null,
          premium_end_date: null
        })
        .eq('id', user.id);
      return NextResponse.json({ error: 'Failed to record redemption' }, { status: 500 });
    }

    // 3. Increment redemption count
    const { error: incrementError } = await supabaseAdmin
      .from('promo_codes')
      .update({
        current_redemptions: promoCode.current_redemptions + 1,
        updated_at: now.toISOString()
      })
      .eq('id', promoCode.id);

    if (incrementError) {
      console.error('Error incrementing redemption count:', incrementError);
    }

    console.log(`✅ Promo code ${promoCode.code} redeemed by ${user.email} for ${promoCode.premium_duration_days} days`);

    return NextResponse.json({
      success: true,
      message: `Promo code redeemed! You now have premium for ${promoCode.premium_duration_days} days.`,
      premiumDurationDays: promoCode.premium_duration_days,
      premiumEndDate: premiumEndDate.toISOString()
    });
  } catch (error) {
    console.error('Error in POST /api/promos/redeem:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

