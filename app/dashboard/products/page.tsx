'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';
import Link from 'next/link';
import Image from 'next/image';
import PremiumGate from '../components/PremiumGate';
import FileUpload from '@/components/FileUpload';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  product_type: 'physical' | 'digital';
  quantity: number | null;
  is_active: boolean;
  created_at: string;
}

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    productType: 'physical',
    quantity: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        setShowProducts(user.showProducts || false);
        setProfileImage(user.profileImage || '');
        setDisplayName(user.name || user.username || 'User');
      }

      // Load products
      const productsRes = await fetch('/api/products');
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShowProducts = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showProducts: !showProducts })
      });

      if (response.ok) {
        setShowProducts(!showProducts);
        setSuccess('Product visibility updated');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error toggling products:', error);
      setError('Failed to update visibility');
    }
  };

  const handleAddProduct = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image: '',
      productType: 'physical',
      quantity: ''
    });
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image: product.image || '',
      productType: product.product_type,
      quantity: product.quantity !== null ? product.quantity.toString() : ''
    });
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = editingProduct 
        ? `/api/products/${editingProduct.id}` 
        : '/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          image: formData.image || null,
          productType: formData.productType,
          quantity: formData.quantity ? parseInt(formData.quantity) : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setShowAddModal(false);
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Product deleted');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.is_active })
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error toggling product:', error);
    }
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
    <PremiumGate featureName="Products">
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
            <Link href="/dashboard/products" className={`${styles.navItem} ${styles.navItemActive}`}>
              <i className="fas fa-box"></i>
              <span>Products</span>
            </Link>
            <Link href="/dashboard/payments" className={styles.navItem}>
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
                <i className="fas fa-box"></i>
                <span>Products</span>
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
              <h1 className="text-4xl font-bold text-white mb-2">Products</h1>
              <p className="text-slate-400">Sell physical or digital products on your bio page</p>
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

            {/* Toggle Products Visibility */}
            <div className="mb-6 p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">Show Products on Bio Page</h3>
                  <p className="text-slate-400 text-sm">Display your products to visitors</p>
                </div>
                <button
                  onClick={handleToggleShowProducts}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    showProducts ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      showProducts ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Products List */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your Products</h2>
              <button
                onClick={handleAddProduct}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Add Product
              </button>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
              {products.length === 0 ? (
                <div className="p-12 text-center">
                  <i className="fas fa-box text-slate-600 text-6xl mb-4"></i>
                  <h3 className="text-2xl font-bold text-white mb-2">No Products Yet</h3>
                  <p className="text-slate-400 mb-6">Start selling by adding your first product</p>
                  <button
                    onClick={handleAddProduct}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-purple-500/50 transition-all"
                    >
                      {product.image && (
                        <div className="aspect-video bg-slate-800 relative">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-white font-semibold text-lg">{product.name}</h3>
                          <button
                            onClick={() => handleToggleActive(product)}
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              product.is_active
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                        
                        {product.description && (
                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-purple-400 font-bold text-xl">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            product.product_type === 'digital'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-orange-500/20 text-orange-300'
                          }`}>
                            {product.product_type}
                          </span>
                        </div>

                        {product.quantity !== null && (
                          <p className="text-slate-400 text-sm mb-3">
                            <i className="fas fa-box mr-1"></i>
                            {product.quantity} in stock
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-all"
                          >
                            <i className="fas fa-edit mr-1"></i>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-semibold transition-all"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <i className="fas fa-box text-purple-400"></i>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Premium eBook"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe your product..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="19.99"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                    required
                  />
                </div>

                {/* Product Image Upload */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Product Image
                  </label>
                  <FileUpload
                    uploadType="product"
                    currentImage={formData.image}
                    onUploadComplete={(url) => setFormData({...formData, image: url})}
                    buttonText="Upload Product Image"
                    showPreview={true}
                  />
                </div>

                {/* Product Type */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Product Type *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        value="physical"
                        checked={formData.productType === 'physical'}
                        onChange={(e) => setFormData({...formData, productType: 'physical'})}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all ${
                        formData.productType === 'physical'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-700 bg-slate-900'
                      }`}>
                        <i className="fas fa-box text-2xl mb-2"></i>
                        <h4 className="text-white font-semibold">Physical</h4>
                        <p className="text-slate-400 text-sm">Requires shipping</p>
                      </div>
                    </label>

                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        value="digital"
                        checked={formData.productType === 'digital'}
                        onChange={(e) => setFormData({...formData, productType: 'digital'})}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all ${
                        formData.productType === 'digital'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-700 bg-slate-900'
                      }`}>
                        <i className="fas fa-download text-2xl mb-2"></i>
                        <h4 className="text-white font-semibold">Digital</h4>
                        <p className="text-slate-400 text-sm">Instant delivery</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Quantity (leave empty for unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
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
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check mr-2"></i>
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PremiumGate>
  );
}

