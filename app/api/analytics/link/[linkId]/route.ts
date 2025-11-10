import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const linkId = params.linkId;
    
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
    
    // Verify link belongs to user
    const { data: linkData, error: linkError } = await supabase
      .from('bio_links')
      .select('id, title, url, user_id')
      .eq('id', linkId)
      .single();
    
    if (linkError || !linkData) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    
    if (linkData.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get all analytics for this link
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('link_analytics')
      .select('*')
      .eq('link_id', linkId)
      .order('clicked_at', { ascending: false });
    
    if (analyticsError) {
      console.error('Analytics fetch error:', analyticsError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
    
    // Calculate unique visitors
    const uniqueVisitors = analyticsData 
      ? new Set(analyticsData.map(a => a.visitor_ip)).size 
      : 0;
    
    // Get country breakdown
    const countryBreakdown: { [key: string]: { clicks: number; uniqueVisitors: Set<string> } } = {};
    
    analyticsData?.forEach((record) => {
      const country = record.visitor_country || 'Unknown';
      if (!countryBreakdown[country]) {
        countryBreakdown[country] = { clicks: 0, uniqueVisitors: new Set() };
      }
      countryBreakdown[country].clicks += 1;
      countryBreakdown[country].uniqueVisitors.add(record.visitor_ip);
    });
    
    const countries = Object.entries(countryBreakdown)
      .map(([country, data]) => ({
        country,
        clicks: data.clicks,
        uniqueVisitors: data.uniqueVisitors.size,
      }))
      .sort((a, b) => b.clicks - a.clicks);
    
    // Get device breakdown
    const deviceBreakdown: { [key: string]: number } = {};
    analyticsData?.forEach((record) => {
      const device = record.device_type || 'unknown';
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    });
    
    // Get browser breakdown
    const browserBreakdown: { [key: string]: number } = {};
    analyticsData?.forEach((record) => {
      const browser = record.browser || 'Unknown';
      browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
    });
    
    // Get OS breakdown
    const osBreakdown: { [key: string]: number } = {};
    analyticsData?.forEach((record) => {
      const os = record.os || 'Unknown';
      osBreakdown[os] = (osBreakdown[os] || 0) + 1;
    });
    
    // Get referrer breakdown
    const referrerBreakdown: { [key: string]: number } = {};
    analyticsData?.forEach((record) => {
      if (record.referrer) {
        try {
          const url = new URL(record.referrer);
          const domain = url.hostname;
          referrerBreakdown[domain] = (referrerBreakdown[domain] || 0) + 1;
        } catch {
          referrerBreakdown['Direct'] = (referrerBreakdown['Direct'] || 0) + 1;
        }
      } else {
        referrerBreakdown['Direct'] = (referrerBreakdown['Direct'] || 0) + 1;
      }
    });
    
    // Get clicks over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const clicksByDay: { [key: string]: number } = {};
    analyticsData?.forEach((record) => {
      const date = new Date(record.clicked_at);
      if (date >= thirtyDaysAgo) {
        const dateKey = date.toISOString().split('T')[0];
        clicksByDay[dateKey] = (clicksByDay[dateKey] || 0) + 1;
      }
    });
    
    // Fill in missing days with 0
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      chartData.push({
        date: dateKey,
        clicks: clicksByDay[dateKey] || 0,
      });
    }
    
    // Get recent clicks (last 50)
    const recentClicks = analyticsData?.slice(0, 50).map(record => ({
      country: record.visitor_country || 'Unknown',
      city: record.visitor_city || 'Unknown',
      device: record.device_type || 'unknown',
      browser: record.browser || 'Unknown',
      os: record.os || 'Unknown',
      timestamp: record.clicked_at,
    })) || [];
    
    return NextResponse.json({
      link: {
        id: linkData.id,
        title: linkData.title,
        url: linkData.url,
      },
      totalClicks: analyticsData?.length || 0,
      uniqueVisitors,
      countries,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      referrerBreakdown,
      clicksOverTime: chartData,
      recentClicks,
    });
  } catch (error) {
    console.error('Link analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch link analytics' },
      { status: 500 }
    );
  }
}

