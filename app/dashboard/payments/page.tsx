'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';
import Link from 'next/link';
import Image from 'next/image';
import PremiumGate from '../components/PremiumGate';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_address: string | null;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_id: string | null;
  created_at: string;
  order_items?: Array<{
    product_name: string;
    quantity: number;
    product_price: number;
    subtotal: number;
  }>;
}

interface PaymentConfig {
  paypal_email: string;
  paypal_username?: string;
  paypal_client_id: string;
  paypal_secret: string;
  is_active: boolean;
}

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Modal states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Form state for PayPal config
  const [formData, setFormData] = useState({
    paypalEmail: '',
    paypalUsername: '',
    paypalClientId: '',
    paypalSecret: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Calculate revenue stats
  const totalRevenue = orders.reduce((sum, order) => 
    order.status === 'completed' ? sum + order.total_amount : sum, 0
  );
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      // Load user profile
      const profileRes = await fetch('/api/user/profile');
      if (profileRes.ok) {
        const { user } = await profileRes.json();
        setIsPremium(user.isPremium || false);
        setProfileImage(user.profileImage || '');
        setDisplayName(user.name || user.username || 'User');
      }

      // Load orders
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }

      // Load payment config
      const configRes = await fetch('/api/payment-config');
      if (configRes.ok) {
        const data = await configRes.json();
        if (data.config) {
          setConfig(data.config);
          setFormData({
            paypalEmail: data.config.paypal_email || '',
            paypalUsername: data.config.paypal_username || '',
            paypalClientId: data.config.paypal_client_id || '',
            paypalSecret: data.config.paypal_secret || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfigModal = () => {
    if (config) {
      setFormData({
        paypalEmail: config.paypal_email || '',
        paypalUsername: config.paypal_username || '',
        paypalClientId: config.paypal_client_id || '',
        paypalSecret: config.paypal_secret || ''
      });
    }
    setShowConfigModal(true);
  };

  const handleSubmitConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypalEmail: formData.paypalEmail,
          paypalUsername: formData.paypalUsername,
          paypalClientId: formData.paypalClientId,
          paypalSecret: formData.paypalSecret
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Payment configuration saved successfully!');
        setShowConfigModal(false);
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, paymentId?: string) => {
    setUpdatingStatus(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, paymentId })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Order marked as ${newStatus}`);
        setTimeout(() => setSuccess(''), 3000);
        
        // Reload orders
        loadData();
        
        // Update selected order if modal is open
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
      } else {
        setError(data.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('An error occurred while updating order status');
    } finally {
      setUpdatingStatus(false);
    }
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

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: 'bg-green-500/20 text-green-300',
      pending: 'bg-yellow-500/20 text-yellow-300',
      cancelled: 'bg-red-500/20 text-red-300',
      refunded: 'bg-blue-500/20 text-blue-300'
    };
    
    return statusColors[status] || 'bg-slate-500/20 text-slate-300';
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.dashboardContainer}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PremiumGate featureName="Payments">
      <div className={styles.dashboardContainer}>
        {/* Sidebar */}
        <aside className={styles.leftSidebar}>
          <div className={styles.sidebarLogo}>
            <Image src="/imgs/white-logo.png" alt="HereMyLinks" width={100} height={25} priority />
            {isPremium && (
              <div className={styles.proBadge}>
                <span className={styles.proBadgeText}>PRO</span>
              </div>
            )}
          </div>
          <nav className={styles.sidebarNav}>
            <Link href="/dashboard" className={styles.navItem}>
              <i className="fas fa-user"></i>
              <span>Profile</span>
            </Link>
            <Link href="/dashboard/analytics" className={styles.navItem}>
              <i className="fas fa-chart-line"></i>
              <span>Analytics</span>
            </Link>
            <Link href="/dashboard/templates" className={styles.navItem}>
              <i className="fas fa-palette"></i>
              <span>Templates</span>
            </Link>
          </nav>
          <div className={styles.sidebarSection}>
            <div className={styles.sectionTitle}>MAKE MONEY</div>
            <Link href="/dashboard/products" className={styles.navItem}>
              <i className="fas fa-box"></i>
              <span>Products</span>
            </Link>
            <Link href="/dashboard/payments" className={`${styles.navItem} ${styles.navItemActive}`}>
              <i className="fas fa-credit-card"></i>
              <span>Payments</span>
            </Link>
          </div>
          <div className={styles.sidebarBottom}>
            <Link href="/dashboard/billing" className={styles.navItem}>
              <i className="fas fa-credit-card"></i>
              <span>Billing</span>
            </Link>
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={styles.navItem}
            >
              <i className="fas fa-ticket-alt"></i>
              <span>Promo Code</span>
            </button>
            <Link href="/dashboard/help" className={styles.navItem}>
              <i className="fas fa-question-circle"></i>
              <span>Help Center</span>
            </Link>
          </div>
        </aside>

        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.topBarTabs}>
              <button className={`${styles.topBarTab} ${styles.topBarTabActive}`}>
                <i className="fas fa-credit-card"></i>
                <span>Payments</span>
              </button>
            </div>
          </div>
          <div className={styles.topBarRight}>
            <div className={styles.dropdownWrapper}>
              <button 
                className={styles.topBarProfile}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                {profileImage ? (
                  <img src={profileImage} alt={displayName} className={styles.topBarAvatar} />
                ) : (
                  <div className={styles.topBarAvatarPlaceholder}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              
              {showProfileDropdown && (
                <>
                  <div 
                    className={styles.dropdownOverlay} 
                    onClick={() => setShowProfileDropdown(false)}
                  ></div>
                  <div className={styles.profileDropdown}>
                    <div className={styles.profileDropdownHeader}>
                      <div className={styles.profileDropdownAvatar}>
                        {profileImage ? (
                          <img src={profileImage} alt={displayName} />
                        ) : (
                          <div className={styles.profileDropdownAvatarPlaceholder}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={styles.profileDropdownInfo}>
                        <p className={styles.profileDropdownName}>{displayName}</p>
                        <p className={styles.profileDropdownEmail}>{session?.user?.email}</p>
                      </div>
                    </div>
                    <div className={styles.profileDropdownDivider}></div>
                    <button 
                      className={styles.profileDropdownItem}
                      onClick={() => {
                        setShowProfileDropdown(false);
                        router.push('/api/auth/signout');
                      }}
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.mainContentArea}>
          <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Payments & Revenue</h1>
              <p className="text-slate-400">Monitor your sales and configure payment methods</p>
            </div>

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

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-green-500/20 rounded-xl">
                    <i className="fas fa-dollar-sign text-3xl text-green-400"></i>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-white">${totalRevenue.toFixed(2)}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-500/20 rounded-xl">
                    <i className="fas fa-shopping-cart text-3xl text-blue-400"></i>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Completed Orders</p>
                    <h3 className="text-3xl font-bold text-white">{completedOrders}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-yellow-500/20 rounded-xl">
                    <i className="fas fa-clock text-3xl text-yellow-400"></i>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Pending Orders</p>
                    <h3 className="text-3xl font-bold text-white">{pendingOrders}</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* PayPal Configuration Card */}
            <div className="mb-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <i className="fab fa-paypal text-blue-400"></i>
                    PayPal Configuration
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Configure your PayPal account to receive payments</p>
                </div>
                <button
                  onClick={handleOpenConfigModal}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
                >
                  <i className="fas fa-cog"></i>
                  {config ? 'Update Configuration' : 'Setup PayPal'}
                </button>
              </div>

              {config && config.paypal_email ? (
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <i className="fas fa-check-circle text-green-400 text-xl"></i>
                    </div>
                    <div>
                      <p className="text-white font-semibold">PayPal Connected</p>
                      <p className="text-slate-400 text-sm">{config.paypal_email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
                    <div>
                      <p className="text-yellow-300 font-semibold">No PayPal Account Configured</p>
                      <p className="text-yellow-200/70 text-sm">Set up your PayPal to start receiving payments</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Orders Table */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold text-white">Recent Orders</h2>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center">
                  <i className="fas fa-shopping-bag text-slate-600 text-6xl mb-4"></i>
                  <h3 className="text-2xl font-bold text-white mb-2">No Orders Yet</h3>
                  <p className="text-slate-400">Orders from customers will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-slate-300">
                              {order.id.substring(0, 8)}...
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-semibold">{order.customer_name}</p>
                              <p className="text-slate-400 text-sm">{order.customer_email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-green-400">
                              ${order.total_amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all"
                            >
                              <i className="fas fa-eye mr-1"></i>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* PayPal Configuration Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <i className="fab fa-paypal text-blue-400"></i>
                  PayPal Configuration
                </h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmitConfig} className="p-6 space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-white font-semibold mb-2">
                    PayPal Email *
                  </label>
                  <input
                    type="email"
                    value={formData.paypalEmail}
                    onChange={(e) => setFormData({...formData, paypalEmail: e.target.value})}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                    required
                  />
                  <p className="text-slate-400 text-sm mt-2">
                    This is where you'll receive payments from customers
                  </p>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    PayPal.me Username *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">paypal.me/</span>
                    <input
                      type="text"
                      value={formData.paypalUsername}
                      onChange={(e) => setFormData({...formData, paypalUsername: e.target.value})}
                      placeholder="yourusername"
                      className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                      required
                    />
                  </div>
                  <p className="text-slate-400 text-sm mt-2">
                    <i className="fas fa-exclamation-circle text-yellow-400 mr-1"></i>
                    Your PayPal.me username (NOT your email). Get it from <a href="https://www.paypal.com/paypalme/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">paypal.com/paypalme</a>
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-blue-300 text-sm">
                    <i className="fas fa-info-circle mr-2"></i>
                    <strong>Optional:</strong> For advanced features, you can add your PayPal API credentials. This enables automatic payment processing and order management.
                  </p>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    PayPal Client ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.paypalClientId}
                    onChange={(e) => setFormData({...formData, paypalClientId: e.target.value})}
                    placeholder="Your PayPal Client ID"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    PayPal Secret (Optional)
                  </label>
                  <input
                    type="password"
                    value={formData.paypalSecret}
                    onChange={(e) => setFormData({...formData, paypalSecret: e.target.value})}
                    placeholder="Your PayPal Secret"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all font-mono text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check mr-2"></i>
                        Save Configuration
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <i className="fas fa-receipt text-purple-400"></i>
                  Order Details
                </h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Order ID</p>
                    <p className="text-white font-mono text-sm">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Date</p>
                    <p className="text-white">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Payment Method</p>
                    <p className="text-white capitalize">{selectedOrder.payment_method}</p>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-white font-semibold mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-slate-400 text-sm">Name</p>
                      <p className="text-white">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Email</p>
                      <p className="text-white">{selectedOrder.customer_email}</p>
                    </div>
                    {selectedOrder.customer_address && (
                      <div>
                        <p className="text-slate-400 text-sm">Shipping Address</p>
                        <p className="text-white whitespace-pre-line">{selectedOrder.customer_address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-white font-semibold mb-3">Order Items</h3>
                    <div className="space-y-2">
                      {selectedOrder.order_items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-slate-900/50 rounded-lg p-3">
                          <div>
                            <p className="text-white font-semibold">{item.product_name}</p>
                            <p className="text-slate-400 text-sm">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">${item.subtotal.toFixed(2)}</p>
                            <p className="text-slate-400 text-sm">${item.product_price.toFixed(2)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-700 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-green-400">${selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {selectedOrder.payment_id && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-300 text-sm">
                      <i className="fas fa-info-circle mr-2"></i>
                      <strong>Transaction ID:</strong> {selectedOrder.payment_id}
                    </p>
                  </div>
                )}

                {/* Order Actions */}
                {selectedOrder.status === 'pending' && (
                  <div className="border-t border-slate-700 pt-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                      <p className="text-yellow-300 text-sm flex items-start gap-2">
                        <i className="fas fa-exclamation-triangle mt-0.5"></i>
                        <span>
                          This order is awaiting payment confirmation. Once you verify that the payment has been received in your PayPal account, mark this order as completed.
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed', prompt('Enter PayPal Transaction ID (optional):') || undefined)}
                        disabled={updatingStatus}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingStatus ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Updating...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check-circle mr-2"></i>
                            Mark as Completed
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this order?')) {
                            handleUpdateOrderStatus(selectedOrder.id, 'cancelled');
                          }
                        }}
                        disabled={updatingStatus}
                        className="px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="fas fa-times-circle mr-2"></i>
                        Cancel Order
                      </button>
                    </div>
                  </div>
                )}

                {selectedOrder.status === 'completed' && (
                  <div className="border-t border-slate-700 pt-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                      <p className="text-green-300 text-sm flex items-center gap-2">
                        <i className="fas fa-check-circle"></i>
                        <span>This order has been completed and payment confirmed.</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to refund this order? This will restore product quantities.')) {
                          handleUpdateOrderStatus(selectedOrder.id, 'refunded');
                        }
                      }}
                      disabled={updatingStatus}
                      className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingStatus ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-undo mr-2"></i>
                          Issue Refund
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PremiumGate>
  );
}

