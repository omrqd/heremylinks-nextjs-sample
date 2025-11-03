import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY as string;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-10-29.clover' }) : null;

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const invoiceId = context.params.id;
    const invoice = await stripe.invoices.retrieve(invoiceId);

    const hostedUrl = invoice.hosted_invoice_url;
    const pdfUrl = (invoice as any).invoice_pdf as string | undefined;

    if (hostedUrl) {
      return NextResponse.redirect(hostedUrl, { status: 302 });
    }
    if (pdfUrl) {
      return NextResponse.redirect(pdfUrl, { status: 302 });
    }

    return NextResponse.json({ error: 'Invoice URL not available' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invoice' }, { status: 500 });
  }
}