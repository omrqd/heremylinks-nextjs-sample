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
    
    // Get total unique visitors (by IP)
    const { data: uniqueVisitorsData, error: uniqueError } = await supabase
      .from('link_analytics')
      .select('visitor_ip')
      .eq('user_id', userId);
    
    const uniqueVisitors = uniqueVisitorsData 
      ? new Set(uniqueVisitorsData.map(v => v.visitor_ip)).size 
      : 0;
    
    // Get total clicks
    const { count: totalClicks, error: clicksError } = await supabase
      .from('link_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Get clicks today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: clicksToday, error: todayError } = await supabase
      .from('link_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('clicked_at', today.toISOString());
    
    // Get all user links with their click counts
    const { data: linksData, error: linksError } = await supabase
      .from('bio_links')
      .select(`
        id,
        title,
        url,
        click_count,
        created_at
      `)
      .eq('user_id', userId)
      .order('click_count', { ascending: false });
    
    if (linksError) {
      console.error('Error fetching links:', linksError);
    }
    
    // Get analytics count per link
    const linksWithAnalytics = await Promise.all(
      (linksData || []).map(async (link) => {
        // Get unique visitors for this link
        const { data: linkVisitors } = await supabase
          .from('link_analytics')
          .select('visitor_ip')
          .eq('link_id', link.id);
        
        const uniqueVisitorsCount = linkVisitors 
          ? new Set(linkVisitors.map(v => v.visitor_ip)).size 
          : 0;
        
        // Get total clicks from analytics
        const { count: analyticsClicks } = await supabase
          .from('link_analytics')
          .select('*', { count: 'exact', head: true })
          .eq('link_id', link.id);
        
        // Get clicks today
        const { count: clicksTodayCount } = await supabase
          .from('link_analytics')
          .select('*', { count: 'exact', head: true })
          .eq('link_id', link.id)
          .gte('clicked_at', today.toISOString());
        
        return {
          ...link,
          uniqueVisitors: uniqueVisitorsCount,
          totalClicks: analyticsClicks || 0,
          clicksToday: clicksTodayCount || 0,
        };
      })
    );
    
    // Get top countries
    const { data: countryData, error: countryError } = await supabase
      .from('link_analytics')
      .select('visitor_country')
      .eq('user_id', userId)
      .not('visitor_country', 'is', null);
    
    const countryCounts: { [key: string]: number } = {};
    (countryData || []).forEach((record) => {
      const country = record.visitor_country;
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    
    const topCountries = Object.entries(countryCounts)
      .map(([country, clicks]) => ({ country, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
    
    // Get device breakdown
    const { data: deviceData, error: deviceError } = await supabase
      .from('link_analytics')
      .select('device_type')
      .eq('user_id', userId);
    
    const deviceCounts: { [key: string]: number } = {};
    (deviceData || []).forEach((record) => {
      const device = record.device_type || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });
    
    return NextResponse.json({
      totalUniqueVisitors: uniqueVisitors,
      totalClicks: totalClicks || 0,
      clicksToday: clicksToday || 0,
      links: linksWithAnalytics,
      topCountries,
      deviceBreakdown: deviceCounts,
    });
  } catch (error) {
    console.error('Analytics stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics stats' },
      { status: 500 }
    );
  }
}

