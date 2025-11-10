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

    const { session_id } = await request.json();
    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve the Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
    
    console.log('📋 Checkout session retrieved:', {
      id: checkoutSession.id,
      mode: checkoutSession.mode,
      payment_status: checkoutSession.payment_status,
      customer: checkoutSession.customer,
      subscription: checkoutSession.subscription,
    });

    // Verify the session belongs to the current user
    const sessionEmail = checkoutSession.customer_details?.email || checkoutSession.metadata?.user_email;
    if (sessionEmail !== session.user.email) {
      console.error('❌ Email mismatch:', { sessionEmail, userEmail: session.user.email });
      return NextResponse.json({ error: 'Session email mismatch' }, { status: 403 });
    }

    // Check if payment was successful
    if (checkoutSession.payment_status !== 'paid') {
      console.error('❌ Payment not completed:', checkoutSession.payment_status);
      return NextResponse.json({ error: 'Payment not completed', status: checkoutSession.payment_status }, { status: 400 });
    }

    // Determine plan type
    const planType = checkoutSession.mode === 'subscription' ? 'monthly' : 'lifetime';
    const now = new Date().toISOString();
    
    console.log('✅ Payment verified:', { planType, email: session.user.email });

    // Calculate expiration date for monthly subscriptions
    let expiresAt: string | null = null;
    let subscriptionId: string | null = null;

    if (planType === 'monthly' && checkoutSession.subscription) {
      subscriptionId = typeof checkoutSession.subscription === 'string' 
        ? checkoutSession.subscription 
        : checkoutSession.subscription.id;
      
      console.log('📅 Retrieving subscription details for monthly plan:', subscriptionId);
      
      // Retrieve subscription to get the current period end
      try {
        const subscriptionRes = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEndIso = getSubscriptionPeriodEndIso(subscriptionRes);
        console.log('📅 Subscription retrieved:', {
          id: (subscriptionRes as any)?.id || (subscriptionRes as any)?.data?.id,
          status: (subscriptionRes as any)?.status || (subscriptionRes as any)?.data?.status,
          period_end_iso: periodEndIso,
        });

        if (periodEndIso) {
          expiresAt = periodEndIso;
          console.log('✅ Expiry date set to:', expiresAt);
          console.log('✅ Expiry date type:', typeof expiresAt);
          console.log('✅ Expiry date length:', (expiresAt || '').length);
        } else {
          console.warn('⚠️ No current_period_end found in subscription');
          console.warn('⚠️ Subscription object keys:', Object.keys(subscriptionRes));

          // Fallback: Set to 1 month from now
          const fallbackDate = new Date();
          fallbackDate.setMonth(fallbackDate.getMonth() + 1);
          expiresAt = fallbackDate.toISOString();
          console.log('⚠️ Using fallback expiry date:', expiresAt);
        }
      } catch (error) {
        console.error('❌ Error retrieving subscription:', error);
        
        // Fallback: Set to 1 month from now
        const fallbackDate = new Date();
        fallbackDate.setMonth(fallbackDate.getMonth() + 1);
        expiresAt = fallbackDate.toISOString();
        console.log('⚠️ Error occurred, using fallback expiry date:', expiresAt);
      }
    }
    
    console.log('📋 Final update values:', {
      planType,
      expiresAt,
      subscriptionId,
      customerId: typeof checkoutSession.customer === 'string' ? checkoutSession.customer : checkoutSession.customer?.id,
    });

    // Get Stripe customer ID
    const customerId = typeof checkoutSession.customer === 'string' 
      ? checkoutSession.customer 
      : checkoutSession.customer?.id;

    // Update user premium status
    console.log('💾 About to update Supabase with these values:', {
      is_premium: true,
      premium_plan_type: planType,
      premium_started_at: now,
      premium_expires_at: expiresAt,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      user_email: session.user.email,
    });

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_premium: true,
        premium_plan_type: planType,
        premium_started_at: now,
        premium_expires_at: expiresAt,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq('email', session.user.email)
      .select();

    if (updateError) {
      console.error('❌ Error updating user premium status:', updateError);
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    console.log('✅ Supabase update successful. Updated rows:', updateData);
    
    // Verify the update by reading back
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('email, is_premium, premium_plan_type, premium_expires_at, stripe_subscription_id')
      .eq('email', session.user.email)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log('✅ Verified data in database:', verifyData);
    }

    // Insert transaction record (check for duplicates first)
    console.log('💾 Checking for existing transaction with ID:', session_id);
    
    // Check if transaction already exists - use maybeSingle to avoid errors
    const { data: existingTransaction, error: checkError } = await supabaseAdmin
      .from('billing_transactions')
      .select('id, external_id')
      .eq('external_id', session_id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking for existing transaction:', checkError);
    }

    if (existingTransaction) {
      console.log('ℹ️ Transaction already exists with ID:', existingTransaction.id, '- Skipping insert');
    } else {
      console.log('💾 No existing transaction found, creating new one');
      const amountInDollars = (checkoutSession.amount_total || 0) / 100;
      
      const { data: newTransaction, error: transactionError } = await supabaseAdmin
        .from('billing_transactions')
        .insert({
          email: session.user.email,
          plan_type: planType,
          amount: amountInDollars,
          currency: checkoutSession.currency || 'usd',
          status: 'succeeded',
          event_type: 'checkout.session.completed',
          external_id: session_id,
        })
        .select('id')
        .single();

      if (transactionError) {
        console.error('❌ Error inserting transaction:', transactionError);
        // Check if it's a duplicate key error (23505 is PostgreSQL unique violation)
        if (transactionError.code === '23505') {
          console.log('ℹ️ Duplicate transaction detected by database constraint');
        }
      } else {
        console.log('✅ Transaction created successfully with ID:', newTransaction?.id);
      }
    }

    // Auto-cleanup any duplicates after payment
    await cleanupDuplicateTransactions(session.user.email);

    return NextResponse.json({ 
      success: true, 
      plan_type: planType,
      expires_at: expiresAt 
    });
  } catch (error: any) {
    console.error('Error verifying session:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify session' }, { status: 500 });
  }
}

