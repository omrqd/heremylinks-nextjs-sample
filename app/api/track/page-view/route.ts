import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to get IP address
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp;
  if (cfConnectingIp) return cfConnectingIp;
  
  return 'unknown';
}

// Parse user agent
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  let deviceType = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    deviceType = 'mobile';
  }
  
  let browser = 'Unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';
  
  return { deviceType, browser, os };
}

// Get geolocation
async function getGeolocation(ip: string) {
  console.log('🌍 [Page View] Geolocation request for IP:', ip);
  
  let testIp = ip;
  if (ip === 'unknown' || ip === '::1' || ip.startsWith('127.') || ip === 'localhost') {
    console.log('⚠️ [Page View] Localhost detected - using test IP');
    testIp = '8.8.8.8';
  }
  
  try {
    const response = await fetch(`http://ip-api.com/json/${testIp}?fields=status,country,city,regionName,message`, {
      next: { revalidate: 3600 }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return {
          country: data.country || null,
          city: data.city || null,
          region: data.regionName || null,
        };
      }
    }
  } catch (error) {
    console.error('❌ [Page View] Geolocation error:', error);
  }
  
  return { country: null, city: null, region: null };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, sessionId } = body;
    
    if (!username || !sessionId) {
      return NextResponse.json({ error: 'Username and sessionId required' }, { status: 400 });
    }
    
    console.log('👁️ [Page View] Tracking view for:', username, 'Session:', sessionId);
    
    // Get user by username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .eq('is_published', true)
      .single();
    
    if (userError || !userData) {
      console.error('❌ [Page View] User not found:', username);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get visitor info
    const visitorIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || null;
    const { deviceType, browser, os } = parseUserAgent(userAgent);
    
    console.log('📍 [Page View] Visitor IP:', visitorIp, 'Device:', deviceType);
    
    // Check if session already exists
    const { data: existingView } = await supabase
      .from('page_views')
      .select('id')
      .eq('user_id', userData.id)
      .eq('session_id', sessionId)
      .single();
    
    if (existingView) {
      // Update last_seen for existing session (heartbeat)
      console.log('💚 [Page View] Updating heartbeat for existing session');
      const { error: updateError } = await supabase
        .from('page_views')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', existingView.id);
      
      if (updateError) {
        console.error('❌ [Page View] Update error:', updateError);
      }
    } else {
      // New session - get geolocation and insert
      console.log('✨ [Page View] New session detected');
      const geolocation = await getGeolocation(visitorIp);
      
      const { error: insertError } = await supabase
        .from('page_views')
        .insert({
          user_id: userData.id,
          visitor_ip: visitorIp,
          session_id: sessionId,
          visitor_country: geolocation.country,
          visitor_city: geolocation.city,
          visitor_region: geolocation.region,
          user_agent: userAgent,
          device_type: deviceType,
          browser: browser,
          os: os,
          referrer: referrer,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        });
      
      if (insertError) {
        console.error('❌ [Page View] Insert error:', insertError);
      } else {
        console.log('✅ [Page View] Session created successfully');
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [Page View] Tracking error:', error);
    return NextResponse.json({ success: true }); // Don't break user experience
  }
}

