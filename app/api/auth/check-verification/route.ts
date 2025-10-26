import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists and if they're verified
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, is_verified FROM users WHERE email = ?',
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ exists: false });
    }

    const user = rows[0];
    
    return NextResponse.json({
      exists: true,
      isVerified: user.is_verified === 1
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    return NextResponse.json({ error: 'Failed to check verification status' }, { status: 500 });
  }
}