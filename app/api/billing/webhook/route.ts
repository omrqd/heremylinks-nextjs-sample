import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const stripeSecret = process.env.STRIPE_SECRET_KEY as string;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-10-29.clover' }) : null;

export async function POST(request: Request) {
  console.log('🔔 Webhook received:', new Date().toISOString());
  
  if (!stripe || !webhookSecret) {
    console.error('❌ Stripe webhook not configured - missing env vars');
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 500 });
  }

  const sig = (request as any).headers.get('stripe-signature');
  const body = await (request as any).text();
  
  console.log('📝 Webhook signature present:', !!sig);
  console.log('📝 Webhook body length:', body?.length || 0);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
    console.log('✅ Webhook signature verified successfully');
    console.log('📋 Event type:', event.type);
    console.log('📋 Event ID:', event.id);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    console.log('🔄 Processing event:', event.type);
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('💳 Processing checkout.session.completed');
        const session = event.data.object as Stripe.Checkout.Session;
        let email = session.customer_details?.email || (session.metadata?.user_email as string | undefined);
        console.log('📧 Initial email from session:', email);
        console.log('🛒 Session mode:', session.mode);
        console.log('💰 Session amount:', session.amount_total);
        
        // Fallback to customer lookup if email missing
        if (!email && typeof session.customer === 'string') {
          console.log('🔍 Looking up customer email from Stripe...');
          try {
            const cust = await stripe.customers.retrieve(session.customer);
            email = (cust as Stripe.Customer).email || undefined;
            console.log('📧 Customer email from Stripe:', email);
          } catch (e) {
            console.warn('⚠️ Failed to retrieve customer for session:', e);
          }
        }
        const planType = session.mode === 'subscription' ? 'monthly' : 'lifetime';
        console.log('📋 Plan type determined:', planType);
        
        if (email) {
          console.log('✅ Processing payment for email:', email);
          await markUserPremium(email, planType, session);
          await insertTransaction(email, planType, session.amount_total || 0, 'checkout.session.completed', session.id);
          console.log('✅ Checkout session processing completed');
        } else {
          console.error('❌ No email found for checkout session:', session.id);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        let email = (invoice.customer_email as string | null) || null;
        if (!email && typeof invoice.customer === 'string') {
          try {
            const cust = await stripe.customers.retrieve(invoice.customer);
            email = (cust as Stripe.Customer).email || null;
          } catch (e) {
            console.warn('Failed to retrieve customer for invoice:', e);
          }
        }
        if (email) {
          await insertTransaction(email, 'monthly', invoice.amount_paid || 0, 'invoice.payment_succeeded', invoice.id);
        }
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        let email = (pi.metadata?.user_email as string | undefined);
        if (!email && typeof pi.customer === 'string') {
          try {
            const cust = await stripe.customers.retrieve(pi.customer);
            email = (cust as Stripe.Customer).email || undefined;
          } catch (e) {
            console.warn('Failed to retrieve customer for payment_intent:', e);
          }
        }
        if (email) {
          await markUserPremium(email, 'lifetime', pi);
          await insertTransaction(email, 'lifetime', pi.amount_received || 0, 'payment_intent.succeeded', pi.id);
        }
        break;
      }
      default:
        // Ignore other events
        break;
    }
  } catch (e) {
    console.error('Webhook handling error:', e);
  }

  return NextResponse.json({ received: true });
}

async function markUserPremium(email: string, planType: 'monthly' | 'lifetime', source: any) {
  console.log('👤 Marking user premium:', { email, planType });
  const now = new Date().toISOString();
  let expiresAt: string | null = null;
  let subscriptionId: string | null = null;

  // For monthly subscriptions, get the expiration date
  if (planType === 'monthly' && source.subscription) {
    try {
      subscriptionId = typeof source.subscription === 'string' ? source.subscription : source.subscription.id;
      if (stripe && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.current_period_end) {
          expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
        }
      }
    } catch (error) {
      console.error('❌ Error retrieving subscription for expiry:', error);
    }
  }

  try {
    const updateData: any = {
        is_premium: true,
        premium_plan_type: planType,
        premium_started_at: now,
        premium_expires_at: expiresAt,
    };

    // Add subscription ID for monthly plans
    if (subscriptionId) {
      updateData.stripe_subscription_id = subscriptionId;
    }

    const result = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('email', email);
    
    console.log('✅ User premium update result:', result);
    if (result.error) {
      console.error('❌ Supabase error updating user:', result.error);
    }
  } catch (e) {
    console.error('❌ Failed to update user premium fields (ensure migration ran):', e);
  }
}

async function insertTransaction(email: string, planType: 'monthly' | 'lifetime', amount: number, eventType: string, externalId: string) {
  console.log('💾 Webhook: Inserting transaction:', { email, planType, amount, eventType, externalId });
  try {
    // Check if transaction already exists (prevent duplicates)
    const { data: existingTransaction, error: checkError } = await supabaseAdmin
      .from('billing_transactions')
      .select('id, external_id')
      .eq('external_id', externalId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking for existing transaction:', checkError);
    }

    if (existingTransaction) {
      console.log('ℹ️ Webhook: Transaction already exists with ID:', existingTransaction.id, '- Skipping insert');
      return;
    }

    console.log('💾 Webhook: No existing transaction, creating new one');

    // Convert cents to dollars
    const amountInDollars = amount / 100;
    
    const { data: newTransaction, error: insertError } = await supabaseAdmin
      .from('billing_transactions')
      .insert({
      email,
      plan_type: planType,
        amount: amountInDollars,
      currency: 'usd',
      status: 'succeeded',
      event_type: eventType,
      external_id: externalId,
      created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ Webhook: Error inserting transaction:', insertError);
      // Check if it's a duplicate key error
      if (insertError.code === '23505') {
        console.log('ℹ️ Webhook: Duplicate caught by database constraint');
      }
    } else {
      console.log('✅ Webhook: Transaction created with ID:', newTransaction?.id);
    }
  } catch (e) {
    console.error('❌ Webhook: Failed to insert billing transaction:', e);
  }
}