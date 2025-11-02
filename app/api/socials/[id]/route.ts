import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface User extends RowDataPacket {
  id: string;
}

// DELETE - Remove a social link
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const socialId = params.id;

    if (!socialId) {
      return NextResponse.json({ error: 'Social ID is required' }, { status: 400 });
    }

    // Get user ID from email
    const [userRows]: [User[], any] = await db.query<User>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [session.user.email]
    );

    const user = userRows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    // Delete social link (only if it belongs to the user)
    const [result] = await db.query(
      'DELETE FROM social_links WHERE id = ? AND user_id = ?',
      [socialId, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting social link:', error);
    return NextResponse.json(
      { error: 'Failed to delete social link' },
      { status: 500 }
    );
  }
}

