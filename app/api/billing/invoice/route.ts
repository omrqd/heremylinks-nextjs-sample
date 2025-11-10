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

    // Get external_id (session ID) from query params
    const { searchParams } = new URL(request.url);
    const externalId = searchParams.get('external_id');

    if (!externalId) {
      return NextResponse.json({ error: 'Missing external_id' }, { status: 400 });
    }

    // Verify this transaction belongs to the user
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('billing_transactions')
      .select('email, external_id, plan_type, amount')
      .eq('external_id', externalId)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized access to this invoice' }, { status: 403 });
    }

    console.log('📄 Fetching invoice for external_id:', externalId);

    // Get the checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(externalId);

    // For subscriptions, get the invoice
    if (checkoutSession.invoice) {
      const invoiceId = typeof checkoutSession.invoice === 'string' 
        ? checkoutSession.invoice 
        : checkoutSession.invoice.id;

      const invoice = await stripe.invoices.retrieve(invoiceId);

      console.log('✅ Invoice found:', {
        id: invoice.id,
        number: invoice.number,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
      });

      // Return the invoice URL
      return NextResponse.json({
        success: true,
        invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        invoice_number: invoice.number,
      });
    }

    // For one-time payments (lifetime), generate a receipt
    if (checkoutSession.payment_intent) {
      const paymentIntentId = typeof checkoutSession.payment_intent === 'string'
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent.id;

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['charges.data']
      }) as any;

      // Get the charge to find receipt URL
      if (paymentIntent.charges?.data?.[0]) {
        const charge = paymentIntent.charges.data[0];
        
        console.log('✅ Receipt found:', {
          id: charge.id,
          receipt_url: charge.receipt_url,
        });

        return NextResponse.json({
          success: true,
          invoice_url: charge.receipt_url,
          invoice_pdf: charge.receipt_url, // Stripe receipt URL
          invoice_number: charge.id,
        });
      }
    }

    // Fallback: Create a simple invoice data response
    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.external_id,
        plan_type: transaction.plan_type,
        amount: transaction.amount,
        email: transaction.email,
      },
      message: 'Invoice not available in Stripe. This is test mode data.',
    });

  } catch (error: any) {
    console.error('❌ Error fetching invoice:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch invoice' 
    }, { status: 500 });
  }
}

