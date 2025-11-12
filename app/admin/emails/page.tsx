'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill (client-side only)
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-slate-900/50 border border-slate-700 rounded-lg flex items-center justify-center">
    <p className="text-slate-400">Loading editor...</p>
  </div>
});

interface SentEmail {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string;
  body_html: string;
  target_type: 'all' | 'specific';
  target_user_id: string | null;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  status: string;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
  sender: {
    name: string | null;
    username: string;
    email: string;
  } | null;
  target_user: {
    name: string | null;
    username: string;
    email: string;
  } | null;
}

interface User {
  id: string;
  username: string;
  email: string;
  name: string | null;
  is_admin: boolean;
}

export default function AdminEmailsPage() {
  const { status } = useSession();
  const router = useRouter();
  
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  
  // Form state
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  
  // User search for specific targeting
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserObject, setSelectedUserObject] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  // Quill editor modules configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ]
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image'
  ];

  useEffect(() => {
    loadEmails();
  }, []);

  // Search users as user types
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/emails');
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      } else if (response.status === 403) {
        setError('You need admin access to view this page');
      }
    } catch (error) {
      console.error('Error loading emails:', error);
      setError('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectUser = (user: User) => {
    setSelectedUser(user.id);
    setSelectedUserObject(user);
    setSearchQuery(user.email);
    setShowSearchResults(false);
  };

  const clearUserSelection = () => {
    setSelectedUser('');
    setSelectedUserObject(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleSendEmail = async () => {
    if (!fromEmail || !subject || !bodyHtml) {
      setError('From email, subject, and body are required');
      return;
    }

    if (targetType === 'specific' && !selectedUser) {
      setError('Please select a user for specific targeting');
      return;
    }

    setSendLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmail,
          fromName: fromName || null,
          targetType,
          targetUserId: targetType === 'specific' ? selectedUser : undefined,
          subject,
          bodyHtml,
          bodyText: bodyHtml.replace(/<[^>]*>/g, '') // Strip HTML for text version
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || `Successfully sent ${data.sent} emails`);
        setShowSendModal(false);
        resetForm();
        loadEmails();
      } else {
        setError(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send email');
    } finally {
      setSendLoading(false);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    if (!confirm('Are you sure you want to delete this email record?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/emails/${emailId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Email record deleted successfully');
        loadEmails();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete email');
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      setError('Failed to delete email');
    }
  };

  const resetForm = () => {
    setFromEmail('');
    setFromName('');
    setTargetType('all');
    setSubject('');
    setBodyHtml('');
    clearUserSelection();
  };

  if (status === 'loading' || loading) {
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
              <p className="text-purple-300 text-xs">Bulk Emails</p>
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
            
            <Link href="/admin/notifications" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <i className="fas fa-bell w-5"></i>
              <span>Notifications</span>
            </Link>
            
            <Link href="/admin/emails" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all">
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
            <h1 className="text-4xl font-bold text-white mb-2">Bulk Emails</h1>
            <p className="text-purple-300">Send and monitor bulk email campaigns</p>
          </div>
          <button
            onClick={() => setShowSendModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
          >
            <i className="fas fa-paper-plane"></i>
            Send Email
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

        {/* Sent Emails List */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
          <div className="p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Sent Emails</h2>
                <p className="text-slate-400 text-sm mt-1">Monitor all sent email campaigns</p>
              </div>
              <div className="text-slate-400">
                <span className="text-2xl font-bold text-white">{emails.length}</span> total
              </div>
            </div>
          </div>

          {emails.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-envelope-open-text text-slate-600 text-5xl mb-4"></i>
              <p className="text-slate-400 text-lg mb-2">No emails sent yet</p>
              <p className="text-slate-500 text-sm">Click "Send Email" to send your first bulk email campaign</p>
            </div>
          ) : (
            <div className="divide-y divide-purple-500/10">
              {emails.map((email) => (
                <div key={email.id} className="p-6 hover:bg-slate-800/30 transition-all">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                      email.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                      email.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                      email.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      <i className={`fas ${
                        email.status === 'sent' ? 'fa-check-circle' :
                        email.status === 'partial' ? 'fa-exclamation-triangle' :
                        email.status === 'failed' ? 'fa-times-circle' :
                        'fa-clock'
                      } text-xl`}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg mb-1">{email.subject}</h3>
                          <p className="text-slate-400 text-sm">From: {email.from_name ? `${email.from_name} <${email.from_email}>` : email.from_email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExpandedEmail(expandedEmail === email.id ? null : email.id)}
                            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all flex items-center gap-2"
                          >
                            <i className={`fas fa-chevron-${expandedEmail === email.id ? 'up' : 'down'}`}></i>
                            {expandedEmail === email.id ? 'Hide' : 'View'}
                          </button>
                          <button
                            onClick={() => handleDeleteEmail(email.id)}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all flex items-center gap-2"
                          >
                            <i className="fas fa-trash"></i>
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        {/* Sent To */}
                        <div className="flex items-center gap-2">
                          <i className="fas fa-users text-purple-400"></i>
                          <span className="text-slate-300 text-sm">
                            {email.target_type === 'all' ? (
                              <span><span className="font-semibold">All Users</span> ({email.recipients_count})</span>
                            ) : (
                              <span>
                                <span className="font-semibold">Specific:</span> {email.target_user?.name || email.target_user?.email || 'Unknown'}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Delivery Stats */}
                        <div className="flex items-center gap-2">
                          <i className="fas fa-check text-green-400"></i>
                          <span className="text-slate-300 text-sm">Sent: <span className="font-semibold">{email.sent_count}</span></span>
                        </div>

                        {email.failed_count > 0 && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-times text-red-400"></i>
                            <span className="text-slate-300 text-sm">Failed: <span className="font-semibold">{email.failed_count}</span></span>
                          </div>
                        )}

                        {/* Date */}
                        <div className="flex items-center gap-2 ml-auto">
                          <i className="fas fa-clock text-purple-400"></i>
                          <span className="text-slate-400 text-sm">
                            {new Date(email.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          email.status === 'sent' ? 'bg-green-500/20 text-green-300' :
                          email.status === 'partial' ? 'bg-yellow-500/20 text-yellow-300' :
                          email.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {email.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Expanded Content */}
                      {expandedEmail === email.id && (
                        <div className="mt-4 border-t border-purple-500/10 pt-4">
                          <h4 className="text-white font-semibold mb-2">Email Body:</h4>
                          <div 
                            className="bg-slate-900/50 p-4 rounded-lg text-slate-300 text-sm max-h-64 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: email.body_html }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Send Email Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl border border-purple-500/20 max-w-4xl w-full my-8">
            <div className="p-6 border-b border-purple-500/20 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
              <h2 className="text-2xl font-bold text-white">Send Bulk Email</h2>
              <button
                onClick={() => {
                  setShowSendModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* From Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-2">
                    From Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="no-reply@heremylinks.com"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-slate-500 text-xs mt-1">The sender email address</p>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-2">
                    From Name <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="HereMyLinks Team"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-slate-500 text-xs mt-1">The sender display name</p>
                </div>
              </div>

              {/* Target Selection */}
              <div>
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
                          <p className="text-slate-400 text-sm">Send to everyone</p>
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

              {/* User Search (if specific) */}
              {targetType === 'specific' && (
                <div>
                  <label className="text-slate-300 font-semibold block mb-2">
                    Search User by Email or Name
                  </label>
                  
                  {selectedUserObject ? (
                    <div className="flex items-center gap-3 p-4 bg-slate-900/50 border border-purple-500 rounded-lg">
                      <div className="flex-1">
                        <p className="text-white font-semibold">
                          {selectedUserObject.name || selectedUserObject.username}
                        </p>
                        <p className="text-slate-400 text-sm">{selectedUserObject.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearUserSelection}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                        placeholder="Type at least 2 characters..."
                        className="w-full px-4 py-3 pr-10 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                      {searchLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <i className="fas fa-spinner fa-spin text-purple-400"></i>
                        </div>
                      )}

                      {/* Search Results */}
                      {showSearchResults && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-purple-500/20 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => selectUser(user)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-all border-b border-slate-700/50 last:border-b-0"
                            >
                              <p className="text-white font-medium">{user.name || user.username}</p>
                              <p className="text-slate-400 text-sm">{user.email}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {showSearchResults && searchResults.length === 0 && !searchLoading && searchQuery.length >= 2 && (
                        <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-purple-500/20 rounded-lg shadow-xl p-4 text-center">
                          <p className="text-slate-400">No users found matching "{searchQuery}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="text-slate-300 font-semibold block mb-2">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Important Announcement"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="text-slate-300 font-semibold block mb-2">
                  Email Body <span className="text-red-400">*</span>
                </label>
                <div className="bg-white rounded-lg overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={bodyHtml}
                    onChange={setBodyHtml}
                    modules={modules}
                    formats={formats}
                    placeholder="Write your email content here..."
                    className="h-64"
                  />
                </div>
                <p className="text-slate-500 text-sm mt-2">Use the toolbar to format your email with rich text, images, and links</p>
              </div>
            </div>

            <div className="p-6 border-t border-purple-500/20 flex justify-end gap-3 sticky bottom-0 bg-slate-800">
              <button
                onClick={() => {
                  setShowSendModal(false);
                  resetForm();
                }}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendLoading || !fromEmail || !subject || !bodyHtml}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {sendLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

