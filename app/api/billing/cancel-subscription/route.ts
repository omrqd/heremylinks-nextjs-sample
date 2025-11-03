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
      .select('stripe_subscription_id, premium_plan_type')
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

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(
      user.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Update user record to reflect cancellation
    let expiresAt: string | null = null;
    if (subscription.current_period_end) {
      try {
        expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
      } catch (error) {
        console.error('Error converting expiry date:', error);
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        // Keep premium active until period end
        premium_expires_at: expiresAt,
      })
      .eq('email', session.user.email);

    if (updateError) {
      console.error('Error updating user after cancellation:', updateError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription will be cancelled at the end of the billing period',
      period_end: subscription.current_period_end,
      expires_at: expiresAt
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel subscription' }, { status: 500 });
  }
}

