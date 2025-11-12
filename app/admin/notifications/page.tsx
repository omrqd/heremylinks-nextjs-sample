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

interface SentNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link: string | null;
  email_sent: boolean;
  created_at: string;
  created_by: {
    id: string;
    username: string;
    email: string;
    name: string | null;
  } | null;
  target_type: 'all' | 'specific';
  target_users: User[];
  notification_ids: string[];
}

export default function AdminNotifications() {
  const { status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Notification list state
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  
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

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Load users when specific target is selected
  useEffect(() => {
    if (targetType === 'specific' && users.length === 0) {
      loadUsers();
    }
  }, [targetType]);

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

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

  const handleDelete = async (notificationIds: string[]) => {
    if (!confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/notifications?ids=${notificationIds.join(',')}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Notification deleted successfully');
        loadNotifications();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    }
  };

  const toggleRecipients = (notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
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
        // Show success or partial success message
        if (data.partialSuccess) {
          setError(
            data.message || 
            `Sent ${data.emailsSent} of ${data.notificationsSent} emails. Some emails failed to send.`
          );
          if (data.emailErrors) {
            console.error('Email errors:', data.emailErrors);
          }
        } else {
          setSuccess(
            `Successfully sent ${data.notificationsSent} notification(s)` +
            (sendEmail ? ` and ${data.emailsSent} email(s)` : '')
          );
        }
        
        // Reset form
        setTitle('');
        setMessage('');
        setLink('');
        setTargetUserId('');
        setType('info');
        setSendEmail(false);
        setShowForm(false);
        
        // Reload notifications list
        loadNotifications();
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
            
            <Link href="/admin/promos" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <i className="fas fa-ticket-alt w-5"></i>
              <span>Promo Codes</span>
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
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Notifications</h1>
            <p className="text-purple-300">Manage and send notifications to users</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
          >
            <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`}></i>
            {showForm ? 'Cancel' : 'Add Notification'}
          </button>
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

        {/* Notifications List */}
        {!showForm && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
            <div className="p-6 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Sent Notifications</h2>
                  <p className="text-slate-400 text-sm mt-1">View and manage all sent notifications</p>
                </div>
                <div className="text-slate-400">
                  <span className="text-2xl font-bold text-white">{notifications.length}</span> total
                </div>
              </div>
            </div>

            {loadingNotifications ? (
              <div className="p-12 text-center">
                <i className="fas fa-spinner fa-spin text-purple-400 text-4xl mb-4"></i>
                <p className="text-slate-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <i className="fas fa-bell-slash text-slate-600 text-5xl mb-4"></i>
                <p className="text-slate-400 text-lg mb-2">No notifications sent yet</p>
                <p className="text-slate-500 text-sm">Click "Add Notification" to send your first notification</p>
              </div>
            ) : (
              <div className="divide-y divide-purple-500/10">
                {notifications.map((notification) => {
                  const showRecipients = expandedNotifications.has(notification.id);
                  
                  return (
                  <div key={notification.id} className="p-6 hover:bg-slate-800/30 transition-all">
                    <div className="flex items-start gap-4">
                      {/* Type Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                        notification.type === 'info' ? 'bg-blue-500/20 text-blue-400' :
                        notification.type === 'success' ? 'bg-green-500/20 text-green-400' :
                        notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        <i className={`fas ${
                          notification.type === 'info' ? 'fa-info-circle' :
                          notification.type === 'success' ? 'fa-check-circle' :
                          notification.type === 'warning' ? 'fa-exclamation-triangle' :
                          'fa-times-circle'
                        } text-xl`}></i>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-lg mb-1">{notification.title}</h3>
                            <p className="text-slate-400 text-sm line-clamp-2">{notification.message}</p>
                          </div>
                          <button
                            onClick={() => handleDelete(notification.notification_ids)}
                            className="flex-shrink-0 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all flex items-center gap-2"
                          >
                            <i className="fas fa-trash"></i>
                            Delete
                          </button>
                        </div>

                        {/* Meta Information */}
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          {/* Sent To */}
                          <div className="flex items-center gap-2">
                            <i className="fas fa-users text-purple-400"></i>
                            <span className="text-slate-300 text-sm">
                              {notification.target_type === 'all' ? (
                                <span className="font-semibold">All Users ({notification.target_users.length})</span>
                              ) : (
                                <span>
                                  <span className="font-semibold">Specific User:</span>{' '}
                                  {notification.target_users[0]?.name || notification.target_users[0]?.username || 'Unknown'}
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Email Sent */}
                          {notification.email_sent && (
                            <div className="flex items-center gap-2">
                              <i className="fas fa-envelope text-purple-400"></i>
                              <span className="text-slate-300 text-sm">
                                {notification.target_type === 'all' 
                                  ? `Email sent to ${notification.target_users.length} user${notification.target_users.length > 1 ? 's' : ''}`
                                  : 'Email sent'
                                }
                              </span>
                            </div>
                          )}

                          {/* Link */}
                          {notification.link && (
                            <div className="flex items-center gap-2">
                              <i className="fas fa-link text-purple-400"></i>
                              <a 
                                href={notification.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-purple-300 text-sm hover:text-purple-200 underline"
                              >
                                Action link
                              </a>
                            </div>
                          )}

                          {/* Created By */}
                          {notification.created_by && (
                            <div className="flex items-center gap-2">
                              <i className="fas fa-user-shield text-purple-400"></i>
                              <span className="text-slate-300 text-sm">
                                by {notification.created_by.name || notification.created_by.username}
                              </span>
                            </div>
                          )}

                          {/* Date */}
                          <div className="flex items-center gap-2 ml-auto">
                            <i className="fas fa-clock text-purple-400"></i>
                            <span className="text-slate-400 text-sm">
                              {new Date(notification.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Recipients List for "All Users" */}
                    {notification.target_type === 'all' && notification.target_users.length > 0 && (
                      <div className="mt-4 border-t border-purple-500/10 pt-4">
                        <button
                          type="button"
                          onClick={() => toggleRecipients(notification.id)}
                          className="flex items-center gap-2 text-purple-300 hover:text-purple-200 text-sm font-semibold transition-all"
                        >
                          <i className={`fas fa-chevron-${showRecipients ? 'up' : 'down'}`}></i>
                          {showRecipients ? 'Hide' : 'Show'} All Recipients ({notification.target_users.length})
                        </button>
                        
                        {showRecipients && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                            {notification.target_users.map((user: User, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-900/30 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                                  {(user.name || user.username || user.email)?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium truncate">
                                    {user.name || user.username || 'Unknown'}
                                  </p>
                                  <p className="text-slate-400 text-xs truncate">{user.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Send Form */}
        {showForm && (
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
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="info"
                    checked={type === 'info'}
                    onChange={(e) => setType(e.target.value as any)}
                    className="sr-only peer"
                  />
                  <div className="p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg peer-checked:border-blue-500 peer-checked:bg-blue-500/10 transition-all text-center hover:bg-slate-800/50">
                    <i className="fas fa-info-circle text-2xl text-blue-400 mb-2"></i>
                    <p className="text-white text-sm font-semibold">Info</p>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="success"
                    checked={type === 'success'}
                    onChange={(e) => setType(e.target.value as any)}
                    className="sr-only peer"
                  />
                  <div className="p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg peer-checked:border-green-500 peer-checked:bg-green-500/10 transition-all text-center hover:bg-slate-800/50">
                    <i className="fas fa-check-circle text-2xl text-green-400 mb-2"></i>
                    <p className="text-white text-sm font-semibold">Success</p>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="warning"
                    checked={type === 'warning'}
                    onChange={(e) => setType(e.target.value as any)}
                    className="sr-only peer"
                  />
                  <div className="p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg peer-checked:border-yellow-500 peer-checked:bg-yellow-500/10 transition-all text-center hover:bg-slate-800/50">
                    <i className="fas fa-exclamation-triangle text-2xl text-yellow-400 mb-2"></i>
                    <p className="text-white text-sm font-semibold">Warning</p>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="error"
                    checked={type === 'error'}
                    onChange={(e) => setType(e.target.value as any)}
                    className="sr-only peer"
                  />
                  <div className="p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg peer-checked:border-red-500 peer-checked:bg-red-500/10 transition-all text-center hover:bg-slate-800/50">
                    <i className="fas fa-times-circle text-2xl text-red-400 mb-2"></i>
                    <p className="text-white text-sm font-semibold">Error</p>
                  </div>
                </label>
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
        )}
      </main>
    </div>
  );
}

