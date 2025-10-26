import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

interface User extends RowDataPacket {
  id: string;
}

interface SocialLinkRow extends RowDataPacket {
  id: string;
  user_id: string;
  platform: string;
  url: string;
  icon: string;
  created_at: Date;
}

// GET - Fetch all social links for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from email
    const [userRows] = await db.query<User[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [session.user.email]
    );

    const user = userRows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    // Fetch social links for the user
    const [socialRows] = await db.query<SocialLinkRow[]>(
      'SELECT id, user_id, platform, url, icon, created_at FROM social_links WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );

    const socials = socialRows.map(social => ({
      id: social.id,
      platform: social.platform,
      url: social.url,
      icon: social.icon,
    }));

    return NextResponse.json({ socials });
  } catch (error) {
    console.error('Error fetching social links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social links' },
      { status: 500 }
    );
  }
}

// POST - Create a new social link
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, url, icon } = body;

    if (!platform || !url || !icon) {
      return NextResponse.json(
        { error: 'Platform, URL, and icon are required' },
        { status: 400 }
      );
    }

    // Get user ID from email
    const [userRows] = await db.query<User[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [session.user.email]
    );

    const user = userRows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;
    const socialId = uuidv4();

    // Insert social link into the database
    await db.query(
      `INSERT INTO social_links (id, user_id, platform, url, icon, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [socialId, userId, platform, url, icon]
    );

    const social = {
      id: socialId,
      platform,
      url,
      icon,
    };

    return NextResponse.json({ social }, { status: 201 });
  } catch (error) {
    console.error('Error creating social link:', error);
    return NextResponse.json(
      { error: 'Failed to create social link' },
      { status: 500 }
    );
  }
}

