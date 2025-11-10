import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripeSecret = process.env.STRIPE_SECRET_KEY as string;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-10-29.clover' }) : null;

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_subscription_id, premium_plan_type, is_premium')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    if (user.premium_plan_type !== 'monthly') {
      return NextResponse.json({ error: 'Only monthly subscriptions can be cancelled' }, { status: 400 });
    }

    // Check if user is already cancelled
    if (!user.is_premium) {
      console.log('⚠️ User already downgraded, cleaning up subscription ID');
      
      // Clean up the subscription ID in database
      await supabaseAdmin
        .from('users')
        .update({
          stripe_subscription_id: null,
          premium_plan_type: null,
          premium_expires_at: null,
        })
        .eq('email', session.user.email);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Subscription already cancelled.',
        already_cancelled: true,
      });
    }

    // Try to cancel the subscription in Stripe
    let cancelled;
    try {
      cancelled = await stripe.subscriptions.cancel(user.stripe_subscription_id);
      console.log('✅ Subscription cancelled in Stripe:', cancelled.id);
    } catch (stripeError: any) {
      // If subscription doesn't exist in Stripe (already deleted), that's okay
      if (stripeError.code === 'resource_missing') {
        console.log('⚠️ Subscription not found in Stripe, proceeding with local cleanup');
        cancelled = null;
      } else {
        throw stripeError;
      }
    }

    // Immediately downgrade the user
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_premium: false,
        premium_plan_type: null,
        premium_expires_at: null,
        stripe_subscription_id: null,
      })
      .eq('email', session.user.email);

    if (updateError) {
      console.error('Error updating user after immediate cancellation:', updateError);
      throw new Error('Failed to update user subscription status');
    }

    console.log('✅ User downgraded successfully:', session.user.email);

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription cancelled immediately. Premium access removed.',
      cancelled_subscription_id: cancelled?.id || user.stripe_subscription_id,
      status: cancelled?.status || 'canceled',
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel subscription' }, { status: 500 });
  }
}

