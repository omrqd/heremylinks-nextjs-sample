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

    const { plan } = await request.json();
    if (plan !== 'monthly' && plan !== 'lifetime') {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Try to find or create a Stripe customer
    let customerId: string | undefined;
    try {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id,stripe_customer_id')
        .eq('email', session.user.email)
        .limit(1)
        .maybeSingle();

      if (!error && users?.stripe_customer_id) {
        customerId = users.stripe_customer_id as unknown as string;
      }
    } catch (e) {
      // ignore missing column errors for now
      console.warn('Unable to read stripe_customer_id from users:', e);
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
      });
      customerId = customer.id;
      // Attempt to store customerId if column exists
      try {
        await supabaseAdmin
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('email', session.user.email);
      } catch (e) {
        console.warn('Unable to store stripe_customer_id on user:', e);
      }
    }

    const origin = (request as any).nextUrl?.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const successUrl = `${origin}/dashboard/verified?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard/verified?canceled=true`;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      plan === 'monthly'
        ? [
            {
              price_data: {
                currency: 'usd',
                product_data: { name: 'HereMyLinks Premium Monthly' },
                unit_amount: 399,
                recurring: { interval: 'month' },
              },
              quantity: 1,
            },
          ]
        : [
            {
              price_data: {
                currency: 'usd',
                product_data: { name: 'HereMyLinks Premium Lifetime' },
                unit_amount: 1499,
              },
              quantity: 1,
            },
          ];

    const mode: Stripe.Checkout.SessionCreateParams.Mode = plan === 'monthly' ? 'subscription' : 'payment';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      customer: customerId,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        user_email: session.user.email,
        plan_type: plan,
      },
    };

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout session' }, { status: 500 });
  }
}