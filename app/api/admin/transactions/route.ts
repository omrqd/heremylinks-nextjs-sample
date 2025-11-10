import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - List transactions with pagination, search, and filters
export async function GET(request: Request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';
    const gatewayFilter = searchParams.get('gateway') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const offset = (page - 1) * limit;

    // Build query - we'll get transactions and then join with users
    let query = supabaseAdmin
      .from('billing_transactions')
      .select('*', { count: 'exact' });

    // Apply search filter (search by email or external_id)
    if (search) {
      query = query.or(`email.ilike.%${search}%,external_id.ilike.%${search}%`);
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    // Apply date range filter
    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      // Add one day to include the entire end date
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('created_at', endDate.toISOString());
    }

    // Apply pagination and ordering
    const { data: transactions, error: transactionsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (transactionsError) {
      console.error('Database error:', transactionsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Get user details for each transaction
    const transactionsWithUsers = await Promise.all(
      (transactions || []).map(async (transaction) => {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, username, name, profile_image')
          .eq('email', transaction.email)
          .single();

        // Determine payment gateway from external_id or event_type
        let paymentGateway = 'Unknown';
        if (transaction.external_id) {
          if (transaction.external_id.startsWith('ch_') || transaction.external_id.startsWith('cs_') || transaction.external_id.startsWith('pi_')) {
            paymentGateway = 'Stripe';
          } else if (transaction.external_id.includes('paypal')) {
            paymentGateway = 'PayPal';
          }
        }
        if (transaction.event_type && transaction.event_type.includes('stripe')) {
          paymentGateway = 'Stripe';
        }

        return {
          ...transaction,
          user: user || null,
          paymentGateway,
        };
      })
    );

    // Apply gateway filter (after determining gateways)
    let filteredTransactions = transactionsWithUsers;
    if (gatewayFilter && gatewayFilter !== 'all') {
      filteredTransactions = transactionsWithUsers.filter(
        (t) => t.paymentGateway.toLowerCase() === gatewayFilter.toLowerCase()
      );
    }

    return NextResponse.json({
      transactions: filteredTransactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
