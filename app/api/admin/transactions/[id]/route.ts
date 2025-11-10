import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get single transaction
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('is_admin, admin_role')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: transaction, error } = await supabaseAdmin
      .from('billing_transactions')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Get user details
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, username, name, email, profile_image, is_premium, premium_plan_type')
      .eq('email', transaction.email)
      .single();

    // Determine payment gateway
    let paymentGateway = 'Unknown';
    if (transaction.external_id) {
      if (transaction.external_id.startsWith('ch_') || transaction.external_id.startsWith('cs_') || transaction.external_id.startsWith('pi_')) {
        paymentGateway = 'Stripe';
      } else if (transaction.external_id.includes('paypal')) {
        paymentGateway = 'PayPal';
      }
    }

    return NextResponse.json({
      transaction: {
        ...transaction,
        user: user || null,
        paymentGateway,
      },
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete transaction
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('is_admin, admin_role')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if transaction exists
    const { data: transaction } = await supabaseAdmin
      .from('billing_transactions')
      .select('id, email, amount')
      .eq('id', params.id)
      .single();

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Delete transaction
    const { error: deleteError } = await supabaseAdmin
      .from('billing_transactions')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting transaction:', deleteError);
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

