import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripeSecret = process.env.STRIPE_SECRET_KEY as string;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-10-29.clover' }) : null;

export async function GET(request: Request) {
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
      .select('stripe_subscription_id, premium_plan_type, premium_expires_at')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripe_subscription_id) {
      return NextResponse.json({ 
        cancel_at_period_end: false,
        status: 'no_subscription'
      });
    }

    // Retrieve subscription status from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);

    console.log('📊 Subscription status:', {
      id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end,
    });

    return NextResponse.json({
      cancel_at_period_end: subscription.cancel_at_period_end,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      current_period_end_date: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    });
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    return NextResponse.json({ error: error.message || 'Failed to get subscription status' }, { status: 500 });
  }
}

