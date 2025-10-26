import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateVerificationCode, getVerificationCodeExpiry } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, name } = body;

    // Validation
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Check if username is taken
    const [existingUsername] = await db.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (Array.isArray(existingUsername) && existingUsername.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = getVerificationCodeExpiry();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    
    await db.query(
      `INSERT INTO users (id, email, password, username, name, verification_code, verification_code_expires, is_verified, provider) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, hashedPassword, username, name, verificationCode, verificationCodeExpires, false, 'credentials']
    );
    
    // Send verification email
    try {
      await fetch(`${request.nextUrl.origin}/api/email/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: name || username }),
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Continue with registration even if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      needsVerification: true,
      user: {
        id: userId,
        email,
        username,
        name: name || username,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
