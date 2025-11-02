import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface User extends RowDataPacket {
  id: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { available: false, error: 'Username must be at least 3 characters' },
        { status: 200 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { available: false, error: 'Username can only contain letters, numbers, dashes, and underscores' },
        { status: 200 }
      );
    }

    // Check if username exists in database (case-insensitive)
    const [rows]: [User[], any] = await db.query<User>(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
      [username]
    );

    const available = rows.length === 0;

    return NextResponse.json({
      available,
      username,
    });
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}

