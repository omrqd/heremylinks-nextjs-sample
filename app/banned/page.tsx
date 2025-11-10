'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function BannedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [banReason, setBanReason] = useState('Your account has been banned. Please contact support for more information.');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBanStatus = async () => {
      if (status === 'unauthenticated') {
        router.push('/login');
        return;
      }

      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const { user } = await response.json();
            
            if (!user.isBanned) {
              // User is not banned, redirect to dashboard
              if (user.isAdmin) {
                router.push('/admin');
              } else {
                router.push('/dashboard');
              }
              return;
            }

            // User is banned, set the ban reason
            if (user.banReason) {
              setBanReason(user.banReason);
            }
          }
        } catch (error) {
          console.error('Error checking ban status:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    checkBanStatus();
  }, [status, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Banned Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border-2 border-red-500/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-800 p-8 text-center">
            <div className="inline-block p-6 bg-white/10 rounded-full mb-4">
              <i className="fas fa-ban text-6xl text-white"></i>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Account Banned</h1>
            <p className="text-red-100">Your access to this account has been restricted</p>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Ban Message */}
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-triangle text-3xl text-red-400 mt-1"></i>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-red-300 mb-3">Ban Reason</h2>
                  <p className="text-red-100 text-lg leading-relaxed whitespace-pre-wrap">{banReason}</p>
                </div>
              </div>
            </div>

            {/* Information */}
            <div className="bg-slate-800/50 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-info-circle text-blue-400"></i>
                What This Means
              </h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <i className="fas fa-times-circle text-red-400 mt-1"></i>
                  <span>You cannot access your dashboard or account features</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-times-circle text-red-400 mt-1"></i>
                  <span>Your bio page may be temporarily unavailable</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-times-circle text-red-400 mt-1"></i>
                  <span>All account functionality is suspended</span>
                </li>
              </ul>
            </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <i className="fas fa-headset text-purple-400"></i>
                Need Help?
              </h3>
              <p className="text-slate-300 mb-4">
                If you believe this ban was made in error or would like to appeal, please contact our support team.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:support@heremylinks.com"
                  className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all flex items-center justify-center gap-2 font-semibold"
                >
                  <i className="fas fa-envelope"></i>
                  Email Support
                </a>
                <a
                  href="https://heremylinks.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2 font-semibold"
                >
                  <i className="fas fa-comment-alt"></i>
                  Contact Us
                </a>
              </div>
            </div>

            {/* Logout Button */}
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="px-8 py-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all flex items-center gap-3 font-semibold text-lg"
              >
                <i className="fas fa-sign-out-alt"></i>
                Log Out
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-900/50 border-t border-red-500/20 p-6 text-center">
            <p className="text-slate-400 text-sm">
              © 2025 HereMyLinks. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

