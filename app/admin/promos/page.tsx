'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PromoCode {
  id: string;
  code: string;
  premium_duration_days: number;
  max_redemptions: number | null;
  current_redemptions: number;
  assigned_user_id: string | null;
  created_by: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  creator: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  assigned_user: {
    id: string;
    name: string;
    username: string;
    email: string;
  } | null;
}

export default function AdminPromosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [code, setCode] = useState('');
  const [premiumDurationDays, setPremiumDurationDays] = useState(30);
  const [maxRedemptions, setMaxRedemptions] = useState<number | null>(null);
  const [assignedUserEmail, setAssignedUserEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [redemptionType, setRedemptionType] = useState<'infinite' | 'limited'>('infinite');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadPromoCodes();
    }
  }, [status, router]);

  const loadPromoCodes = async () => {
    try {
      const response = await fetch('/api/admin/promos');
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.promoCodes || []);
      } else {
        setError('Failed to load promo codes');
      }
    } catch (error) {
      console.error('Error loading promo codes:', error);
      setError('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // If user email is provided, get user ID
      let assignedUserId = null;
      if (assignedUserEmail.trim()) {
        const userResponse = await fetch(`/api/admin/users?search=${encodeURIComponent(assignedUserEmail)}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const user = userData.users?.find((u: any) => 
            u.email.toLowerCase() === assignedUserEmail.toLowerCase()
          );
          if (user) {
            assignedUserId = user.id;
          } else {
            setError('User not found with that email');
            setSaving(false);
            return;
          }
        }
      }

      const promoResponse = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          premiumDurationDays,
          maxRedemptions: redemptionType === 'infinite' ? null : maxRedemptions,
          assignedUserId,
          expiresAt: expiresAt || null
        })
      });

      const data = await promoResponse.json();

      if (promoResponse.ok) {
        setSuccess(data.message);
        loadPromoCodes();
        setShowModal(false);
        resetForm();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to create promo code');
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      setError('Failed to create promo code');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromoCode = async (id: string, code: string) => {
    if (!confirm(`Delete promo code "${code}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/promos/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Promo code deleted successfully');
        loadPromoCodes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete promo code');
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      setError('Failed to delete promo code');
    }
  };

  const resetForm = () => {
    setCode('');
    setPremiumDurationDays(30);
    setMaxRedemptions(null);
    setAssignedUserEmail('');
    setExpiresAt('');
    setRedemptionType('infinite');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              <p className="text-purple-300 text-xs">Promo Management</p>
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
            
            <Link href="/admin/emails" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
              <i className="fas fa-envelope w-5"></i>
              <span>Emails</span>
            </Link>
            
            <Link href="/admin/promos" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all">
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
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Promo Code Management</h1>
              <p className="text-purple-300">Create and manage promotional codes for premium subscriptions</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Create Promo Code
            </button>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300 flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-300 flex items-center gap-2">
            <i className="fas fa-check-circle"></i>
            {success}
          </div>
        )}

        {/* Promo Codes List */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
          {promoCodes.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-ticket-alt text-6xl text-slate-600 mb-4"></i>
              <h3 className="text-2xl font-bold text-white mb-2">No Promo Codes Yet</h3>
              <p className="text-slate-400 mb-6">Create your first promo code to get started</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Promo Code
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-semibold">Code</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Duration</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Redemptions</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Assigned To</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Status</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Created</th>
                    <th className="text-right p-4 text-slate-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((promo) => (
                    <tr key={promo.id} className="border-b border-slate-700/50 hover:bg-slate-900/30 transition-all">
                      <td className="p-4">
                        <div className="font-mono text-lg font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg inline-block">
                          {promo.code}
                        </div>
                      </td>
                      <td className="p-4 text-white">
                        {promo.premium_duration_days} {promo.premium_duration_days === 1 ? 'day' : 'days'}
                      </td>
                      <td className="p-4">
                        <div className="text-white font-semibold">
                          {promo.current_redemptions} / {promo.max_redemptions || '∞'}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {promo.max_redemptions 
                            ? `${promo.max_redemptions - promo.current_redemptions} remaining`
                            : 'Unlimited'}
                        </div>
                      </td>
                      <td className="p-4">
                        {promo.assigned_user ? (
                          <div>
                            <div className="text-white font-semibold">{promo.assigned_user.name || promo.assigned_user.username}</div>
                            <div className="text-xs text-slate-400">{promo.assigned_user.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Anyone</span>
                        )}
                      </td>
                      <td className="p-4">
                        {promo.is_active ? (
                          promo.expires_at && new Date(promo.expires_at) < new Date() ? (
                            <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-semibold">
                              Expired
                            </span>
                          ) : promo.max_redemptions && promo.current_redemptions >= promo.max_redemptions ? (
                            <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm font-semibold">
                              Used Up
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold">
                              Active
                            </span>
                          )
                        ) : (
                          <span className="px-3 py-1 bg-slate-500/20 text-slate-300 rounded-full text-sm font-semibold">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        <div>{formatDate(promo.created_at)}</div>
                        <div className="text-xs text-slate-500">by {promo.creator.name || promo.creator.username}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDeletePromoCode(promo.id, promo.code)}
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
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <i className="fas fa-plus-circle text-purple-400"></i>
                  Create New Promo Code
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleCreatePromoCode} className="p-6 space-y-6">
                {/* Code */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SUMMER2025"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all font-mono text-lg"
                    required
                  />
                  <p className="text-slate-400 text-sm mt-1">
                    Letters and numbers only, will be converted to uppercase
                  </p>
                </div>

                {/* Premium Duration */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Premium Duration *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={premiumDurationDays}
                      onChange={(e) => setPremiumDurationDays(parseInt(e.target.value))}
                      min="1"
                      className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                      required
                    />
                    <span className="text-white font-semibold">days</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[1, 7, 30, 90, 365].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setPremiumDurationDays(days)}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-all"
                      >
                        {days === 1 ? '1 day' : days === 7 ? '1 week' : days === 30 ? '1 month' : days === 90 ? '3 months' : '1 year'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Redemption Type */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Redemption Limit
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="redemptionType"
                        checked={redemptionType === 'infinite'}
                        onChange={() => setRedemptionType('infinite')}
                        className="w-4 h-4"
                      />
                      <span className="text-white">Unlimited</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="redemptionType"
                        checked={redemptionType === 'limited'}
                        onChange={() => setRedemptionType('limited')}
                        className="w-4 h-4"
                      />
                      <span className="text-white">Limited</span>
                    </label>
                  </div>
                  {redemptionType === 'limited' && (
                    <input
                      type="number"
                      value={maxRedemptions || ''}
                      onChange={(e) => setMaxRedemptions(parseInt(e.target.value) || null)}
                      min="1"
                      placeholder="Max redemptions"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                    />
                  )}
                </div>

                {/* Assigned User */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Assign to Specific User (Optional)
                  </label>
                  <input
                    type="email"
                    value={assignedUserEmail}
                    onChange={(e) => setAssignedUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  />
                  <p className="text-slate-400 text-sm mt-1">
                    Leave empty to allow anyone to use this code
                  </p>
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check mr-2"></i>
                        Create Promo Code
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

