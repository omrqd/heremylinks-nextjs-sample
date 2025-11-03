import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: transactions, error } = await supabaseAdmin
      .from('billing_transactions')
      .select('created_at,plan_type,amount,currency,status,event_type,external_id')
      .eq('email', session.user.email)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error: any) {
    console.error('Error in transactions API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

