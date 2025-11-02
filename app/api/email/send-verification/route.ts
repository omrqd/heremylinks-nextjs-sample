import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import db from '@/lib/db';
import { generateVerificationCode, getVerificationCodeExpiry } from '@/lib/utils';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

export async function POST(request: Request) {
  try {
    const { email, username } = await request.json();
    
    console.log('📧 Sending verification email to:', email);
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not configured in environment variables');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiryDate = getVerificationCodeExpiry();
    
    console.log('🔑 Generated verification code:', verificationCode);
    
    // Store verification code in database
    await db.query(
      `UPDATE users SET 
       verification_code = ?, 
       verification_code_expires = ?, 
       is_verified = FALSE 
       WHERE email = ?`,
      [verificationCode, expiryDate, email]
    );
    
    // Send email with verification code using HTML directly instead of React component
    console.log('📤 Attempting to send email via Resend...');
    console.log('   From:', fromEmail);
    console.log('   To:', email);
    
    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Verify your HereMyLinks account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://heremylinks.com/_next/image?url=%2Fimgs%2Flogo.png&w=640&q=75" alt="HereMyLinks Logo" style="max-width: 200px; height: auto;" />
          </div>
          
          <h1 style="color: #333; font-size: 24px; margin-bottom: 16px; text-align: center;">
            Verify Your Email Address
          </h1>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Hi ${username || 'User'},
          </p>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Thanks for signing up for HereMyLinks! Please use the verification code below to complete your registration:
          </p>
          
          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin-bottom: 24px;">
            ${verificationCode}
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            This code will expire in 10 minutes. If you didn't request this verification, you can safely ignore this email.
          </p>
          
          <div style="border-top: 1px solid #ddd; padding-top: 16px; margin-top: 32px; font-size: 14px; color: #666; text-align: center;">
            <p>© ${new Date().getFullYear()} HereMyLinks. All rights reserved.</p>
          </div>
        </div>
      `
    });

    console.log('✅ Email sent successfully via Resend');
    console.log('   Email ID:', data.id);
    console.log('   Status:', data);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Error sending verification email:', error);
    console.error('   Error message:', error.message);
    console.error('   Error details:', error);
    return NextResponse.json({ 
      error: 'Failed to send verification email',
      details: error.message 
    }, { status: 500 });
  }
}