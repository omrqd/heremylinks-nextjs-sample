import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
    }

    // Get user with matching verification code
    const [users] = await db.query(
      `SELECT * FROM users 
       WHERE email = ? 
       AND verification_code = ? 
       AND verification_code_expires > NOW()`,
      [email, code]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // Mark user as verified
    await db.query(
      `UPDATE users SET 
       is_verified = TRUE, 
       verification_code = NULL, 
       verification_code_expires = NULL 
       WHERE email = ?`,
      [email]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
  }
}