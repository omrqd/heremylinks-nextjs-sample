import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }
    
    // Get user template data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        username,
        name,
        bio,
        profile_image,
        hero_image,
        hero_height,
        hide_profile_picture,
        theme_color,
        background_color,
        template,
        background_image,
        background_video,
        card_background_color,
        card_background_image,
        card_background_video,
        username_color,
        bio_color,
        custom_text_color
      `)
      .eq('username', username)
      .eq('is_published', true)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    // Return template data
    return NextResponse.json({
      username: userData.username,
      name: userData.name || username,
      bio: userData.bio || '',
      profileImage: userData.profile_image || '',
      heroImage: userData.hero_image || '',
      heroHeight: userData.hero_height || 300,
      hideProfilePicture: userData.hide_profile_picture || false,
      template: userData.template || 'template3',
      themeColor: userData.theme_color || '#667eea',
      backgroundColor: userData.background_color || '#ffffff',
      backgroundImage: userData.background_image || '',
      backgroundVideo: userData.background_video || '',
      cardBackgroundColor: userData.card_background_color || '#ffffff',
      cardBackgroundImage: userData.card_background_image || '',
      cardBackgroundVideo: userData.card_background_video || '',
      usernameColor: userData.username_color || '#1a1a1a',
      bioColor: userData.bio_color || '#6b7280',
      customTextColor: userData.custom_text_color || '#4b5563',
    });
  } catch (error) {
    console.error('Template preview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

