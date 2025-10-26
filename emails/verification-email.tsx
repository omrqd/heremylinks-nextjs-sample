import * as React from 'react';

interface EmailTemplateProps {
  verificationCode: string;
  username: string;
}

const VerificationEmailTemplate = ({
  verificationCode,
  username,
}: EmailTemplateProps) => (
  <div style={{ 
    fontFamily: 'Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    color: '#333',
  }}>
    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
      <img 
        src="https://heremylinks.com/imgs/logo.png" 
        alt="HereMyLinks Logo" 
        style={{ maxWidth: '200px', height: 'auto' }} 
      />
    </div>
    
    <h1 style={{ 
      color: '#333',
      fontSize: '24px',
      marginBottom: '16px',
      textAlign: 'center'
    }}>
      Verify Your Email Address
    </h1>
    
    <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '24px' }}>
      Hi {username},
    </p>
    
    <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '24px' }}>
      Thanks for signing up for HereMyLinks! Please use the verification code below to complete your registration:
    </p>
    
    <div style={{
      background: '#f4f4f4',
      padding: '16px',
      borderRadius: '8px',
      textAlign: 'center',
      fontSize: '32px',
      fontWeight: 'bold',
      letterSpacing: '8px',
      marginBottom: '24px',
    }}>
      {verificationCode}
    </div>
    
    <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '24px' }}>
      This code will expire in 10 minutes. If you didn't request this verification, you can safely ignore this email.
    </p>
    
    <div style={{ 
      borderTop: '1px solid #ddd',
      paddingTop: '16px',
      marginTop: '32px',
      fontSize: '14px',
      color: '#666',
      textAlign: 'center'
    }}>
      <p>© {new Date().getFullYear()} HereMyLinks. All rights reserved.</p>
    </div>
  </div>
);

export default VerificationEmailTemplate;