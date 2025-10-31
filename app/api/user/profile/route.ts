import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { deleteUploadedFile } from '@/lib/upload';
import { RowDataPacket } from 'mysql2';

interface User extends RowDataPacket {
  id: string;
  username: string;
  email: string;
  name: string | null;
  bio: string | null;
  profile_image: string | null;
  hero_image: string | null;
  hero_height: number;
  hide_profile_picture: boolean;
  theme_color: string | null;
  background_color: string | null;
  template: string | null;
  background_image: string | null;
  background_video: string | null;
  card_background_color: string | null;
  card_background_image: string | null;
  card_background_video: string | null;
  custom_text: string | null;
  username_color: string | null;
  bio_color: string | null;
  custom_text_color: string | null;
  is_published: boolean;
}

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [rows] = await db.query<User[]>(
      `SELECT id, username, email, name, bio, profile_image, hero_image, hero_height, hide_profile_picture,
              theme_color, background_color, template, background_image, background_video, 
              card_background_color, card_background_image, card_background_video, custom_text, 
              username_color, bio_color, custom_text_color, is_published 
       FROM users WHERE email = ? LIMIT 1`,
      [session.user.email]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Compute template-aware defaults
    const effectiveTemplate = user.template || 'default';
    const defaultUsernameColor =
      user.username_color || (effectiveTemplate === 'template3' ? '#ffffff' : '#1a1a1a');
    const defaultCustomTextColor =
      user.custom_text_color || (effectiveTemplate === 'template3' ? '#ffffff' : '#4b5563');

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        bio: user.bio,
        profileImage: user.profile_image,
        heroImage: user.hero_image,
        heroHeight: user.hero_height || 300,
        hideProfilePicture: user.hide_profile_picture || false,
        themeColor: user.theme_color,
        backgroundColor: user.background_color,
        template: effectiveTemplate,
        backgroundImage: user.background_image,
        backgroundVideo: user.background_video,
        cardBackgroundColor: user.card_background_color || '#ffffff',
        cardBackgroundImage: user.card_background_image,
        cardBackgroundVideo: user.card_background_video,
        customText: user.custom_text,
        usernameColor: defaultUsernameColor,
        bioColor: user.bio_color || '#6b7280',
        customTextColor: defaultCustomTextColor,
        isPublished: user.is_published,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      bio,
      profileImage,
      heroImage,
      heroHeight,
      hideProfilePicture,
      themeColor,
      backgroundColor,
      template,
      backgroundImage,
      backgroundVideo,
      cardBackgroundColor,
      cardBackgroundImage,
      cardBackgroundVideo,
      customText,
      usernameColor,
      bioColor,
      customTextColor,
      isPublished,
      username,
    } = body;

    // If username is being updated, validate and check availability
    if (username !== undefined) {
      if (username.length < 3) {
        return NextResponse.json(
          { error: 'Username must be at least 3 characters' },
          { status: 400 }
        );
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, dashes, and underscores' },
          { status: 400 }
        );
      }

      // Check if username is already taken by another user
      const [existingUsers] = await db.query<User[]>(
        'SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND email != ? LIMIT 1',
        [username, session.user.email]
      );

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    // Fetch current user to check existing files for deletion
    const [currentRows] = await db.query<User[]>(
      `SELECT id, profile_image, hero_image, background_image, background_video, 
              card_background_image, card_background_video FROM users WHERE email = ? LIMIT 1`,
      [session.user.email]
    );
    const currentUser = currentRows[0];

    // Delete old files when replacing them
    console.log('🔍 Checking for files to delete...');
    console.log('Current user profile_image:', currentUser?.profile_image);
    console.log('New profileImage:', profileImage);
    
    if (profileImage !== undefined && currentUser?.profile_image && profileImage !== currentUser.profile_image) {
      console.log('🗑️  Deleting old profile image:', currentUser.profile_image);
      await deleteUploadedFile(currentUser.profile_image);
    }
    if (heroImage !== undefined && currentUser?.hero_image && heroImage !== currentUser.hero_image) {
      console.log('🗑️  Deleting old hero image:', currentUser.hero_image);
      await deleteUploadedFile(currentUser.hero_image);
    }
    if (backgroundImage !== undefined && currentUser?.background_image && backgroundImage !== currentUser.background_image) {
      console.log('🗑️  Deleting old background image:', currentUser.background_image);
      await deleteUploadedFile(currentUser.background_image);
    }
    if (backgroundVideo !== undefined && currentUser?.background_video && backgroundVideo !== currentUser.background_video) {
      console.log('🗑️  Deleting old background video:', currentUser.background_video);
      await deleteUploadedFile(currentUser.background_video);
    }
    if (cardBackgroundImage !== undefined && currentUser?.card_background_image && cardBackgroundImage !== currentUser.card_background_image) {
      console.log('🗑️  Deleting old card background image:', currentUser.card_background_image);
      await deleteUploadedFile(currentUser.card_background_image);
    }
    if (cardBackgroundVideo !== undefined && currentUser?.card_background_video && cardBackgroundVideo !== currentUser.card_background_video) {
      console.log('🗑️  Deleting old card background video:', currentUser.card_background_video);
      await deleteUploadedFile(currentUser.card_background_video);
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username.toLowerCase());
    }
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (profileImage !== undefined) {
      updates.push('profile_image = ?');
      values.push(profileImage);
    }
    if (heroImage !== undefined) {
      updates.push('hero_image = ?');
      values.push(heroImage);
    }
    if (heroHeight !== undefined) {
      updates.push('hero_height = ?');
      values.push(heroHeight);
    }
    if (hideProfilePicture !== undefined) {
      updates.push('hide_profile_picture = ?');
      values.push(hideProfilePicture);
    }
    if (themeColor !== undefined) {
      updates.push('theme_color = ?');
      values.push(themeColor);
    }
    if (backgroundColor !== undefined) {
      updates.push('background_color = ?');
      values.push(backgroundColor);
    }
    if (template !== undefined) {
      updates.push('template = ?');
      values.push(template);
      // When switching to Influencer Hero (template3), set default colors to white
      // unless explicit colors are provided in this PATCH body.
      if (template === 'template3') {
        if (usernameColor === undefined) {
          updates.push('username_color = ?');
          values.push('#ffffff');
        }
        if (customTextColor === undefined) {
          updates.push('custom_text_color = ?');
          values.push('#ffffff');
        }
        // Set a default page background image for fresh users if none exists
        // Only apply if caller did not explicitly set backgroundImage in this PATCH
        if (backgroundImage === undefined) {
          const hasExistingBackground = Boolean(currentUser?.background_image);
          if (!hasExistingBackground) {
            updates.push('background_image = ?');
            values.push('/imgs/blackbg.jpg');
          }
        }
      }
    }
    if (backgroundImage !== undefined) {
      updates.push('background_image = ?');
      values.push(backgroundImage);
      // Clear background video when setting background image
      if (backgroundImage) {
        updates.push('background_video = ?');
        values.push('');
        // Delete the old video file
        if (currentUser?.background_video) {
          await deleteUploadedFile(currentUser.background_video);
        }
      }
    }
    if (backgroundVideo !== undefined) {
      updates.push('background_video = ?');
      values.push(backgroundVideo);
      // Clear background image when setting background video
      if (backgroundVideo) {
        updates.push('background_image = ?');
        values.push('');
        // Delete the old image file
        if (currentUser?.background_image) {
          await deleteUploadedFile(currentUser.background_image);
        }
      }
    }
    if (cardBackgroundColor !== undefined) {
      updates.push('card_background_color = ?');
      values.push(cardBackgroundColor);
    }
    if (cardBackgroundImage !== undefined) {
      updates.push('card_background_image = ?');
      values.push(cardBackgroundImage);
      // Clear card background video when setting card background image
      if (cardBackgroundImage) {
        updates.push('card_background_video = ?');
        values.push('');
        // Delete the old card video file
        if (currentUser?.card_background_video) {
          await deleteUploadedFile(currentUser.card_background_video);
        }
      }
    }
    if (cardBackgroundVideo !== undefined) {
      updates.push('card_background_video = ?');
      values.push(cardBackgroundVideo);
      // Clear card background image when setting card background video
      if (cardBackgroundVideo) {
        updates.push('card_background_image = ?');
        values.push('');
        // Delete the old card image file
        if (currentUser?.card_background_image) {
          await deleteUploadedFile(currentUser.card_background_image);
        }
      }
    }
    if (customText !== undefined) {
      updates.push('custom_text = ?');
      values.push(customText);
    }
    if (usernameColor !== undefined) {
      updates.push('username_color = ?');
      values.push(usernameColor);
    }
    if (bioColor !== undefined) {
      updates.push('bio_color = ?');
      values.push(bioColor);
    }
    if (customTextColor !== undefined) {
      updates.push('custom_text_color = ?');
      values.push(customTextColor);
    }
    if (isPublished !== undefined) {
      updates.push('is_published = ?');
      values.push(isPublished);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add email to values for WHERE clause
    values.push(session.user.email);

    await db.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE email = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
