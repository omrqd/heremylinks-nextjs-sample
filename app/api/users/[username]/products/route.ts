import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get public products for a specific user
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;

    // Get user by username
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, show_products, is_published')
      .eq('username', username.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user's profile is published and products are enabled
    if (!user.is_published || !user.show_products) {
      return NextResponse.json({ products: [] });
    }

    // Get active products
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, description, price, image, product_type, quantity, position')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      products: products || [],
      sellerId: user.id
    });
  } catch (error) {
    console.error('Error in GET /api/users/[username]/products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

