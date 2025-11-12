import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST - Create order (public endpoint for visitors)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sellerUserId, customerName, customerEmail, customerAddress, products, paymentMethod } = body;

    // Validation
    if (!sellerUserId || !customerName || !customerEmail || !products || products.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get seller
    const { data: seller } = await supabaseAdmin
      .from('users')
      .select('id, name, username')
      .eq('id', sellerUserId)
      .single();

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Verify products exist and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of products) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .eq('user_id', seller.id)
        .eq('is_active', true)
        .single();

      if (!product) {
        return NextResponse.json({ 
          error: `Product ${item.productName || item.productId} not found or unavailable` 
        }, { status: 404 });
      }

      // Check quantity availability (if limited)
      if (product.quantity !== null && product.quantity < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient quantity for ${product.name}` 
        }, { status: 400 });
      }

      const subtotal = parseFloat(item.price) * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        product_id: product.id,
        product_name: item.productName || product.name,
        product_price: item.price,
        quantity: item.quantity,
        subtotal
      });
    }

    // Create order as PENDING (waiting for payment)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        seller_id: seller.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_address: customerAddress || null,
        total_amount: totalAmount,
        status: 'pending', // Pending until PayPal payment is confirmed
        payment_method: paymentMethod || 'paypal',
        payment_id: null // Will be set after PayPal confirmation
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // DON'T update quantities yet - wait for payment confirmation
    // Quantities will be updated when order status changes to 'completed'

    // Get seller's PayPal configuration
    const { data: paymentConfig } = await supabaseAdmin
      .from('payment_configs')
      .select('paypal_username, paypal_email')
      .eq('user_id', seller.id)
      .single();

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        totalAmount: order.total_amount,
        sellerName: seller.name || seller.username,
        sellerPaypalUsername: paymentConfig?.paypal_username || null,
        sellerPaypalEmail: paymentConfig?.paypal_email || null
      },
      message: 'Order created - awaiting payment'
    });
  } catch (error) {
    console.error('Error in POST /api/checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

