'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Admin {
  id: string;
  username: string;
  email: string;
  name: string | null;
  profile_image: string | null;
  admin_role: string;
  admin_permissions: string[];
  admin_created_at: string;
  creator: {
    name: string | null;
    username: string;
  } | null;
}

interface User {
  id: string;
  username: string;
  email: string;
  name: string | null;
  is_admin: boolean;
}

const ADMIN_ROLES = {
  master_admin: {
    label: 'Master Admin',
    description: 'Full access to everything',
    color: 'purple'
  },
  user_manager: {
    label: 'User Manager',
    description: 'Can manage users and view analytics',
    color: 'blue'
  },
  payment_manager: {
    label: 'Payment Manager',
    description: 'Can view payments and transactions',
    color: 'green'
  },
  notification_manager: {
    label: 'Notification Manager',
    description: 'Can send notifications and emails',
    color: 'yellow'
  },
  content_manager: {
    label: 'Content Manager',
    description: 'Can manage site content',
    color: 'pink'
  },
  analytics_viewer: {
    label: 'Analytics Viewer',
    description: 'Can view analytics only',
    color: 'cyan'
  }
};

const PERMISSIONS = [
  { id: 'view_users', label: 'View Users', icon: 'users' },
  { id: 'manage_users', label: 'Manage Users', icon: 'user-edit' },
  { id: 'ban_users', label: 'Ban Users', icon: 'user-slash' },
  { id: 'view_transactions', label: 'View Transactions', icon: 'credit-card' },
  { id: 'manage_payments', label: 'Manage Payments', icon: 'dollar-sign' },
  { id: 'send_notifications', label: 'Send Notifications', icon: 'bell' },
  { id: 'send_emails', label: 'Send Emails', icon: 'envelope' },
  { id: 'view_analytics', label: 'View Analytics', icon: 'chart-line' },
  { id: 'manage_content', label: 'Manage Content', icon: 'file-alt' },
  { id: 'view_logs', label: 'View Logs', icon: 'history' }
];

export default function AdminsPage() {
  const { status } = useSession();
  const router = useRouter();
  
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  
  // Form state
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserObject, setSelectedUserObject] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('user_manager');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  // Search users as user types
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300); // Debounce for 300ms
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/admins');
      if (response.ok) {
        const data = await response.json();
        
        // Ensure admin_permissions is always an array for each admin
        const formattedAdmins = (data.admins || []).map((admin: any) => {
          let permissions: string[] = [];
          
          if (admin.admin_permissions) {
            if (Array.isArray(admin.admin_permissions)) {
              permissions = admin.admin_permissions;
            } else if (typeof admin.admin_permissions === 'string') {
              try {
                permissions = JSON.parse(admin.admin_permissions);
              } catch (e) {
                console.error('Error parsing permissions for admin:', admin.email, e);
                permissions = [];
              }
            }
          }
          
          return {
            ...admin,
            admin_permissions: permissions
          };
        });
        
        setAdmins(formattedAdmins);
      } else if (response.status === 403) {
        setError('You need master admin access to view this page');
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      setError('Failed to load admins');
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
        // Filter out users who are already admins
        const nonAdminUsers = (data.users || []).filter((u: User) => !u.is_admin);
        setSearchResults(nonAdminUsers);
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

  const handleAddAdmin = async () => {
    if (!selectedUser || !selectedRole) {
      setError('Please select a user and role');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          adminRole: selectedRole,
          permissions: selectedPermissions
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setShowAddModal(false);
        clearUserSelection();
        setSelectedRole('user_manager');
        setSelectedPermissions([]);
        loadAdmins();
      } else {
        setError(data.error || 'Failed to add admin');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      setError('Failed to add admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin || !selectedRole) {
      setError('Invalid admin or role');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminRole: selectedRole,
          permissions: selectedPermissions
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setShowEditModal(false);
        setSelectedAdmin(null);
        loadAdmins();
      } else {
        setError(data.error || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      setError('Failed to update admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (admin: Admin) => {
    if (!confirm(`Are you sure you want to remove admin access from ${admin.name || admin.username}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/admins/${admin.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        loadAdmins();
      } else {
        setError(data.error || 'Failed to remove admin');
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      setError('Failed to remove admin');
    }
  };

  const openEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setSelectedRole(admin.admin_role);
    
    // Ensure permissions is always an array
    let permissions: string[] = [];
    if (admin.admin_permissions) {
      if (Array.isArray(admin.admin_permissions)) {
        permissions = admin.admin_permissions;
      } else if (typeof admin.admin_permissions === 'string') {
        try {
          permissions = JSON.parse(admin.admin_permissions);
        } catch (e) {
          console.error('Error parsing permissions:', e);
          permissions = [];
        }
      }
    }
    
    setSelectedPermissions(permissions);
    setShowEditModal(true);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
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
              <p className="text-purple-300 text-xs">Admin Management</p>
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
            
            <Link href="/admin/admins" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all">
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
            <h1 className="text-4xl font-bold text-white mb-2">Admin Management</h1>
            <p className="text-purple-300">Manage admin roles and permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
          >
            <i className="fas fa-user-plus"></i>
            Add Admin
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

        {/* Admins List */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
          <div className="p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Current Admins</h2>
                <p className="text-slate-400 text-sm mt-1">Users with administrative access</p>
              </div>
              <div className="text-slate-400">
                <span className="text-2xl font-bold text-white">{admins.length}</span> total
              </div>
            </div>
          </div>

          {admins.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-user-shield text-slate-600 text-5xl mb-4"></i>
              <p className="text-slate-400 text-lg mb-2">No admins found</p>
              <p className="text-slate-500 text-sm">Click "Add Admin" to grant admin access to a user</p>
            </div>
          ) : (
            <div className="divide-y divide-purple-500/10">
              {admins.map((admin) => (
                <div key={admin.id} className="p-6 hover:bg-slate-800/30 transition-all">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {admin.profile_image ? (
                        <img
                          src={admin.profile_image}
                          alt={admin.name || admin.username}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                          {(admin.name || admin.username)?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg mb-1">
                            {admin.name || admin.username}
                          </h3>
                          <p className="text-slate-400 text-sm">{admin.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all flex items-center gap-2"
                          >
                            <i className="fas fa-edit"></i>
                            Edit
                          </button>
                          {admin.admin_role !== 'master_admin' && (
                            <button
                              onClick={() => handleRemoveAdmin(admin)}
                              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all flex items-center gap-2"
                            >
                              <i className="fas fa-trash"></i>
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Role Badge */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          admin.admin_role === 'master_admin' ? 'bg-purple-500/20 text-purple-300' :
                          admin.admin_role === 'user_manager' ? 'bg-blue-500/20 text-blue-300' :
                          admin.admin_role === 'payment_manager' ? 'bg-green-500/20 text-green-300' :
                          admin.admin_role === 'notification_manager' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          <i className="fas fa-shield-alt mr-1"></i>
                          {ADMIN_ROLES[admin.admin_role as keyof typeof ADMIN_ROLES]?.label || admin.admin_role}
                        </span>
                      </div>

                      {/* Permissions */}
                      {Array.isArray(admin.admin_permissions) && admin.admin_permissions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {admin.admin_permissions.map((perm: string) => {
                            const permission = PERMISSIONS.find(p => p.id === perm);
                            return permission ? (
                              <span key={perm} className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs">
                                <i className={`fas fa-${permission.icon} mr-1`}></i>
                                {permission.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>
                          <i className="fas fa-calendar mr-1"></i>
                          Added {new Date(admin.admin_created_at).toLocaleDateString()}
                        </span>
                        {admin.creator && (
                          <span>
                            <i className="fas fa-user mr-1"></i>
                            by {admin.creator.name || admin.creator.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Add New Admin</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  clearUserSelection();
                  setSelectedRole('user_manager');
                  setSelectedPermissions([]);
                }}
                className="text-slate-400 hover:text-white"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Search User - Autocomplete */}
              <div>
                <label className="text-slate-300 font-semibold block mb-2">
                  Search User by Email or Name
                </label>
                
                {/* Selected User Display */}
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
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                        placeholder="Type at least 2 characters to search..."
                        className="w-full px-4 py-3 pr-10 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                      {searchLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <i className="fas fa-spinner fa-spin text-purple-400"></i>
                        </div>
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-purple-500/20 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => selectUser(user)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-all border-b border-slate-700/50 last:border-b-0"
                          >
                            <p className="text-white font-medium">
                              {user.name || user.username}
                            </p>
                            <p className="text-slate-400 text-sm">{user.email}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No Results */}
                    {showSearchResults && searchResults.length === 0 && !searchLoading && searchQuery.length >= 2 && (
                      <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-purple-500/20 rounded-lg shadow-xl p-4 text-center">
                        <p className="text-slate-400">No non-admin users found matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-slate-500 text-sm mt-1">
                  Search for a user who isn't already an admin
                </p>
              </div>

              {/* Select Role */}
              <div>
                <label className="text-slate-300 font-semibold block mb-3">Admin Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(ADMIN_ROLES).map(([role, info]) => (
                    <label key={role} className="cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="sr-only peer"
                      />
                      <div className="p-4 bg-slate-900/50 border-2 border-slate-700 rounded-lg peer-checked:border-purple-500 peer-checked:bg-purple-500/10 transition-all">
                        <p className="text-white font-semibold mb-1">{info.label}</p>
                        <p className="text-slate-400 text-xs">{info.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Select Permissions */}
              <div>
                <label className="text-slate-300 font-semibold block mb-3">Specific Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSIONS.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg cursor-pointer hover:border-purple-500/50 transition-all">
                      <input
                        type="checkbox"
                        checked={Array.isArray(selectedPermissions) && selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          <i className={`fas fa-${perm.icon} mr-2 text-purple-400`}></i>
                          {perm.label}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-purple-500/20 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUser('');
                  setSelectedRole('user_manager');
                  setSelectedPermissions([]);
                }}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={actionLoading || !selectedUser}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    Add Admin
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Edit Admin</h2>
                <p className="text-slate-400 text-sm mt-1">{selectedAdmin.name || selectedAdmin.username}</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAdmin(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Select Role */}
              <div>
                <label className="text-slate-300 font-semibold block mb-3">Admin Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(ADMIN_ROLES).map(([role, info]) => (
                    <label key={role} className="cursor-pointer">
                      <input
                        type="radio"
                        name="edit-role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="sr-only peer"
                      />
                      <div className="p-4 bg-slate-900/50 border-2 border-slate-700 rounded-lg peer-checked:border-purple-500 peer-checked:bg-purple-500/10 transition-all">
                        <p className="text-white font-semibold mb-1">{info.label}</p>
                        <p className="text-slate-400 text-xs">{info.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Select Permissions */}
              <div>
                <label className="text-slate-300 font-semibold block mb-3">Specific Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSIONS.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg cursor-pointer hover:border-purple-500/50 transition-all">
                      <input
                        type="checkbox"
                        checked={Array.isArray(selectedPermissions) && selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          <i className={`fas fa-${perm.icon} mr-2 text-purple-400`}></i>
                          {perm.label}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-purple-500/20 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAdmin(null);
                }}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAdmin}
                disabled={actionLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Changes
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

