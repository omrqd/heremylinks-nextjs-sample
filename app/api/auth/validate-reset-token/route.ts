import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = body;

    if (!token || !email) {
      return NextResponse.json(
        { valid: false, error: 'Token and email are required' },
        { status: 400 }
      );
    }

    // First, verify the user exists and get their ID
    const [users]: any = await db.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'This reset link is invalid, has expired, or has already been used.'
      });
    }

    const userId = users[0].id;

    // Hash the token to compare with database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Check if token exists for this user (don't filter by 'used' in SQL - we'll check it in JS)
    const [tokens]: any = await db.query(
      `SELECT id, user_id, token_hash, expires_at, used 
       FROM password_reset_tokens
       WHERE token_hash = ? AND user_id = ?
       LIMIT 1`,
      [tokenHash, userId]
    );

    if (tokens.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'This reset link is invalid, has expired, or has already been used.'
      });
    }

    const tokenData = tokens[0];

    // Check if token has been used (handle both true and non-false values)
    if (tokenData.used === true) {
      return NextResponse.json({
        valid: false,
        error: 'This reset link has already been used. Please request a new one.'
      });
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return NextResponse.json({
        valid: false,
        error: 'This reset link has expired. Please request a new one.'
      });
    }

    return NextResponse.json({ valid: true });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}

