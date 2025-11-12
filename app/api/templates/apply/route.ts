import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { sourceUsername, sourceUserId } = body;
    
    if (!sourceUsername && !sourceUserId) {
      return NextResponse.json({ error: 'Source username or user ID required' }, { status: 400 });
    }
    
    console.log('📋 [Template Apply] User:', session.user.email, 'Source:', sourceUserId || sourceUsername);
    
    // Get current user
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('id, username, profile_image')
      .eq('email', session.user.email)
      .single();
    
    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get source template user (by ID or username)
    let sourceQuery = supabase
      .from('users')
      .select(`
        template,
        theme_color,
        background_color,
        background_image,
        background_video,
        card_background_color,
        card_background_image,
        card_background_video,
        username_color,
        bio_color,
        custom_text_color,
        hero_image,
        hero_height,
        hide_profile_picture
      `)
      .eq('is_published', true);
    
    if (sourceUserId) {
      sourceQuery = sourceQuery.eq('id', sourceUserId);
    } else {
      sourceQuery = sourceQuery.eq('username', sourceUsername);
    }
    
    const { data: sourceUser, error: sourceError } = await sourceQuery.single();
    
    if (sourceError || !sourceUser) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    console.log('✨ [Template Apply] Applying design settings...');
    
    // Apply design settings (excluding profile_image, name, bio, links, etc.)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        template: sourceUser.template,
        theme_color: sourceUser.theme_color,
        background_color: sourceUser.background_color,
        background_image: sourceUser.background_image,
        background_video: sourceUser.background_video,
        card_background_color: sourceUser.card_background_color,
        card_background_image: sourceUser.card_background_image,
        card_background_video: sourceUser.card_background_video,
        username_color: sourceUser.username_color,
        bio_color: sourceUser.bio_color,
        custom_text_color: sourceUser.custom_text_color,
        hero_image: sourceUser.hero_image,
        hero_height: sourceUser.hero_height,
        hide_profile_picture: sourceUser.hide_profile_picture,
        // NOTE: We do NOT copy:
        // - profile_image (keep user's own)
        // - name
        // - bio
        // - username
        // - links
        // - any other personal content
      })
      .eq('id', currentUser.id);
    
    if (updateError) {
      console.error('❌ [Template Apply] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to apply design' }, { status: 500 });
    }
    
    console.log('✅ [Template Apply] Design applied successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Design applied successfully',
    });
  } catch (error) {
    console.error('❌ [Template Apply] Error:', error);
    return NextResponse.json(
      { error: 'Failed to apply design' },
      { status: 500 }
    );
  }
}

