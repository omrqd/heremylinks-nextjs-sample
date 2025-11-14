'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ToastProvider';
import { Lock, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const hasValidated = useRef(false);
  
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Prevent duplicate validation calls (React Strict Mode runs effects twice)
    if (hasValidated.current) return;
    
    const tokenParam = searchParams?.get('token');
    const emailParam = searchParams?.get('email');

    if (!tokenParam || !emailParam) {
      setErrorMessage('Invalid reset link. Please request a new password reset.');
      setIsValidating(false);
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);
    hasValidated.current = true;

    // Validate token
    validateToken(tokenParam, emailParam);
  }, [searchParams]);

  const validateToken = async (tokenValue: string, emailValue: string) => {
    try {
      const response = await fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenValue, email: emailValue }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsValidToken(true);
      } else {
        setErrorMessage(data.error || 'This reset link is invalid or has expired. Please request a new one.');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setErrorMessage('Failed to validate reset link. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Failed to reset password', 'error');
        if (data.error?.includes('invalid') || data.error?.includes('expired')) {
          setErrorMessage(data.error);
          setIsValidToken(false);
        }
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      showToast('Password reset successfully!', 'success');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      showToast('An error occurred. Please try again.', 'error');
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Validating reset link...</p>
        </div>
      </div>
    );
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

          {!success ? (
            <>
              {isValidToken ? (
                <>
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h1>
                    <p className="text-slate-600">Create a new password for {email}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400"
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                    </div>

                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs text-purple-900">
                        • Password must be at least 6 characters<br />
                        • This link can only be used once
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Resetting...</>
                      ) : (
                        <><CheckCircle2 className="w-5 h-5 mr-2" /> Reset Password</>
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Reset Link</h1>
                  <p className="text-slate-600 mb-6">{errorMessage}</p>
                  <Button asChild variant="outline" className="mr-2">
                    <Link href="/login">Back to Login</Link>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center animate-in fade-in duration-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Password Reset Successful!</h1>
              <p className="text-slate-600 mb-6">
                Your password has been reset. You can now log in with your new password.
              </p>
              <p className="text-sm text-slate-500">Redirecting to login page...</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        <Image
          src="/imgs/feature3.jpg"
          alt="HereMyLinks Features"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

