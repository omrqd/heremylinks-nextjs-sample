import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface ActivityLog {
  id: string;
  type: string;
  user: {
    email: string;
    name: string;
  };
  timestamp: string;
  description: string;
}

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

    // Get recent user signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentSignups, error: signupsError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, created_at, is_premium')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    // Get recent premium subscriptions
    const { data: recentPremium, error: premiumError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, premium_started_at')
      .eq('is_premium', true)
      .not('premium_started_at', 'is', null)
      .gte('premium_started_at', thirtyDaysAgo.toISOString())
      .order('premium_started_at', { ascending: false })
      .limit(20);

    // Get recent cancellations (users who were premium but cancelled)
    const { data: recentCancellations, error: cancelError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, premium_expires_at, stripe_subscription_id')
      .eq('is_premium', false)
      .not('premium_expires_at', 'is', null)
      .gte('premium_expires_at', thirtyDaysAgo.toISOString())
      .is('stripe_subscription_id', null) // No active subscription
      .order('premium_expires_at', { ascending: false })
      .limit(20);

    if (signupsError || premiumError || cancelError) {
      console.error('Database error:', { signupsError, premiumError, cancelError });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Combine and format activity logs
    const activityLogs: ActivityLog[] = [];

    // Add signups
    if (recentSignups) {
      recentSignups.forEach(user => {
        activityLogs.push({
          id: `signup-${user.id}`,
          type: 'signup',
          user: {
            email: user.email,
            name: user.name || 'Unknown',
          },
          timestamp: user.created_at,
          description: `New user signed up`,
        });
      });
    }

    // Add premium subscriptions
    if (recentPremium) {
      recentPremium.forEach(user => {
        activityLogs.push({
          id: `premium-${user.id}`,
          type: 'premium',
          user: {
            email: user.email,
            name: user.name || 'Unknown',
          },
          timestamp: user.premium_started_at,
          description: `Subscribed to premium`,
        });
      });
    }

    // Add cancellations
    if (recentCancellations) {
      recentCancellations.forEach(user => {
        activityLogs.push({
          id: `cancel-${user.id}`,
          type: 'cancel',
          user: {
            email: user.email,
            name: user.name || 'Unknown',
          },
          timestamp: user.premium_expires_at,
          description: `Cancelled premium subscription`,
        });
      });
    }

    // Sort by timestamp (most recent first)
    activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      activity: activityLogs.slice(0, 15), // Return top 15 activities
    });
  } catch (error) {
    console.error('Error fetching admin activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

