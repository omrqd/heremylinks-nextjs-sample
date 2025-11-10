'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamically import RevenueChart (client-side only for Recharts)
const RevenueChart = dynamic(() => import('./components/RevenueChart'), { 
  ssr: false,
  loading: () => (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 h-96 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-slate-400">Loading chart...</p>
      </div>
    </div>
  )
});

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminImage, setAdminImage] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  });
  const [activity, setActivity] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      checkAdminAccess();
    }
  }, [status, router]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const { user } = await response.json();
        
        // Check if user is banned (even admins can be banned)
        if (user.isBanned) {
          console.log('🚫 User is banned, redirecting to /banned');
          router.push('/banned');
          return;
        }
        
        if (!user.isAdmin) {
          // Not an admin, redirect to regular dashboard
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
        setAdminRole(user.adminRole || 'admin');
        setAdminName(user.name || '');
        setAdminEmail(user.email || session?.user?.email || '');
        setAdminImage(user.profileImage || '');
        loadStats();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Fetch real statistics
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }

      // Fetch activity logs
      const activityResponse = await fetch('/api/admin/activity');
      if (activityResponse.ok) {
        const data = await activityResponse.json();
        setActivity(data.activity || []);
      }

      // Fetch recent transactions
      const transactionsResponse = await fetch('/api/admin/transactions');
      if (transactionsResponse.ok) {
        const data = await transactionsResponse.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-white text-lg">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900/50 backdrop-blur-xl border-r border-purple-500/20 z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-shield-alt text-white"></i>
          </div>
            <div>
              <h2 className="text-white font-bold text-lg">Admin Panel</h2>
              <p className="text-purple-300 text-xs truncate max-w-[140px]" title={adminName || adminEmail}>
                {adminName || adminEmail}
              </p>
        </div>
          </div>

          <nav className="space-y-2">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all">
              <i className="fas fa-home w-5"></i>
              <span>Dashboard</span>
            </Link>
            
            <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <i className="fas fa-users w-5"></i>
              <span>Users</span>
            </Link>
            
            <Link href="/admin/transactions" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <i className="fas fa-credit-card w-5"></i>
              <span>Transactions</span>
            </Link>
            
            <Link href="/admin/admins" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <i className="fas fa-user-shield w-5"></i>
              <span>Admins</span>
            </Link>
            
            <Link href="/admin/notifications" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <i className="fas fa-bell w-5"></i>
                <span>Notifications</span>
            </Link>
            
            <Link href="/admin/emails" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <i className="fas fa-envelope w-5"></i>
              <span>Emails</span>
            </Link>
            
            <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <i className="fas fa-cog w-5"></i>
                <span>Settings</span>
            </Link>
        </nav>

          <div className="mt-8 pt-8 border-t border-purple-500/20">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-300 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-500/40 transition-all">
              <i className="fas fa-user w-5"></i>
              <span className="font-semibold">User Dashboard</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {adminName || adminEmail} 👋
            </h1>
              <p className="text-purple-300">Here's what's happening with your platform today.</p>
            </div>
            
            <div className="flex items-center gap-4 relative">
              {/* Profile Avatar with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 hover:opacity-80 transition-all"
                >
                  {adminImage ? (
                    <img 
                      src={adminImage} 
                      alt={adminName || adminEmail}
                      className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-purple-500">
                      {(adminName || adminEmail || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowProfileDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-lg shadow-xl z-20 overflow-hidden">
                      {/* User Info */}
                      <div className="p-4 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                          {adminImage ? (
                            <img 
                              src={adminImage} 
                              alt={adminName || adminEmail}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                              {(adminName || adminEmail || 'A').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {adminName && (
                              <p className="text-white font-semibold truncate">{adminName}</p>
                            )}
                            <p className="text-slate-400 text-sm truncate">{adminEmail}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                              {adminRole === 'master_admin' ? 'Master Admin' : 'Admin'}
                            </span>
                          </div>
                        </div>
          </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            window.location.href = '/dashboard';
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all text-left"
                        >
                          <i className="fas fa-user w-5"></i>
                          <span>User Dashboard</span>
            </button>
                        
                        <button
                          onClick={async () => {
                            setShowProfileDropdown(false);
                            await signOut({ callbackUrl: '/login' });
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-left"
                        >
                          <i className="fas fa-sign-out-alt w-5"></i>
                          <span>Log Out</span>
            </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-users text-blue-400 text-xl"></i>
        </div>
    </div>
            <h3 className="text-slate-400 text-sm mb-1">Total Users</h3>
            <p className="text-white text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-slate-500 text-xs mt-2">Registered users</p>
          </div>

          {/* Premium Users */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-crown text-purple-400 text-xl"></i>
          </div>
        </div>
            <h3 className="text-slate-400 text-sm mb-1">Premium Users</h3>
            <p className="text-white text-3xl font-bold">{stats.premiumUsers}</p>
            <p className="text-slate-500 text-xs mt-2">{stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}% of total</p>
          </div>

          {/* Free Users */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-500/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-user text-slate-400 text-xl"></i>
          </div>
        </div>
            <h3 className="text-slate-400 text-sm mb-1">Free Users</h3>
            <p className="text-white text-3xl font-bold">{stats.freeUsers}</p>
            <p className="text-slate-500 text-xs mt-2">{stats.totalUsers > 0 ? Math.round((stats.freeUsers / stats.totalUsers) * 100) : 0}% of total</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-dollar-sign text-green-400 text-xl"></i>
          </div>
        </div>
            <h3 className="text-slate-400 text-sm mb-1">Total Revenue</h3>
            <p className="text-white text-3xl font-bold">${stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            <p className="text-slate-500 text-xs mt-2">All-time earnings</p>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-sync-alt text-pink-400 text-xl"></i>
          </div>
        </div>
            <h3 className="text-slate-400 text-sm mb-1">Active Subscriptions</h3>
            <p className="text-white text-3xl font-bold">{stats.activeSubscriptions}</p>
            <p className="text-slate-500 text-xs mt-2">Monthly recurring</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="mb-8">
          <RevenueChart />
        </div>

        {/* Activity and Transactions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
            <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-history text-purple-400"></i>
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activity.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <i className="fas fa-inbox text-4xl mb-2"></i>
                  <p>No recent activity</p>
        </div>
              ) : (
                activity.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-all">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      log.type === 'premium' 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                        : log.type === 'cancel'
                        ? 'bg-gradient-to-br from-red-500 to-orange-500'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    }`}>
                      <i className={`fas ${
                        log.type === 'premium' ? 'fa-crown' : 
                        log.type === 'cancel' ? 'fa-times-circle' : 
                        'fa-user-plus'
                      } text-sm`}></i>
        </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{log.description}</p>
                      <p className="text-slate-400 text-xs truncate">{log.user.email}</p>
      </div>
                    <span className="text-slate-500 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
    </div>
                ))
              )}
      </div>
    </div>

          {/* Recent Transactions */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
            <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-receipt text-green-400"></i>
              Recent Transactions
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <i className="fas fa-cash-register text-4xl mb-2"></i>
                  <p>No transactions yet</p>
        </div>
              ) : (
                transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-all">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      tx.status === 'succeeded' 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-br from-red-500 to-rose-500'
                    }`}>
                      <i className={`fas ${tx.status === 'succeeded' ? 'fa-check' : 'fa-times'} text-sm`}></i>
        </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">
                        ${tx.amount.toFixed(2)} 
                        <span className="text-slate-400 text-xs ml-2">({tx.planType})</span>
                      </p>
                      <p className="text-slate-400 text-xs truncate">{tx.email}</p>
      </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        tx.status === 'succeeded' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.status}
                      </span>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
        </div>
      </div>
                ))
              )}
      </div>
    </div>
        </div>
      </main>
    </div>
  );
}
