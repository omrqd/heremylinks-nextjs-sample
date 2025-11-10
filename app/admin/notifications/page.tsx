'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  email: string;
  name: string | null;
}

export default function AdminNotifications() {
  const { status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Form state
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [link, setLink] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load users when specific target is selected
  useEffect(() => {
    if (targetType === 'specific' && users.length === 0) {
      loadUsers();
    }
  }, [targetType]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !message) {
      setError('Title and message are required');
      return;
    }

    if (targetType === 'specific' && !targetUserId) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetUserId: targetType === 'specific' ? targetUserId : undefined,
          title,
          message,
          type,
          link: link || null,
          sendEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          `Successfully sent ${data.notificationsSent} notification(s)` +
          (sendEmail ? ` and ${data.emailsSent} email(s)` : '')
        );
        
        // Reset form
        setTitle('');
        setMessage('');
        setLink('');
        setTargetUserId('');
        setType('info');
        setSendEmail(false);
      } else {
        setError(data.error || 'Failed to send notifications');
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      setError('Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
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
              <p className="text-purple-300 text-xs">Notifications</p>
            </div>
          </div>

          <nav className="space-y-2">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
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
            
            <Link href="/admin/notifications" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all">
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
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Send Notifications</h1>
          <p className="text-purple-300">Send notifications to users with optional email alerts</p>
        </header>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-start gap-3">
            <i className="fas fa-check-circle text-green-400 text-xl mt-0.5"></i>
            <div className="flex-1">
              <p className="text-green-300 font-semibold">Success!</p>
              <p className="text-green-200 text-sm mt-1">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
            <i className="fas fa-exclamation-circle text-red-400 text-xl mt-0.5"></i>
            <div className="flex-1">
              <p className="text-red-300 font-semibold">Error</p>
              <p className="text-red-200 text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* Send Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Target Selection */}
            <div className="lg:col-span-2">
              <label className="text-slate-300 font-semibold block mb-3">Send To</label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    value="all"
                    checked={targetType === 'all'}
                    onChange={(e) => setTargetType(e.target.value as 'all')}
                    className="sr-only peer"
                  />
                  <div className="p-4 bg-slate-900/50 border-2 border-slate-700 rounded-lg peer-checked:border-purple-500 peer-checked:bg-purple-500/10 transition-all">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-users text-2xl text-purple-400"></i>
                      <div>
                        <p className="text-white font-semibold">All Users</p>
                        <p className="text-slate-400 text-sm">Send to everyone on the platform</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    value="specific"
                    checked={targetType === 'specific'}
                    onChange={(e) => setTargetType(e.target.value as 'specific')}
                    className="sr-only peer"
                  />
                  <div className="p-4 bg-slate-900/50 border-2 border-slate-700 rounded-lg peer-checked:border-purple-500 peer-checked:bg-purple-500/10 transition-all">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-user text-2xl text-purple-400"></i>
                      <div>
                        <p className="text-white font-semibold">Specific User</p>
                        <p className="text-slate-400 text-sm">Send to one user</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* User Selection (if specific) */}
            {targetType === 'specific' && (
              <div className="lg:col-span-2">
                <label className="text-slate-300 font-semibold block mb-2">Select User</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  required
                >
                  <option value="">Choose a user...</option>
                  {loadingUsers ? (
                    <option disabled>Loading users...</option>
                  ) : (
                    users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.username} ({user.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Notification Type */}
            <div className="lg:col-span-2">
              <label className="text-slate-300 font-semibold block mb-3">Notification Type</label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: 'info', icon: 'info-circle', color: 'blue' },
                  { value: 'success', icon: 'check-circle', color: 'green' },
                  { value: 'warning', icon: 'exclamation-triangle', color: 'yellow' },
                  { value: 'error', icon: 'times-circle', color: 'red' },
                ].map((typeOption) => (
                  <label key={typeOption.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={typeOption.value}
                      checked={type === typeOption.value}
                      onChange={(e) => setType(e.target.value as any)}
                      className="sr-only peer"
                    />
                    <div className={`p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg peer-checked:border-${typeOption.color}-500 peer-checked:bg-${typeOption.color}-500/10 transition-all text-center`}>
                      <i className={`fas fa-${typeOption.icon} text-2xl text-${typeOption.color}-400 mb-2`}></i>
                      <p className="text-white text-sm font-semibold capitalize">{typeOption.value}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="lg:col-span-2">
              <label className="text-slate-300 font-semibold block mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="e.g., New Feature Available!"
                required
              />
            </div>

            {/* Message */}
            <div className="lg:col-span-2">
              <label className="text-slate-300 font-semibold block mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
                rows={4}
                placeholder="Write your notification message here..."
                required
              />
            </div>

            {/* Optional Link */}
            <div className="lg:col-span-2">
              <label className="text-slate-300 font-semibold block mb-2">
                Action Link <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="https://example.com/learn-more"
              />
              <p className="text-slate-500 text-sm mt-1">Optional URL for a call-to-action button</p>
            </div>

            {/* Email Alert Option */}
            <div className="lg:col-span-2">
              <label className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-700 rounded-lg cursor-pointer hover:border-purple-500/50 transition-all">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <p className="text-white font-semibold">Send Email Alert</p>
                  <p className="text-slate-400 text-sm">Also send this notification via email to users</p>
                </div>
                <i className="fas fa-envelope text-purple-400 text-xl"></i>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

