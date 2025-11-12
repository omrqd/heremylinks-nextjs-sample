import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get payment configuration
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

    // Get payment config
    const { data: config, error } = await supabaseAdmin
      .from('payment_configs')
      .select('id, paypal_email, paypal_username, paypal_client_id, paypal_secret, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching payment config:', error);
      return NextResponse.json({ error: 'Failed to fetch payment config' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      config: config || null
    });
  } catch (error) {
    console.error('Error in GET /api/payment-config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST/PUT - Create or update payment configuration
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
        error: 'Premium subscription required to set up payments' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { paypalEmail, paypalUsername, paypalClientId, paypalSecret, isActive } = body;

    // Validation
    if (!paypalEmail) {
      return NextResponse.json({ 
        error: 'PayPal email is required' 
      }, { status: 400 });
    }

    // Check if config exists
    const { data: existingConfig } = await supabaseAdmin
      .from('payment_configs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let config;

    if (existingConfig) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('payment_configs')
      .update({
        paypal_email: paypalEmail,
        paypal_username: paypalUsername || null,
        paypal_client_id: paypalClientId || null,
        paypal_secret: paypalSecret || null,
        is_active: isActive !== undefined ? isActive : true,
        updated_at: new Date().toISOString()
      })
        .eq('user_id', user.id)
        .select('id, paypal_email, paypal_client_id, paypal_secret, is_active, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error updating payment config:', error);
        return NextResponse.json({ error: 'Failed to update payment config' }, { status: 500 });
      }

      config = data;
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('payment_configs')
      .insert({
        user_id: user.id,
        paypal_email: paypalEmail,
        paypal_username: paypalUsername || null,
        paypal_client_id: paypalClientId || null,
        paypal_secret: paypalSecret || null,
        is_active: isActive !== undefined ? isActive : true
      })
        .select('id, paypal_email, paypal_client_id, paypal_secret, is_active, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error creating payment config:', error);
        return NextResponse.json({ error: 'Failed to create payment config' }, { status: 500 });
      }

      config = data;
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'Payment configuration saved successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/payment-config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

