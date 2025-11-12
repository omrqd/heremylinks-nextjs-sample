import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all orders for current user (as seller)
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get orders with items
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          product_price,
          quantity,
          subtotal
        )
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Calculate revenue stats
    const completedOrders = orders?.filter(o => o.status === 'completed') || [];
    const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
    const totalOrders = completedOrders.length;

    return NextResponse.json({
      success: true,
      orders: orders || [],
      stats: {
        totalRevenue: totalRevenue.toFixed(2),
        totalOrders,
        pendingOrders: orders?.filter(o => o.status === 'pending').length || 0
      }
    });
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

