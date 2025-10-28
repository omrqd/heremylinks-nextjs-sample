import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface BioLink extends RowDataPacket {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  image: string | null;
  layout: string | null;
  background_color: string | null;
  text_color: string | null;
  is_transparent: boolean;
  order: number;
  is_visible: boolean;
}

interface User extends RowDataPacket {
  id: string;
}

// GET - Fetch all bio links for the authenticated user
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

    // Fetch links
    const [links] = await db.query<BioLink[]>(
      `SELECT id, title, url, icon, image, layout, background_color, text_color, is_transparent, \`order\`, is_visible 
       FROM bio_links 
       WHERE user_id = ? AND is_visible = TRUE 
       ORDER BY \`order\` ASC`,
      [user.id]
    );

    return NextResponse.json({
      links: links.map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        icon: link.icon,
        image: link.image,
        layout: link.layout,
        backgroundColor: link.background_color,
        textColor: link.text_color,
        isTransparent: link.is_transparent,
        order: link.order,
      })),
    });
  } catch (error) {
    console.error('Links fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch links' },
      { status: 500 }
    );
  }
}

// POST - Create a new bio link
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, url, icon, image, layout, order } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      );
    }

    const linkId = uuidv4();

    await db.query(
      `INSERT INTO bio_links (id, user_id, title, url, icon, image, layout, \`order\`) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        linkId,
        user.id,
        title,
        url,
        icon || null,
        image || null,
        layout || 'simple',
        order || 0,
      ]
    );

    return NextResponse.json({
      link: {
        id: linkId,
        title,
        url,
        icon,
        image,
        layout: layout || 'simple',
        order: order || 0,
      },
    });
  } catch (error) {
    console.error('Link creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a bio link
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');

    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID is required' },
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

    // Delete link (ensure it belongs to the user)
    await db.query('DELETE FROM bio_links WHERE id = ? AND user_id = ?', [
      linkId,
      user.id,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Link deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete link' },
      { status: 500 }
    );
  }
}

// PATCH - Update a bio link
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, backgroundColor, textColor, isTransparent } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Link ID is required' },
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

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (backgroundColor !== undefined) {
      updates.push('background_color = ?');
      values.push(backgroundColor);
    }
    if (textColor !== undefined) {
      updates.push('text_color = ?');
      values.push(textColor);
    }
    if (isTransparent !== undefined) {
      updates.push('is_transparent = ?');
      values.push(isTransparent);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true });
    }

    values.push(id, user.id);

    // Update link (ensure it belongs to the user)
    await db.query(
      `UPDATE bio_links SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Link update error:', error);
    return NextResponse.json(
      { error: 'Failed to update link' },
      { status: 500 }
    );
  }
}
