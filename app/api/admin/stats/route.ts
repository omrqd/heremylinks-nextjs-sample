import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
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

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get premium users count
    const { count: premiumUsers, error: premiumError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_premium', true);

    // Get free users count
    const { count: freeUsers, error: freeError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_premium', false);

    // Get total revenue from successful transactions
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('billing_transactions')
      .select('amount')
      .eq('status', 'succeeded');

    // Amount is already in dollars in the database
    const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    // Get active subscriptions count (premium users with monthly plan)
    const { count: activeSubscriptions, error: subsError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_premium', true)
      .eq('premium_plan_type', 'monthly');

    if (usersError || premiumError || freeError || transactionsError) {
      console.error('Database error:', { usersError, premiumError, freeError, transactionsError });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      premiumUsers: premiumUsers || 0,
      freeUsers: freeUsers || 0,
      totalRevenue: totalRevenue, // Already in dollars
      activeSubscriptions: activeSubscriptions || 0,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

