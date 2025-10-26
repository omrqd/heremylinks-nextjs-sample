import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface User extends RowDataPacket {
  id: string;
  username: string;
  email: string;
  name: string | null;
  bio: string | null;
  profile_image: string | null;
  theme_color: string | null;
  background_color: string | null;
  template: string | null;
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
      `SELECT id, username, email, name, bio, profile_image, theme_color, background_color, template, is_published 
       FROM users WHERE email = ? LIMIT 1`,
      [session.user.email]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        bio: user.bio,
        profileImage: user.profile_image,
        themeColor: user.theme_color,
        backgroundColor: user.background_color,
        template: user.template || 'default',
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
      themeColor,
      backgroundColor,
      template,
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
