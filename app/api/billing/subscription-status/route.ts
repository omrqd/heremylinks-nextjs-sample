import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripeSecret = process.env.STRIPE_SECRET_KEY as string;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-10-29.clover' }) : null;

// Safely unwrap a Stripe subscription from a potential Response wrapper
function getSubscriptionData(
  sub: Stripe.Subscription | Stripe.Response<Stripe.Subscription> | any
): Stripe.Subscription | null {
  if (!sub) return null;
  if (typeof (sub as any)?.id === 'string') return sub as Stripe.Subscription;
  if (typeof (sub as any)?.data?.id === 'string') return (sub as any).data as Stripe.Subscription;
  return null;
}

// Safely derive the current period end ISO string
function getSubscriptionPeriodEndIso(
  sub: Stripe.Subscription | Stripe.Response<Stripe.Subscription> | any
): string | null {
  try {
    const ts =
      typeof (sub as any)?.current_period_end === 'number'
        ? (sub as any).current_period_end
        : typeof (sub as any)?.data?.current_period_end === 'number'
          ? (sub as any).data.current_period_end
          : null;
    return ts ? new Date(ts * 1000).toISOString() : null;
  } catch {
    return null;
  }
}

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
      .select('stripe_subscription_id, premium_plan_type, premium_expires_at, is_premium')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripe_subscription_id) {
      return NextResponse.json({ 
        cancel_at_period_end: false,
        status: 'no_subscription',
        is_premium: user.is_premium || false,
      });
    }

    // Retrieve subscription status from Stripe
    let subscriptionRes;
    let subData;
    let periodEndIso;
    
    try {
      subscriptionRes = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      subData = getSubscriptionData(subscriptionRes);
      periodEndIso = getSubscriptionPeriodEndIso(subscriptionRes);

      console.log('📊 Subscription status:', {
        id: subData?.id,
        status: subData?.status,
        cancel_at_period_end: subData?.cancel_at_period_end,
        current_period_end: (subData as any)?.current_period_end,
        period_end_iso: periodEndIso,
      });
    } catch (stripeError: any) {
      // Handle case where subscription doesn't exist in Stripe
      if (stripeError.code === 'resource_missing') {
        console.log('⚠️ Subscription not found in Stripe:', user.stripe_subscription_id);
        
        // Clean up the subscription ID in database if user is not premium
        if (!user.is_premium) {
          await supabaseAdmin
            .from('users')
            .update({
              stripe_subscription_id: null,
              premium_plan_type: null,
            })
            .eq('email', session.user.email);
        }
        
        return NextResponse.json({
          cancel_at_period_end: false,
          status: 'canceled',
          subscription_not_found: true,
          is_premium: user.is_premium || false,
        });
      }
      throw stripeError;
    }

    return NextResponse.json({
      cancel_at_period_end: subData?.cancel_at_period_end ?? false,
      status: subData?.status ?? 'unknown',
      current_period_end: (subData as any)?.current_period_end ?? null,
      current_period_end_date: periodEndIso,
      is_premium: user.is_premium || false,
    });
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    return NextResponse.json({ error: error.message || 'Failed to get subscription status' }, { status: 500 });
  }
}

