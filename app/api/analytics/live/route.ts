import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = userData.id;
    
    // Get page visitors in the last 60 seconds (based on last_seen heartbeat)
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setSeconds(oneMinuteAgo.getSeconds() - 60);
    
    console.log('🔴 Live visitors query - Time threshold:', oneMinuteAgo.toISOString());
    
    const { data: recentVisitors, error: visitorsError } = await supabase
      .from('page_views')
      .select('visitor_ip, session_id, last_seen, visitor_country, visitor_city')
      .eq('user_id', userId)
      .gte('last_seen', oneMinuteAgo.toISOString());
    
    console.log('🔴 Live page visitors found:', recentVisitors?.length || 0);
    
    if (visitorsError) {
      console.error('Live visitors error:', visitorsError);
      return NextResponse.json({ error: 'Failed to fetch live visitors' }, { status: 500 });
    }
    
    // Count unique IP addresses (same person from same IP = 1 visitor, regardless of tabs/browsers)
    const uniqueIPs = new Set(recentVisitors?.map(v => v.visitor_ip) || []);
    const totalLiveVisitors = uniqueIPs.size;
    
    console.log('🔴 Total sessions found:', recentVisitors?.length || 0);
    console.log('🔴 Unique IPs found:', Array.from(uniqueIPs));
    console.log('🔴 Total live visitors (unique IPs):', totalLiveVisitors);
    
    // Deduplicate visitor details by IP (show each unique IP only once)
    const uniqueVisitors = new Map();
    recentVisitors?.forEach(v => {
      if (!uniqueVisitors.has(v.visitor_ip)) {
        uniqueVisitors.set(v.visitor_ip, {
          ip: v.visitor_ip,
          country: v.visitor_country || 'Unknown',
          city: v.visitor_city || 'Unknown',
          lastSeen: v.last_seen,
        });
      } else {
        // Keep the most recent last_seen time for this IP
        const existing = uniqueVisitors.get(v.visitor_ip);
        if (new Date(v.last_seen) > new Date(existing.lastSeen)) {
          existing.lastSeen = v.last_seen;
        }
      }
    });
    
    const visitorDetails = Array.from(uniqueVisitors.values());
    
    console.log('🔴 Unique visitor details:', visitorDetails);
    
    return NextResponse.json({
      totalLiveVisitors,
      visitorDetails,
      timestamp: new Date().toISOString(),
      timeWindow: '60 seconds',
    });
  } catch (error) {
    console.error('Live visitors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live visitors' },
      { status: 500 }
    );
  }
}

