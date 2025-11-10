import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to get IP address from request
function getClientIp(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return 'unknown';
}

// Helper function to parse user agent
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let deviceType = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      userAgent
    )
  ) {
    deviceType = 'mobile';
  }
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';
  
  return { deviceType, browser, os };
}

// Helper function to get geolocation data from IP
async function getGeolocation(ip: string) {
  console.log('🌍 Geolocation request for IP:', ip);
  
  // For localhost/development, use a test IP to get real geolocation data
  let testIp = ip;
  if (ip === 'unknown' || ip === '::1' || ip.startsWith('127.') || ip === 'localhost') {
    console.log('⚠️ Localhost detected - using test IP for development');
    // Use a public IP for testing (Google's DNS server)
    testIp = '8.8.8.8'; // This will show as United States
    
    // Uncomment one of these to test different locations:
    // testIp = '1.1.1.1'; // Australia
    // testIp = '185.244.214.0'; // United Kingdom
    // testIp = '103.28.248.0'; // Japan
  }
  
  try {
    // Try ip-api.com first (free tier: 45 requests/minute)
    console.log('📍 Fetching geolocation for:', testIp);
    const response = await fetch(`http://ip-api.com/json/${testIp}?fields=status,country,city,regionName,message`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      console.error('❌ Geolocation API error:', response.status, response.statusText);
      return { country: null, city: null, region: null };
    }
    
    const data = await response.json();
    console.log('✅ Geolocation response:', data);
    
    if (data.status === 'success') {
      return {
        country: data.country || null,
        city: data.city || null,
        region: data.regionName || null,
      };
    } else {
      console.error('❌ Geolocation failed:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Geolocation fetch error:', error);
    
    // Try fallback service (ipapi.co)
    try {
      console.log('🔄 Trying fallback geolocation service...');
      const fallbackResponse = await fetch(`https://ipapi.co/${testIp}/json/`);
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log('✅ Fallback geolocation response:', fallbackData);
        
        if (!fallbackData.error) {
          return {
            country: fallbackData.country_name || null,
            city: fallbackData.city || null,
            region: fallbackData.region || null,
          };
        }
      }
    } catch (fallbackError) {
      console.error('❌ Fallback geolocation also failed:', fallbackError);
    }
  }
  
  console.log('⚠️ Returning null geolocation data');
  return { country: null, city: null, region: null };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkId } = body;
    
    if (!linkId) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
    }
    
    // Get link details and user_id
    const { data: linkData, error: linkError } = await supabase
      .from('bio_links')
      .select('id, user_id, click_count')
      .eq('id', linkId)
      .single();
    
    if (linkError || !linkData) {
      console.error('Link not found:', linkError);
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    
    // Get visitor information
    const visitorIp = getClientIp(request);
    console.log('👤 Visitor IP detected:', visitorIp);
    
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || null;
    
    // Parse user agent
    const { deviceType, browser, os } = parseUserAgent(userAgent);
    console.log('📱 Device info:', { deviceType, browser, os });
    
    // Get geolocation (async, but we don't want to block the response)
    const geolocation = await getGeolocation(visitorIp);
    console.log('🗺️ Final geolocation:', geolocation);
    
    // Insert analytics record
    const { error: insertError } = await supabase
      .from('link_analytics')
      .insert({
        link_id: linkData.id,
        user_id: linkData.user_id,
        visitor_ip: visitorIp,
        visitor_country: geolocation.country,
        visitor_city: geolocation.city,
        visitor_region: geolocation.region,
        user_agent: userAgent,
        device_type: deviceType,
        browser: browser,
        os: os,
        referrer: referrer,
      });
    
    if (insertError) {
      console.error('Failed to insert analytics:', insertError);
      // Don't return error to client - tracking is optional
    }
    
    // Update click count on the link (increment)
    const { error: updateError } = await supabase
      .from('bio_links')
      .update({ click_count: linkData.click_count + 1 })
      .eq('id', linkId);
    
    if (updateError) {
      console.error('Failed to update click count:', updateError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Click tracking error:', error);
    // Return success anyway - don't break the user experience
    return NextResponse.json({ success: true });
  }
}

