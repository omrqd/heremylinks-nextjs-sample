import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripeSecret = process.env.STRIPE_SECRET_KEY as string;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-10-29.clover' }) : null;

async function getOrCreateCustomer(email: string) {
  // Try to read stored customer ID
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id,stripe_customer_id')
      .eq('email', email)
      .limit(1)
      .maybeSingle();
    if (!error && user?.stripe_customer_id) {
      return user.stripe_customer_id as unknown as string;
    }
  } catch (e) {
    // ignore
  }

  const customer = await stripe!.customers.create({ email });
  try {
    await supabaseAdmin
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('email', email);
  } catch (e) {
    // ignore
  }
  return customer.id;
}

async function getOrCreateMonthlyPrice(): Promise<string> {
  // Try to find existing active price for monthly $3.99
  const prices = await stripe!.prices.list({ limit: 20 });
  const existing = prices.data.find(p => p.recurring?.interval === 'month' && p.unit_amount === 399 && p.active);
  if (existing) return existing.id;

  // Create a product and price
  const product = await stripe!.products.create({ name: 'HereMyLinks Premium Monthly' });
  const price = await stripe!.prices.create({
    currency: 'usd',
    unit_amount: 399,
    recurring: { interval: 'month' },
    product: product.id,
  });
  return price.id;
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

    const { paymentMethodId } = await request.json();
    if (!paymentMethodId) {
      return NextResponse.json({ error: 'paymentMethodId is required' }, { status: 400 });
    }

    const customerId = await getOrCreateCustomer(session.user.email);

    // Attach payment method and set as default
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });

    const priceId = await getOrCreateMonthlyPrice();

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        plan_type: 'monthly',
        user_email: session.user.email,
      },
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | string | null;
    let clientSecret: string | null = null;
    if (latestInvoice && typeof latestInvoice !== 'string') {
      const pi = (latestInvoice as any).payment_intent as Stripe.PaymentIntent | string | undefined;
      if (pi && typeof pi !== 'string') {
        clientSecret = pi.client_secret ?? null;
      }
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to create subscription' }, { status: 500 });
  }
}