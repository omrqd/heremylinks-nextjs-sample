import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';

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
    if (plan !== 'monthly') {
      return NextResponse.json({ error: 'Invalid plan for setup intent' }, { status: 400 });
    }

    const setupIntent = await stripe.setupIntents.create({
      automatic_payment_methods: { enabled: true },
      metadata: {
        plan_type: 'monthly',
        user_email: session.user.email,
      },
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json({ error: error.message || 'Failed to create setup intent' }, { status: 500 });
  }
}