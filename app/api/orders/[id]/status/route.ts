import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PATCH - Update order status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;
    const body = await request.json();
    const { status, paymentId } = body;

    // Validate status
    const validStatuses = ['pending', 'completed', 'cancelled', 'refunded'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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

    // Verify order belongs to user
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('seller_id', user.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (paymentId) {
      updateData.payment_id = paymentId;
    }

    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // If marking as completed, update product quantities
    if (status === 'completed' && order.status !== 'completed') {
      for (const item of order.order_items) {
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single();

        if (product && product.quantity !== null) {
          const newQuantity = Math.max(0, product.quantity - item.quantity);
          await supabaseAdmin
            .from('products')
            .update({
              quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id);
        }
      }
    }

    // If cancelling a completed order, restore product quantities
    if (status === 'cancelled' && order.status === 'completed') {
      for (const item of order.order_items) {
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single();

        if (product && product.quantity !== null) {
          await supabaseAdmin
            .from('products')
            .update({
              quantity: product.quantity + item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /api/orders/[id]/status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

