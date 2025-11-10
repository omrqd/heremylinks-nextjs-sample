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
  is_premium: boolean;
  premium_plan_type: string | null;
  created_at: string;
  profile_image: string | null;
  bio: string | null;
  is_admin: boolean;
  is_published: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
}

export default function AdminUsers() {
  const { status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const perPage = 10;
  
  // Modals
  const [viewModal, setViewModal] = useState<User | null>(null);
  const [editModal, setEditModal] = useState<User | null>(null);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [banModal, setBanModal] = useState<User | null>(null);
  const [unbanModal, setUnbanModal] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    isPremium: false,
    premiumPlanType: 'monthly',
    isVerified: true,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load users when page or search changes
  useEffect(() => {
    if (status === 'authenticated') {
      loadUsers();
    }
  }, [status, currentPage, searchDebounce]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: perPage.toString(),
        ...(searchDebounce && { search: searchDebounce }),
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
        setTotalUsers(data.pagination.total);
      } else if (response.status === 403) {
        router.push('/admin');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (user: User) => {
    setViewModal(user);
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name || '',
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: '',
      bio: user.bio || '',
      isPremium: user.is_premium,
      premiumPlanType: user.premium_plan_type || 'monthly',
      isVerified: user.is_verified || false,
    });
    setEditModal(user);
  };

  const handleDelete = (user: User) => {
    setDeleteModal(user);
  };

  const handleBan = (user: User) => {
    setBanReason('Your account has been banned. Please contact support for more information.');
    setBanModal(user);
  };

  const handleUnban = (user: User) => {
    setUnbanModal(user);
  };

  const handleAddUser = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      bio: '',
      isPremium: false,
      premiumPlanType: 'monthly',
      isVerified: true,
    });
    setAddModal(true);
  };

  const submitAdd = async () => {
    if (!formData.email || !formData.username || !formData.password) {
      setError('Email, username, and password are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setAddModal(false);
        loadUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (error) {
      setError('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!editModal) return;

    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/users/${editModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          existingPremium: editModal.is_premium,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEditModal(null);
        loadUsers();
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (error) {
      setError('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/users/${deleteModal.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteModal(null);
        loadUsers();
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (error) {
      setError('Failed to delete user');
    } finally {
      setSaving(false);
    }
  };

  const confirmBan = async () => {
    if (!banModal) return;

    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/users/${banModal.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banReason }),
      });

      const data = await response.json();

      if (response.ok) {
        setBanModal(null);
        setBanReason('');
        loadUsers();
      } else {
        setError(data.error || 'Failed to ban user');
      }
    } catch (error) {
      setError('Failed to ban user');
    } finally {
      setSaving(false);
    }
  };

  const confirmUnban = async () => {
    if (!unbanModal) return;

    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/users/${unbanModal.id}/ban`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setUnbanModal(null);
        loadUsers();
      } else {
        setError(data.error || 'Failed to unban user');
      }
    } catch (error) {
      setError('Failed to unban user');
    } finally {
      setSaving(false);
    }
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
              <p className="text-purple-300 text-xs">User Management</p>
            </div>
          </div>

          <nav className="space-y-2">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <i className="fas fa-home w-5"></i>
              <span>Dashboard</span>
            </Link>
            
            <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all">
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
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
          <p className="text-purple-300">View, edit, and manage all users on the platform</p>
        </header>

        {/* Search and Actions */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                placeholder="Search users by name, email, or username..."
                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <button 
              onClick={handleAddUser}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Add User
            </button>
          </div>
          
          {searchDebounce && (
            <p className="text-slate-400 text-sm mt-3">
              Found {totalUsers} user{totalUsers !== 1 ? 's' : ''} matching "{searchDebounce}"
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <i className="fas fa-exclamation-circle text-red-400"></i>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-slate-400">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-users text-slate-600 text-5xl mb-4"></i>
              <p className="text-slate-400 text-lg">No users found</p>
              {searchDebounce && (
                <p className="text-slate-500 text-sm mt-2">Try a different search term</p>
              )}
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-semibold">User</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Email</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Username</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Status</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Joined</th>
                    <th className="text-right p-4 text-slate-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-900/30 transition-all">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.profile_image ? (
                            <img 
                              src={user.profile_image} 
                              alt={user.name || user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                              {(user.name || user.username || user.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="text-white font-semibold block">{user.name || 'No name'}</span>
                            {user.is_admin && (
                              <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">Admin</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{user.email}</td>
                      <td className="p-4 text-slate-300">@{user.username}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {user.is_banned ? (
                            <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-semibold flex items-center gap-1 w-fit border border-red-500/30">
                              <i className="fas fa-ban text-xs"></i>
                              Banned
                            </span>
                          ) : user.is_premium ? (
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold flex items-center gap-1 w-fit">
                              <i className="fas fa-crown text-xs"></i>
                              Premium
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm font-semibold">
                              Free
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleView(user)}
                            className="p-2 hover:bg-slate-700 rounded-lg text-blue-400 transition-all" 
                            title="View"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            onClick={() => handleEdit(user)}
                            className="p-2 hover:bg-slate-700 rounded-lg text-green-400 transition-all" 
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {user.is_banned ? (
                            <button 
                              onClick={() => handleUnban(user)}
                              className="p-2 hover:bg-slate-700 rounded-lg text-yellow-400 transition-all" 
                              title="Unban User"
                            >
                              <i className="fas fa-unlock"></i>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleBan(user)}
                              className="p-2 hover:bg-slate-700 rounded-lg text-orange-400 transition-all" 
                              title="Ban User"
                            >
                              <i className="fas fa-ban"></i>
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(user)}
                            className="p-2 hover:bg-slate-700 rounded-lg text-red-400 transition-all" 
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-6 bg-slate-900/30">
                <p className="text-slate-400">
                  Showing {((currentPage - 1) * perPage) + 1}-{Math.min(currentPage * perPage, totalUsers)} of {totalUsers} users
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-800/50 text-slate-400 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Show first, last, current, and adjacent pages
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg transition-all ${
                            currentPage === page
                              ? 'bg-purple-500 text-white'
                              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-slate-500">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-slate-800/50 text-slate-400 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-purple-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">User Details</h3>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-6 mb-6">
                {viewModal.profile_image ? (
                  <img 
                    src={viewModal.profile_image} 
                    alt={viewModal.name || viewModal.username}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl">
                    {(viewModal.name || viewModal.username || viewModal.email).charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-white mb-1">{viewModal.name || 'No name set'}</h4>
                  <p className="text-slate-400 mb-2">@{viewModal.username}</p>
                  <div className="flex gap-2 flex-wrap">
                    {viewModal.is_banned && (
                      <span className="inline-block px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-semibold border border-red-500/30">
                        <i className="fas fa-ban mr-1"></i>
                        Banned Account
                      </span>
                    )}
                    {viewModal.is_premium && (
                      <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold">
                        <i className="fas fa-crown mr-1"></i>
                        Premium ({viewModal.premium_plan_type})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {viewModal.is_banned && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-exclamation-triangle text-red-400 text-xl mt-1"></i>
                    <div className="flex-1">
                      <h5 className="text-red-300 font-semibold mb-2">This user is banned</h5>
                      <p className="text-red-200/80 text-sm mb-2">{viewModal.ban_reason || 'No reason provided'}</p>
                      {viewModal.banned_at && (
                        <p className="text-red-300/60 text-xs">
                          Banned on {new Date(viewModal.banned_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm">Email</label>
                  <p className="text-white">{viewModal.email}</p>
                </div>
                
                {viewModal.bio && (
                  <div>
                    <label className="text-slate-400 text-sm">Bio</label>
                    <p className="text-white">{viewModal.bio}</p>
                  </div>
                )}
                
                {/* Bio Page Link */}
                <div className="border-t border-slate-700 pt-4">
                  <label className="text-slate-400 text-sm block mb-2">Bio Page</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-white font-mono text-sm">/{viewModal.username}</p>
                        {viewModal.is_published ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs font-semibold flex items-center gap-1">
                            <i className="fas fa-check-circle"></i>
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-600/50 text-slate-400 rounded text-xs font-semibold flex items-center gap-1">
                            <i className="fas fa-eye-slash"></i>
                            Not Published
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs">
                        {viewModal.is_published 
                          ? 'This bio page is live and publicly accessible' 
                          : 'This bio page is not yet published'
                        }
                      </p>
                    </div>
                    <a
                      href={`/${viewModal.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 font-semibold"
                    >
                      <i className="fas fa-external-link-alt"></i>
                      Visit Page
                    </a>
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-400 text-sm">User ID</label>
                  <p className="text-white font-mono text-sm">{viewModal.id}</p>
                </div>
                
                <div>
                  <label className="text-slate-400 text-sm">Joined</label>
                  <p className="text-white">{new Date(viewModal.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-purple-500/30 max-w-2xl w-full">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Edit User</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="text-slate-400 text-sm block mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="User's full name"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm block mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm block mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  rows={3}
                  placeholder="User bio"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPremium}
                    onChange={(e) => setFormData({...formData, isPremium: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-white">Premium User</span>
                </label>
              </div>

              {formData.isPremium && (
                <div>
                  <label className="text-slate-400 text-sm block mb-2">Premium Plan</label>
                  <select
                    value={formData.premiumPlanType}
                    onChange={(e) => setFormData({...formData, premiumPlanType: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="monthly">Monthly ($3.99/mo)</option>
                    <option value="lifetime">Lifetime ($14.99)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => setEditModal(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-red-500/30 max-w-md w-full">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-exclamation-triangle text-red-400"></i>
                Delete User
              </h3>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <p className="text-slate-300 mb-4">
                Are you sure you want to delete <strong className="text-white">{deleteModal.name || deleteModal.username}</strong>?
              </p>
              <p className="text-slate-400 text-sm">
                This will permanently delete:
              </p>
              <ul className="text-slate-400 text-sm list-disc list-inside mt-2 space-y-1">
                <li>User profile and account</li>
                <li>All bio links</li>
                <li>All social links</li>
              </ul>
              <p className="text-red-400 text-sm mt-4 font-semibold">
                This action cannot be undone!
              </p>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-purple-500/30 max-w-2xl w-full">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Add New User</h3>
              <button onClick={() => setAddModal(false)} className="text-slate-400 hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="text-slate-400 text-sm block mb-2">Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm block mb-2">Username <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm block mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm block mb-2">Password <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Minimum 6 characters"
                />
                <p className="text-slate-500 text-xs mt-1">User will login with this password</p>
              </div>

              <div>
                <label className="text-slate-400 text-sm block mb-2">Confirm Password <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Re-enter password"
                />
              </div>

              <div className="border-t border-slate-700 pt-4">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={formData.isVerified}
                    onChange={(e) => setFormData({...formData, isVerified: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-white">Verified User</span>
                  <span className="text-slate-400 text-xs">(User can login immediately)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPremium}
                    onChange={(e) => setFormData({...formData, isPremium: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-white">Premium User</span>
                </label>
              </div>

              {formData.isPremium && (
                <div>
                  <label className="text-slate-400 text-sm block mb-2">Premium Plan</label>
                  <select
                    value={formData.premiumPlanType}
                    onChange={(e) => setFormData({...formData, premiumPlanType: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="monthly">Monthly ($3.99/mo)</option>
                    <option value="lifetime">Lifetime ($14.99)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => setAddModal(false)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitAdd}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-orange-500/30 max-w-md w-full">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-ban text-orange-400"></i>
                Ban User
              </h3>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <p className="text-slate-300 mb-4">
                Are you sure you want to ban <strong className="text-white">{banModal.name || banModal.username}</strong>?
              </p>
              
              <div className="bg-slate-800/50 p-4 rounded-lg mb-4">
                <p className="text-white font-semibold">{banModal.name || banModal.username}</p>
                <p className="text-slate-400 text-sm">{banModal.email}</p>
                <p className="text-slate-400 text-sm">@{banModal.username}</p>
              </div>

              <div className="mb-4">
                <label className="text-slate-400 text-sm block mb-2">Ban Reason (shown to user)</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none resize-none"
                  rows={4}
                  placeholder="Your account has been banned. Please contact support for more information."
                />
                <p className="text-slate-500 text-xs mt-2">This message will be displayed when the user tries to login</p>
              </div>
              
              <p className="text-orange-400 text-sm font-semibold">
                ⚠️ The user will be immediately logged out and cannot access their account until unbanned.
              </p>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => setBanModal(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmBan}
                disabled={saving}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Banning...
                  </>
                ) : (
                  <>
                    <i className="fas fa-ban"></i>
                    Ban User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Modal */}
      {unbanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-green-500/30 max-w-md w-full">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-unlock text-green-400"></i>
                Unban User
              </h3>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <p className="text-slate-300 mb-4">
                Are you sure you want to unban <strong className="text-white">{unbanModal.name || unbanModal.username}</strong>?
              </p>
              
              <div className="bg-slate-800/50 p-4 rounded-lg mb-4">
                <p className="text-white font-semibold">{unbanModal.name || unbanModal.username}</p>
                <p className="text-slate-400 text-sm">{unbanModal.email}</p>
                <p className="text-slate-400 text-sm">@{unbanModal.username}</p>
                {unbanModal.ban_reason && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-slate-500 text-xs mb-1">Current ban reason:</p>
                    <p className="text-red-300 text-sm">{unbanModal.ban_reason}</p>
                  </div>
                )}
              </div>
              
              <p className="text-green-400 text-sm font-semibold">
                ✓ The user will be able to login and access their account immediately.
              </p>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => setUnbanModal(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnban}
                disabled={saving}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Unbanning...
                  </>
                ) : (
                  <>
                    <i className="fas fa-unlock"></i>
                    Unban User
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
