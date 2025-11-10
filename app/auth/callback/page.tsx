'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * OAuth Callback Handler
 * This page checks if the user is an admin after OAuth login
 * and redirects them to the appropriate dashboard
 */
export default function AuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.email) {
      console.log('🔍 Checking admin status for:', session.user.email);
      
      // Add a small delay to ensure session is fully established
      setTimeout(async () => {
        try {
          console.log('📡 Fetching profile...');
          const res = await fetch('/api/user/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          
          console.log('📡 Profile API response status:', res.status);
          
          if (!res.ok) {
            console.error('❌ API returned error status:', res.status);
            const errorText = await res.text();
            console.error('Error details:', errorText);
            throw new Error(`API error: ${res.status}`);
          }
          
          const data = await res.json();
          console.log('📦 Full profile data:', data);
          console.log('🔑 Admin fields:', {
            isAdmin: data.user?.isAdmin,
            adminRole: data.user?.adminRole,
            adminPermissions: data.user?.adminPermissions,
          });
          
          if (data.user?.isBanned) {
            console.log('🚫 User is banned, redirecting to /banned');
            window.location.href = '/banned';
          } else if (data.user?.isAdmin) {
            console.log('✅ Admin user detected, redirecting to /admin');
            window.location.href = '/admin';
          } else {
            console.log('⚠️ Not an admin user, redirecting to /dashboard');
            window.location.href = '/dashboard';
          }
        } catch (error) {
          console.error('❌ Error checking admin status:', error);
          if (error instanceof Error) {
            console.error('Full error details:', {
              message: error.message,
              stack: error.stack,
              type: error.constructor.name,
            });
          }
          // Fallback to dashboard on error
          console.log('⚠️ Falling back to /dashboard due to error');
          window.location.href = '/dashboard';
        }
      }, 500); // 500ms delay to ensure session is ready
    }
  }, [status, session, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #7e22ce 100%)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 16px',
          border: '3px solid rgba(139, 92, 246, 0.3)',
          borderTop: '3px solid #8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: 'white', fontSize: '18px' }}>Redirecting...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

