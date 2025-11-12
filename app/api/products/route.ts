import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all products for current user
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get products
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      products: products || []
    });
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, is_premium')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if premium
    if (!user.is_premium) {
      return NextResponse.json({ 
        error: 'Premium subscription required to add products' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, image, productType, quantity } = body;

    // Validation
    if (!name || !price) {
      return NextResponse.json({ 
        error: 'Product name and price are required' 
      }, { status: 400 });
    }

    if (price < 0) {
      return NextResponse.json({ 
        error: 'Price must be a positive number' 
      }, { status: 400 });
    }

    // Get highest position
    const { data: maxProduct } = await supabaseAdmin
      .from('products')
      .select('position')
      .eq('user_id', user.id)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const newPosition = maxProduct ? maxProduct.position + 1 : 0;

    // Create product
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        price: parseFloat(price),
        image: image || null,
        product_type: productType || 'physical',
        quantity: quantity !== undefined && quantity !== null ? parseInt(quantity) : null,
        position: newPosition
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

