import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

    // Get period from query params (daily, monthly, yearly)
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';

    // Get all successful transactions
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('billing_transactions')
      .select('amount, created_at')
      .eq('status', 'succeeded')
      .order('created_at', { ascending: true });

    if (transactionsError) {
      console.error('Database error:', transactionsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Group transactions by period
    const revenueData = groupTransactionsByPeriod(transactions || [], period);

    return NextResponse.json({
      period,
      data: revenueData,
    });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function groupTransactionsByPeriod(transactions: any[], period: string) {
  const grouped: { [key: string]: number } = {};

  transactions.forEach(tx => {
    const date = new Date(tx.created_at);
    let key: string;

    if (period === 'daily') {
      // Last 30 days
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (period === 'monthly') {
      // Last 12 months
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    } else if (period === 'yearly') {
      // All years
      key = String(date.getFullYear()); // YYYY
    } else {
      key = date.toISOString().split('T')[0];
    }

    grouped[key] = (grouped[key] || 0) + (tx.amount || 0);
  });

  // Convert to array and format for charts
  let result = Object.entries(grouped).map(([date, amount]) => ({
    date,
    revenue: Math.round(amount * 100) / 100, // Round to 2 decimals
  }));

  // Filter and fill missing dates based on period
  if (period === 'daily') {
    result = fillMissingDays(result, 30);
  } else if (period === 'monthly') {
    result = fillMissingMonths(result, 12);
  } else if (period === 'yearly') {
    result = fillMissingYears(result);
  }

  return result;
}

function fillMissingDays(data: any[], days: number) {
  const filled: any[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const existing = data.find(d => d.date === dateStr);
    filled.push({
      date: dateStr,
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
      revenue: existing ? existing.revenue : 0,
    });
  }
  
  return filled;
}

function fillMissingMonths(data: any[], months: number) {
  const filled: any[] = [];
  const today = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const existing = data.find(d => d.date === dateStr);
    filled.push({
      date: dateStr,
      displayDate: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
      revenue: existing ? existing.revenue : 0,
    });
  }
  
  return filled;
}

function fillMissingYears(data: any[]) {
  if (data.length === 0) {
    const currentYear = new Date().getFullYear();
    return [{ date: String(currentYear), displayDate: String(currentYear), revenue: 0 }];
  }

  const years = data.map(d => parseInt(d.date)).sort((a, b) => a - b);
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  
  const filled: any[] = [];
  
  for (let year = minYear; year <= maxYear; year++) {
    const existing = data.find(d => d.date === String(year));
    filled.push({
      date: String(year),
      displayDate: String(year),
      revenue: existing ? existing.revenue : 0,
    });
  }
  
  return filled;
}

