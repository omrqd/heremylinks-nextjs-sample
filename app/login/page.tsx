'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ToastProvider';
import VerificationForm from './components/VerificationForm';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Sparkles, 
  Shield,
  CheckCircle2,
  Loader2,
  Edit2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [step, setStep] = useState<'email' | 'password' | 'verification' | 'forgot-password'>('email');
  const [emailUsername, setEmailUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [title, setTitle] = useState('Welcome back');
  const [subtitle, setSubtitle] = useState('Log in to your HereMyLinks');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [canResendCode, setCanResendCode] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [canSendReset, setCanSendReset] = useState(true);
  const [resetCountdown, setResetCountdown] = useState(0);

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // Check if user is banned, admin, or regular user and redirect accordingly
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.user?.isBanned) {
            window.location.href = '/banned';
          } else if (data.user?.isAdmin) {
            window.location.href = '/admin';
          } else {
            window.location.href = '/dashboard';
          }
        })
        .catch(() => {
          // Fallback to dashboard on error
          window.location.href = '/dashboard';
        });
    }
  }, [status, session]);

  // Countdown timer for resend code rate limiting
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && !canResendCode) {
      setCanResendCode(true);
    }
  }, [resendCountdown, canResendCode]);

  // Countdown timer for forgot password rate limiting
  useEffect(() => {
    if (resetCountdown > 0) {
      const timer = setTimeout(() => {
        setResetCountdown(resetCountdown - 1);
        // Update localStorage
        localStorage.setItem('resetPasswordTime', Date.now().toString());
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resetCountdown === 0 && !canSendReset) {
      setCanSendReset(true);
      localStorage.removeItem('resetPasswordTime');
    }
  }, [resetCountdown, canSendReset]);

  // Check localStorage on mount for existing cooldown
  useEffect(() => {
    const lastResetTime = localStorage.getItem('resetPasswordTime');
    if (lastResetTime) {
      const elapsed = Math.floor((Date.now() - parseInt(lastResetTime)) / 1000);
      const remaining = 30 - elapsed;
      if (remaining > 0) {
        setResetCountdown(remaining);
        setCanSendReset(false);
      } else {
        localStorage.removeItem('resetPasswordTime');
      }
    }
  }, []);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailUsername.trim()) return;

    setIsCheckingEmail(true);

    try {
      // Check if email exists and verification status
      const response = await fetch('/api/auth/check-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailUsername }),
      });

      const data = await response.json();

      if (data.exists) {
                if (!data.isVerified) {
                  // User exists but is not verified - show verification form
                  setNeedsVerification(true);
                  setStep('verification');
                  setTitle('Verify Email');
                  setSubtitle('Check your inbox for the code');
                  showToast('Please verify your email before logging in', 'info');
                  // Send a new verification code
                  handleResendCode();
                } else {
                  // Existing verified user - show login
                  setIsNewUser(false);
                  setTitle('Welcome back');
                  setSubtitle('Enter your password to continue');
                  setStep('password');
                }
              } else {
                // New user - show registration
                setIsNewUser(true);
                setTitle('Create Account');
                setSubtitle('Set up your password');
                setStep('password');
              }
    } catch (error) {
      console.error('Error checking email:', error);
      showToast('Failed to verify email. Please try again.', 'error');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleEditEmail = () => {
    setTitle('Welcome back');
    setSubtitle('Log in to your HereMyLinks');
    setStep('email');
    setPassword('');
    setRepeatPassword('');
    setIsNewUser(false);
    setNeedsVerification(false);
    setIsForgotPassword(false);
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setStep('forgot-password');
    setTitle('Reset Password');
    setSubtitle('We\'ll send you a reset link');
    setEmailUsername('');
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setStep('email');
    setTitle('Welcome back');
    setSubtitle('Log in to your HereMyLinks');
    setEmailUsername('');
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailUsername.trim()) return;

    // Check if cooldown is active
    if (!canSendReset) {
      showToast(`Please wait ${resetCountdown} seconds before sending another request`, 'info');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailUsername }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to send reset link', 'error');
        setIsLoading(false);
        return;
      }

      showToast('Password reset link sent! Please check your email.', 'success');
      
      // Start 30-second cooldown
      setCanSendReset(false);
      setResetCountdown(30);
      localStorage.setItem('resetPasswordTime', Date.now().toString());
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending reset link:', error);
      showToast('Failed to send reset link. Please try again.', 'error');
      setIsLoading(false);
    }
  };
  
  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showToast('Please enter a valid verification code', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailUsername,
          code: verificationCode
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        showToast(data.error || 'Failed to verify email', 'error');
        setIsLoading(false);
        return;
      }
      
      showToast('Email verified successfully!', 'success');
      
      // Sign in with credentials after verification
      const result = await signIn('credentials', {
        email: emailUsername,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        showToast('Verification successful but login failed. Please try logging in.', 'error');
        setStep('password');
        setIsLoading(false);
        return;
      }
      
      // Redirect to dashboard on successful login using window.location for more reliable redirect
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error verifying email:', error);
      showToast('Failed to verify email. Please try again.', 'error');
      setIsLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    if (!canResendCode) {
      showToast(`Please wait ${resendCountdown} seconds before resending`, 'info');
      return;
    }

    try {
      const response = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailUsername,
          username: emailUsername.split('@')[0]
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        showToast(data.error || 'Failed to resend verification code', 'error');
        return;
      }
      
      showToast('Verification code sent! Please check your email.', 'success');
      
      // Start rate limiting countdown (30 seconds)
      setCanResendCode(false);
      setResendCountdown(30);
    } catch (error) {
      console.error('Error resending code:', error);
      showToast('Failed to resend verification code. Please try again.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match for new users
    if (isNewUser && password !== repeatPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }
    
    // Validate password length
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long!', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isNewUser) {
        // Register new user
        const username = emailUsername.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailUsername,
            password,
            username,
            name: username,
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          showToast(data.error || 'Registration failed', 'error');
          setIsLoading(false);
          return;
        }
        
        // Show verification step if registration was successful
        if (data.needsVerification) {
          setNeedsVerification(true);
          setStep('verification');
          setSubtitle('Verify your email address');
          showToast('Please check your email for a verification code', 'info');
          setIsLoading(false);
          return;
        }
      }
      
      // Sign in with credentials
      const result = await signIn('credentials', {
        email: emailUsername,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        if (isNewUser) {
          showToast('Registration successful but login failed. Please try logging in.', 'error');
        } else {
          showToast('Invalid password. Please try again.', 'error');
        }
        setIsLoading(false);
        return;
      }
      
      // Success - redirect to dashboard using window.location for more reliable redirect
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Authentication error:', error);
      showToast('Authentication failed. Please try again.', 'error');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/auth/callback' });
    } catch (error) {
      console.error('Google login error:', error);
      showToast('Google login failed', 'error');
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if authenticated (will redirect)
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-block mb-8 hover:opacity-80 transition-opacity">
            <Image src="/imgs/logo.png" alt="HereMyLinks Logo" width={180} height={45} priority />
          </Link>
          
          {/* Form Card */}
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
              <p className="text-slate-600">{subtitle}</p>
            </div>
            
            {/* Show Google button only on email step */}
            {step === 'email' && (
              <>
                <Button
                  variant="outline"
                  className="w-full h-12 border-2 hover:bg-slate-50 mb-4"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="mr-2">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500 font-medium">OR</span>
                  </div>
                </div>
              </>
            )}
            
            <form onSubmit={step === 'email' ? handleContinue : handleSubmit} className="space-y-4">
              {/* Step 1: Email Input */}
              {step === 'email' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400"
                      placeholder="Enter your email" 
                      value={emailUsername}
                      onChange={(e) => setEmailUsername(e.target.value)}
                      required
                      disabled={isCheckingEmail}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    disabled={isCheckingEmail}
                  >
                    {isCheckingEmail ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Checking...</>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              )}
              
              {/* Step 2: Password Inputs */}
              {step === 'password' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Email Display with Edit */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">{emailUsername}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleEditEmail}
                      className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                  
                  {/* Password Input */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="password" 
                      className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400"
                      placeholder="Enter your password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  {/* Repeat Password for New Users */}
                  {isNewUser && (
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="password" 
                        className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400"
                        placeholder="Repeat your password" 
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Please wait...</>
                    ) : (
                      <>{isNewUser ? <><Shield className="w-5 h-5 mr-2" /> Create Account</> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Log In</>}</>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Step 3: Verification Code Input */}
              {step === 'verification' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Email Display with Edit */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">{emailUsername}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleEditEmail}
                      className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                  
                  <VerificationForm
                    verificationCode={verificationCode}
                    setVerificationCode={setVerificationCode}
                    onVerify={handleVerifyEmail}
                    onResend={handleResendCode}
                    isLoading={isLoading}
                    canResend={canResendCode}
                    countdown={resendCountdown}
                  />
                </div>
              )}

              {/* Step 4: Forgot Password */}
              {step === 'forgot-password' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors mb-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </button>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl mb-4">
                    <p className="text-sm text-purple-900">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400"
                      placeholder="Enter your email" 
                      value={emailUsername}
                      onChange={(e) => setEmailUsername(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={handleSendResetLink}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !canSendReset}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</>
                    ) : !canSendReset ? (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Wait {resetCountdown}s
                      </>
                    ) : (
                      <><Mail className="w-5 h-5 mr-2" /> Send Reset Link</>
                    )}
                  </Button>
                  
                  {!canSendReset && (
                    <p className="text-xs text-center text-slate-500 mt-2">
                      You can send another request in {resetCountdown} seconds
                    </p>
                  )}
                </div>
              )}
            </form>
            
            {/* Footer Links */}
            {step !== 'forgot-password' && (
              <div className="mt-6 text-center">
                <button 
                  onClick={handleForgotPassword}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        {/* Image */}
        <Image 
          src="/imgs/feature3.jpg" 
          alt="HereMyLinks Features" 
          fill 
          className="object-cover"
          priority 
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20" />
      </div>
    </div>
  );
}
