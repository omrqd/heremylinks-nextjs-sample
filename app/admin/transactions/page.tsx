'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Transaction {
  id: string;
  email: string;
  plan_type: string;
  amount: number;
  currency: string;
  status: string;
  event_type: string | null;
  external_id: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    profile_image: string | null;
  } | null;
  paymentGateway: string;
}

export default function AdminTransactions() {
  const { status } = useSession();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const perPage = 10;
  
  // Modals
  const [viewModal, setViewModal] = useState<Transaction | null>(null);
  const [deleteModal, setDeleteModal] = useState<Transaction | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load transactions when filters change
  useEffect(() => {
    if (status === 'authenticated') {
      loadTransactions();
    }
  }, [status, currentPage, searchDebounce, statusFilter, gatewayFilter, dateFrom, dateTo]);

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: perPage.toString(),
        ...(searchDebounce && { search: searchDebounce }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(gatewayFilter !== 'all' && { gateway: gatewayFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      
      const response = await fetch(`/api/admin/transactions?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setTotalPages(data.pagination.totalPages);
        setTotalTransactions(data.pagination.total);
      } else if (response.status === 403) {
        router.push('/admin');
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (transaction: Transaction) => {
    setViewModal(transaction);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeleteModal(transaction);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/transactions/${deleteModal.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteModal(null);
        loadTransactions();
      } else {
        setError(data.error || 'Failed to delete transaction');
      }
    } catch (error) {
      setError('Failed to delete transaction');
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setGatewayFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'refunded':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getGatewayIcon = (gateway: string) => {
    switch (gateway.toLowerCase()) {
      case 'stripe':
        return 'fab fa-stripe';
      case 'paypal':
        return 'fab fa-paypal';
      default:
        return 'fas fa-credit-card';
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
              <p className="text-purple-300 text-xs">Transactions</p>
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
            
            <Link href="/admin/transactions" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all">
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
          <h1 className="text-4xl font-bold text-white mb-2">Transaction Management</h1>
          <p className="text-purple-300">View and manage all payment transactions</p>
        </header>

        {/* Search and Filters */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                placeholder="Search by email or transaction ID..."
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

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="succeeded">Succeeded</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Gateway Filter */}
            <div>
              <select
                value={gatewayFilter}
                onChange={(e) => setGatewayFilter(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Gateways</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 text-sm block mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="text-slate-400 text-sm block mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-redo"></i>
                Clear Filters
              </button>
            </div>
          </div>
          
          {(searchDebounce || statusFilter !== 'all' || gatewayFilter !== 'all' || dateFrom || dateTo) && (
            <p className="text-slate-400 text-sm mt-3">
              Found {totalTransactions} transaction{totalTransactions !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <i className="fas fa-exclamation-circle text-red-400"></i>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-slate-400">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-receipt text-slate-600 text-5xl mb-4"></i>
              <p className="text-slate-400 text-lg">No transactions found</p>
              {(searchDebounce || statusFilter !== 'all') && (
                <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-semibold">User</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Amount</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Plan</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Gateway</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Status</th>
                    <th className="text-left p-4 text-slate-400 font-semibold">Date</th>
                    <th className="text-right p-4 text-slate-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-slate-700/50 hover:bg-slate-900/30 transition-all">
                      <td className="p-4">
                        {transaction.user ? (
                          <div className="flex items-center gap-3">
                            {transaction.user.profile_image ? (
                              <img 
                                src={transaction.user.profile_image} 
                                alt={transaction.user.name || transaction.user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {(transaction.user.name || transaction.user.username || transaction.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="text-white font-semibold block">{transaction.user.name || transaction.user.username}</span>
                              <span className="text-slate-400 text-sm">{transaction.email}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                              {transaction.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-slate-400 text-sm">{transaction.email}</span>
                              <span className="text-slate-500 text-xs block">User not found</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-white font-bold text-lg">
                          ${transaction.amount.toFixed(2)}
                        </span>
                        <span className="text-slate-400 text-sm ml-1">{transaction.currency.toUpperCase()}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-300 capitalize">{transaction.plan_type}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <i className={`${getGatewayIcon(transaction.paymentGateway)} text-purple-400`}></i>
                          <span className="text-slate-300">{transaction.paymentGateway}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadge(transaction.status)}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(transaction.created_at).toLocaleDateString()}
                        <span className="text-slate-500 text-xs block">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleView(transaction)}
                            className="p-2 hover:bg-slate-700 rounded-lg text-blue-400 transition-all" 
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            onClick={() => handleDelete(transaction)}
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
                  Showing {((currentPage - 1) * perPage) + 1}-{Math.min(currentPage * perPage, totalTransactions)} of {totalTransactions} transactions
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
              <h3 className="text-2xl font-bold text-white">Transaction Details</h3>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Info */}
              {viewModal.user && (
                <div>
                  <h4 className="text-slate-400 text-sm mb-3">Customer Information</h4>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    {viewModal.user.profile_image ? (
                      <img 
                        src={viewModal.user.profile_image} 
                        alt={viewModal.user.name || viewModal.user.username}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                        {(viewModal.user.name || viewModal.user.username || viewModal.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-bold text-lg">{viewModal.user.name || viewModal.user.username}</p>
                      <p className="text-slate-400">@{viewModal.user.username}</p>
                      <p className="text-slate-400 text-sm">{viewModal.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div>
                <h4 className="text-slate-400 text-sm mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Amount</p>
                    <p className="text-white font-bold text-2xl">
                      ${viewModal.amount.toFixed(2)} {viewModal.currency.toUpperCase()}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Plan Type</p>
                    <p className="text-white font-semibold text-lg capitalize">{viewModal.plan_type}</p>
                  </div>
                  
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Payment Gateway</p>
                    <div className="flex items-center gap-2">
                      <i className={`${getGatewayIcon(viewModal.paymentGateway)} text-purple-400 text-xl`}></i>
                      <p className="text-white font-semibold">{viewModal.paymentGateway}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadge(viewModal.status)}`}>
                      {viewModal.status.charAt(0).toUpperCase() + viewModal.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div>
                <h4 className="text-slate-400 text-sm mb-3">Transaction Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-slate-800/30 rounded">
                    <span className="text-slate-400">Transaction ID</span>
                    <span className="text-white font-mono text-sm">{viewModal.id}</span>
                  </div>
                  
                  <div className="flex justify-between p-3 bg-slate-800/30 rounded">
                    <span className="text-slate-400">External ID</span>
                    <span className="text-white font-mono text-sm">{viewModal.external_id}</span>
                  </div>
                  
                  {viewModal.event_type && (
                    <div className="flex justify-between p-3 bg-slate-800/30 rounded">
                      <span className="text-slate-400">Event Type</span>
                      <span className="text-white text-sm">{viewModal.event_type}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between p-3 bg-slate-800/30 rounded">
                    <span className="text-slate-400">Transaction Date</span>
                    <span className="text-white">{new Date(viewModal.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setViewModal(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all"
              >
                Close
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
                Delete Transaction
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
                Are you sure you want to delete this transaction?
              </p>
              
              <div className="bg-slate-800/50 p-4 rounded-lg mb-4">
                <p className="text-white font-semibold">${deleteModal.amount.toFixed(2)} {deleteModal.currency.toUpperCase()}</p>
                <p className="text-slate-400 text-sm">{deleteModal.email}</p>
                <p className="text-slate-400 text-sm">{new Date(deleteModal.created_at).toLocaleString()}</p>
              </div>
              
              <p className="text-red-400 text-sm font-semibold">
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
                {saving ? 'Deleting...' : 'Delete Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

