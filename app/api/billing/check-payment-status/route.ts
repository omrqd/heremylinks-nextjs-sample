import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cleanupDuplicateTransactions } from '@/lib/cleanup-duplicates';

const stripeSecret = process.env.STRIPE_SECRET_KEY as string;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-10-29.clover' }) : null;

// Safely derive the current period end ISO string from Stripe types
function getSubscriptionPeriodEndIso(
  sub: Stripe.Subscription | Stripe.Response<Stripe.Subscription> | any
): string | null {
  try {
    const ts =
      typeof sub?.current_period_end === 'number'
        ? sub.current_period_end
        : typeof sub?.data?.current_period_end === 'number'
          ? sub.data.current_period_end
          : null;
    return ts ? new Date(ts * 1000).toISOString() : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Checking for pending payments for:', session.user.email);

    // Get user's Stripe customer ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, is_premium')
      .eq('email', session.user.email)
      .single();

    // If already premium, no need to check
    if (user?.is_premium) {
      console.log('✅ User already premium, skipping check');
      return NextResponse.json({ already_premium: true });
    }

    // If no customer ID yet, check by email
    let customerId = user?.stripe_customer_id;
    
    if (!customerId) {
      // Search for customer by email
      const customers = await stripe.customers.list({
        email: session.user.email,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('📧 Found customer by email:', customerId);
      }
    }

    if (!customerId) {
      console.log('ℹ️ No Stripe customer found');
      return NextResponse.json({ no_customer: true });
    }

    // Get recent checkout sessions for this customer
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 10, // Check last 10 sessions
    });

    console.log(`📋 Found ${sessions.data.length} checkout sessions`);

    // Find successful paid sessions
    const paidSessions = sessions.data.filter(
      s => s.payment_status === 'paid' && s.status === 'complete'
    );

    if (paidSessions.length === 0) {
      console.log('ℹ️ No paid sessions found');
      return NextResponse.json({ no_paid_sessions: true });
    }

    console.log(`💳 Found ${paidSessions.length} paid sessions`);

    // Process the most recent paid session
    const latestPaidSession = paidSessions[0];
    const planType = latestPaidSession.mode === 'subscription' ? 'monthly' : 'lifetime';
    const now = new Date().toISOString();

    console.log('🔄 Processing session:', latestPaidSession.id);

    // Get subscription details if monthly
    let expiresAt: string | null = null;
    let subscriptionId: string | null = null;
    let shouldUpgrade = true;

    if (planType === 'monthly' && latestPaidSession.subscription) {
      subscriptionId = typeof latestPaidSession.subscription === 'string'
        ? latestPaidSession.subscription
        : latestPaidSession.subscription.id;

      try {
        const subscriptionRes = await stripe.subscriptions.retrieve(subscriptionId);
        expiresAt = getSubscriptionPeriodEndIso(subscriptionRes);
        
        // Check if subscription is actually active
        const subData = subscriptionRes as Stripe.Subscription;
        if (subData.status === 'canceled' || subData.status === 'incomplete' || subData.status === 'incomplete_expired' || subData.status === 'unpaid') {
          console.log('⚠️ Subscription is not active (status:', subData.status, ') - skipping upgrade');
          shouldUpgrade = false;
        }
      } catch (error: any) {
        console.error('❌ Error retrieving subscription:', error);
        // If subscription doesn't exist, don't upgrade
        if (error.code === 'resource_missing') {
          console.log('⚠️ Subscription not found in Stripe - skipping upgrade');
          shouldUpgrade = false;
        }
      }
    }

    // Only upgrade if subscription is active (or it's a lifetime plan)
    if (!shouldUpgrade) {
      console.log('ℹ️ Skipping user upgrade - subscription not active');
      return NextResponse.json({ 
        skipped: true, 
        reason: 'subscription_not_active' 
      });
    }

    // Update user premium status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_premium: true,
        premium_plan_type: planType,
        premium_started_at: now,
        premium_expires_at: expiresAt,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq('email', session.user.email);

    if (updateError) {
      console.error('❌ Error updating user premium status:', updateError);
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    console.log('✅ User premium status updated');

    // Check if transaction already exists
    const { data: existingTransaction, error: checkError } = await supabaseAdmin
      .from('billing_transactions')
      .select('id, external_id')
      .eq('external_id', latestPaidSession.id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking for existing transaction:', checkError);
    }

    if (existingTransaction) {
      console.log('ℹ️ Auto-check: Transaction already exists with ID:', existingTransaction.id);
    } else {
      console.log('💾 Auto-check: Creating new transaction');
      // Create transaction record
      const amountInDollars = (latestPaidSession.amount_total || 0) / 100;
      const { data: newTransaction, error: transactionError } = await supabaseAdmin
        .from('billing_transactions')
        .insert({
          email: session.user.email,
          plan_type: planType,
          amount: amountInDollars,
          currency: latestPaidSession.currency || 'usd',
          status: 'succeeded',
          event_type: 'auto_verified',
          external_id: latestPaidSession.id,
        })
        .select('id')
        .single();

      if (transactionError) {
        console.error('❌ Auto-check: Error inserting transaction:', transactionError);
        if (transactionError.code === '23505') {
          console.log('ℹ️ Auto-check: Duplicate caught by database constraint');
        }
      } else {
        console.log('✅ Auto-check: Transaction created with ID:', newTransaction?.id);
      }
    }

    // Auto-cleanup any duplicates after payment
    await cleanupDuplicateTransactions(session.user.email);

    return NextResponse.json({
      success: true,
      updated: true,
      plan_type: planType,
      session_id: latestPaidSession.id,
    });
  } catch (error: any) {
    console.error('❌ Error checking payment status:', error);
    return NextResponse.json({ error: error.message || 'Failed to check payment status' }, { status: 500 });
  }
}

