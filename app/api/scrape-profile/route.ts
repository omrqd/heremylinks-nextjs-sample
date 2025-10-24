import { NextRequest, NextResponse } from 'next/server';

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  profileImage: string;
  platform: 'instagram' | 'facebook' | 'tiktok';
  success: boolean;
  error?: string;
}

// Instagram scraper
async function scrapeInstagram(username: string): Promise<ProfileData> {
  try {
    const url = `https://www.instagram.com/${username}/`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`Instagram returned status ${response.status}`);
    }

    const html = await response.text();
    
    // Extract JSON data from Instagram's page
    const jsonMatch = html.match(/<script type="application\/ld\+json">({.*?})<\/script>/);
    
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[1]);
      
      return {
        username: username,
        displayName: jsonData.name || `@${username}`,
        bio: jsonData.description || 'No bio available',
        profileImage: jsonData.image || '',
        platform: 'instagram',
        success: true
      };
    }

    // Fallback: Try to extract from meta tags
    const nameMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

    // Try to get data from shared data script
    const sharedDataMatch = html.match(/window\._sharedData = ({.*?});<\/script>/);
    let profilePicUrl = '';
    let fullName = '';
    let biography = '';

    if (sharedDataMatch) {
      try {
        const sharedData = JSON.parse(sharedDataMatch[1]);
        const userData = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
        if (userData) {
          profilePicUrl = userData.profile_pic_url_hd || userData.profile_pic_url || '';
          fullName = userData.full_name || '';
          biography = userData.biography || '';
        }
      } catch (e) {
        console.error('Error parsing shared data:', e);
      }
    }

    return {
      username: username,
      displayName: fullName || nameMatch?.[1]?.split('•')?.[0]?.trim() || `@${username}`,
      bio: biography || descMatch?.[1] || 'No bio available',
      profileImage: profilePicUrl || imageMatch?.[1] || '',
      platform: 'instagram',
      success: true
    };

  } catch (error) {
    console.error('Instagram scraping error:', error);
    return {
      username: username,
      displayName: `@${username}`,
      bio: 'Unable to fetch bio',
      profileImage: '',
      platform: 'instagram',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Facebook scraper
async function scrapeFacebook(username: string): Promise<ProfileData> {
  try {
    const url = `https://www.facebook.com/${username}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });

    if (!response.ok) {
      throw new Error(`Facebook returned status ${response.status}`);
    }

    const html = await response.text();
    
    // Extract from meta tags
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

    const displayName = titleMatch?.[1] || `@${username}`;
    const bio = descMatch?.[1] || 'No bio available';
    const profileImage = imageMatch?.[1] || '';

    return {
      username: username,
      displayName: displayName,
      bio: bio,
      profileImage: profileImage,
      platform: 'facebook',
      success: true
    };

  } catch (error) {
    console.error('Facebook scraping error:', error);
    return {
      username: username,
      displayName: `@${username}`,
      bio: 'Unable to fetch bio',
      profileImage: '',
      platform: 'facebook',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// TikTok scraper
async function scrapeTikTok(username: string): Promise<ProfileData> {
  try {
    const url = `https://www.tiktok.com/@${username}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });

    if (!response.ok) {
      throw new Error(`TikTok returned status ${response.status}`);
    }

    const html = await response.text();
    
    // Extract from meta tags
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

    // Try to extract from structured data
    const jsonMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">({.*?})<\/script>/);
    
    let displayName = `@${username}`;
    let bio = 'No bio available';
    let profileImage = '';

    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        const userDetail = jsonData?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user;
        if (userDetail) {
          displayName = userDetail.nickname || userDetail.uniqueId || displayName;
          bio = userDetail.signature || bio;
          profileImage = userDetail.avatarLarger || userDetail.avatarMedium || userDetail.avatarThumb || '';
        }
      } catch (e) {
        console.error('Error parsing TikTok JSON:', e);
      }
    }

    // Fallback to meta tags
    if (!profileImage && imageMatch) {
      profileImage = imageMatch[1];
    }
    if (bio === 'No bio available' && descMatch) {
      bio = descMatch[1];
    }
    if (displayName === `@${username}` && titleMatch) {
      displayName = titleMatch[1].split('|')[0].trim();
    }

    return {
      username: username,
      displayName: displayName,
      bio: bio,
      profileImage: profileImage,
      platform: 'tiktok',
      success: true
    };

  } catch (error) {
    console.error('TikTok scraping error:', error);
    return {
      username: username,
      displayName: `@${username}`,
      bio: 'Unable to fetch bio',
      profileImage: '',
      platform: 'tiktok',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { platform, username } = await request.json();

    if (!platform || !username) {
      return NextResponse.json(
        { 
          error: 'Platform and username are required',
          success: false 
        },
        { status: 400 }
      );
    }

    console.log(`Scraping ${platform} profile for username: ${username}`);

    let profileData: ProfileData;

    switch (platform.toLowerCase()) {
      case 'instagram':
        profileData = await scrapeInstagram(username);
        break;
      case 'facebook':
        profileData = await scrapeFacebook(username);
        break;
      case 'tiktok':
        profileData = await scrapeTikTok(username);
        break;
      default:
        return NextResponse.json(
          { 
            error: 'Unsupported platform. Use: instagram, facebook, or tiktok',
            success: false 
          },
          { status: 400 }
        );
    }

    console.log(`Successfully scraped ${platform} profile:`, {
      username: profileData.username,
      displayName: profileData.displayName,
      hasImage: !!profileData.profileImage,
      success: profileData.success
    });

    return NextResponse.json(profileData);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to scrape profile data', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

