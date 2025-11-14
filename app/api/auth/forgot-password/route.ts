import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [users]: any = await db.query(
      'SELECT id, email, username FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal that the user doesn't exist (security best practice)
      // But still return success to prevent email enumeration
      return NextResponse.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    }

    const user = users[0];

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Delete any existing tokens for this user (allow only one active token)
    await db.query(
      'DELETE FROM password_reset_tokens WHERE user_id = ?',
      [user.id]
    );

    // Store the new reset token in database
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used) VALUES (?, ?, ?, ?)',
      [user.id, resetTokenHash, expiresAt, false]
    );

    // Create reset link
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email
    try {
      await resend.emails.send({
        from: 'HereMyLinks <no-reply@heremylinks.com>',
        to: email,
        subject: 'Reset Your Password - HereMyLinks',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 28px; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                a.button { color: white !important; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Reset Your Password</h1>
                </div>
                <div class="content">
                  <p>Hi there,</p>
                  <p>We received a request to reset your password for your HereMyLinks account (<strong>${email}</strong>).</p>
                  <p>Click the button below to reset your password:</p>
                  <div style="text-align: center;">
                    <a href="${resetLink}" class="button" style="color: white !important; text-decoration: none;">Reset Password</a>
                  </div>
                  <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                  <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 13px;">${resetLink}</p>
                  
                  <div class="warning">
                    <strong>⚠️ Important:</strong>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                      <li>This link will expire in <strong>1 hour</strong></li>
                      <li>This link can only be used <strong>once</strong></li>
                      <li>If you didn't request this, you can safely ignore this email</li>
                    </ul>
                  </div>
                  
                  <p>Need help? Contact us at support@heremylinks.com</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} HereMyLinks. All rights reserved.</p>
                  <p>This is an automated email. Please do not reply.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Password reset link sent successfully!' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

