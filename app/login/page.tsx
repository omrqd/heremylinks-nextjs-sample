'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './login.module.css';

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [emailUsername, setEmailUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [subtitle, setSubtitle] = useState('Log in to your HereMyLinks');

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailUsername.trim()) {
      setSubtitle('Create your password');
      setStep('password');
    }
  };

  const handleEditEmail = () => {
    setSubtitle('Log in to your HereMyLinks');
    setStep('email');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== repeatPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (password.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    
    console.log('Sign up with:', emailUsername, password);
    alert('Account created successfully! (This is a demo)');
  };

  const handleGoogleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Google login clicked');
    alert('Google login will be implemented here!');
  };

  const handleAppleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Apple login clicked');
    alert('Apple login will be implemented here!');
  };

  return (
    <div className={styles.loginContainer}>
      {/* Left Side - Form */}
      <div className={styles.loginLeft}>
        <div className={styles.loginContent}>
          <Link href="/" className={styles.logoLink}>
            <Image src="/imgs/logo.png" alt="HereMyLinks Logo" width={180} height={45} className={styles.logo} />
          </Link>
          
          <div className={styles.loginFormWrapper}>
            <h1 className={styles.loginTitle}>Welcome back</h1>
            <p className={styles.loginSubtitle}>{subtitle}</p>
            
            <form className={styles.loginForm} onSubmit={step === 'email' ? handleContinue : handleSubmit}>
              {/* Step 1: Email Input */}
              {step === 'email' && (
                <div className={styles.formStep}>
                  <div className={styles.formGroup}>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      placeholder="Email" 
                      value={emailUsername}
                      onChange={(e) => setEmailUsername(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button type="submit" className={styles.btnPrimary}>
                    Continue
                  </button>
                </div>
              )}
              
              {/* Step 2: Password Inputs */}
              {step === 'password' && (
                <div className={`${styles.formStep} ${styles.formStepEnter}`}>
                  <div className={styles.userEmailDisplay}>
                    <span>{emailUsername}</span>
                    <button type="button" className={styles.editEmailBtn} onClick={handleEditEmail}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <input 
                      type="password" 
                      className={styles.formInput} 
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <input 
                      type="password" 
                      className={styles.formInput} 
                      placeholder="Repeat Password" 
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button type="submit" className={styles.btnPrimary}>
                    Sign Up
                  </button>
                </div>
              )}
            </form>
            
            <div className={styles.divider}>
              <span>OR</span>
            </div>
            
            <div className={styles.socialLogin}>
              <button className={styles.btnSocial} onClick={handleGoogleLogin}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              <button className={styles.btnSocial} onClick={handleAppleLogin}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>
            </div>
            
            <div className={styles.loginFooter}>
              <div className={styles.forgotLinks}>
                <a href="#" className={styles.linkPurple}>Forgot password?</a>
                <span className={styles.separator}>•</span>
                <a href="#" className={styles.linkPurple}>Forgot username?</a>
              </div>
              
              <p className={styles.signupText}>
                Don&apos;t have an account? 
                <a href="#" className={styles.linkPurple}> Sign up</a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Image */}
      <div className={styles.loginRight}>
        <Image src="/imgs/login.jpg" alt="HereMyLinks Platform" fill style={{ objectFit: 'cover' }} priority />
      </div>
    </div>
  );
}

