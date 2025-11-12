import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get featured templates for premium users
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is premium
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, is_premium, premium_plan_type')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.is_premium) {
      return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    // Get featured creators with their complete design profiles
    const { data: featuredCreators, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        username,
        name,
        email,
        profile_image,
        template,
        theme_color,
        background_color,
        background_image,
        background_video,
        card_background_color,
        bio,
        featured_creator_since,
        created_at
      `)
      .eq('is_featured_creator', true)
      .eq('is_published', true)
      .order('featured_creator_since', { ascending: false });

    if (error) {
      console.error('Error fetching featured templates:', error);
      return NextResponse.json({ error: 'Failed to fetch featured templates' }, { status: 500 });
    }

    // Fetch links for each featured creator
    const templatesWithLinks = await Promise.all(
      (featuredCreators || []).map(async (creator) => {
        const { data: links } = await supabaseAdmin
          .from('links')
          .select('id, title, url, icon, position, is_active')
          .eq('user_id', creator.id)
          .eq('is_active', true)
          .order('position', { ascending: true });

        return {
          id: creator.id,
          creatorName: creator.name || creator.username,
          creatorUsername: creator.username,
          creatorImage: creator.profile_image,
          creatorBio: creator.bio,
          template: creator.template,
          themeColor: creator.theme_color,
          backgroundColor: creator.background_color,
          backgroundImage: creator.background_image,
          backgroundVideo: creator.background_video,
          cardBackgroundColor: creator.card_background_color,
          featuredSince: creator.featured_creator_since,
          previewUrl: `/${creator.username}`,
          links: links || []
        };
      })
    );

    const templates = templatesWithLinks;

    return NextResponse.json({
      success: true,
      templates: templates || [],
      count: templates?.length || 0
    });
  } catch (error) {
    console.error('Error fetching featured templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

