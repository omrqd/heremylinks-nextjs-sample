import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';

interface User {
  id: string;
}

export async function PATCH(request: NextRequest) {
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
    const { links } = body;

    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { error: 'Invalid links data' },
        { status: 400 }
      );
    }

    // Update order for each link
    const updatePromises = links.map(({ id, order }) =>
      db.query(
        'UPDATE bio_links SET `order` = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
        [order, id, user.id]
      )
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Link reorder error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder links' },
      { status: 500 }
    );
  }
}

