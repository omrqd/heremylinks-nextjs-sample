import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, newPassword } = body;

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // First, verify the user exists and get their ID
    const [users]: any = await db.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'This reset link is invalid, has expired, or has already been used. Please request a new reset link.' },
        { status: 400 }
      );
    }

    const userId = users[0].id;

    // Hash the token to compare with database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Get the token info for this user (don't filter by 'used' in SQL - we'll check it in JS)
    const [tokens]: any = await db.query(
      `SELECT id, user_id, token_hash, expires_at, used 
       FROM password_reset_tokens
       WHERE token_hash = ? AND user_id = ?
       LIMIT 1`,
      [tokenHash, userId]
    );

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: 'This reset link is invalid, has expired, or has already been used. Please request a new reset link.' },
        { status: 400 }
      );
    }

    const tokenRecord = tokens[0];

    // Check if token has been used (handle both true and non-false values)
    if (tokenRecord.used === true) {
      return NextResponse.json(
        { error: 'This reset link has already been used. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(tokenRecord.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    // Mark token as used (one-time use)
    await db.query(
      'UPDATE password_reset_tokens SET used = true WHERE id = ?',
      [tokenRecord.id]
    );

    return NextResponse.json({ 
      message: 'Password reset successfully!' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}

