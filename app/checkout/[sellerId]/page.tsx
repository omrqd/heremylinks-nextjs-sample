'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from './checkout.module.css';

interface CartItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  product_type: string;
  cartQuantity: number;
}

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sellerId = params.sellerId as string;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirectingToPaypal, setRedirectingToPaypal] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [sellerPaypalUsername, setSellerPaypalUsername] = useState('');
  const [sellerPaypalEmail, setSellerPaypalEmail] = useState('');
  
  // Customer form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    // Load cart from URL params
    const cartParam = searchParams.get('cart');
    if (cartParam) {
      try {
        const cartData = JSON.parse(decodeURIComponent(cartParam));
        setCart(cartData);
      } catch (err) {
        console.error('Error parsing cart:', err);
        setError('Invalid cart data');
      }
    }
  }, [searchParams]);

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0);
  };

  const hasPhysicalProducts = cart.some(item => item.product_type === 'physical');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (hasPhysicalProducts && !formData.address.trim()) {
      setError('Please enter your shipping address');
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        sellerUserId: sellerId,
        products: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.cartQuantity,
          price: item.price
        })),
        customerName: formData.name,
        customerEmail: formData.email,
        customerAddress: hasPhysicalProducts ? formData.address : null,
        paymentMethod: 'paypal'
      };

      // Create order
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (response.ok) {
        setOrderId(data.order.id);
        setSellerPaypalUsername(data.order.sellerPaypalUsername);
        setSellerPaypalEmail(data.order.sellerPaypalEmail);
        
        // Check if seller has PayPal.me configured
        if (!data.order.sellerPaypalUsername) {
          setError('Seller has not configured their PayPal.me username. Please contact the seller.');
          return;
        }

        // Redirect to PayPal
        setRedirectingToPaypal(true);
        
        // Build PayPal payment URL
        const paypalUrl = buildPayPalUrl(
          data.order.sellerPaypalUsername,
          data.order.totalAmount,
          data.order.id,
          formData.name,
          formData.email
        );
        
        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = paypalUrl;
        }, 2000);
      } else {
        setError(data.error || 'Checkout failed. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('An error occurred during checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Build PayPal.me URL for payment
  const buildPayPalUrl = (
    paypalUsername: string,
    amount: number,
    orderId: string,
    customerName: string,
    customerEmail: string
  ) => {
    // PayPal.me URL format: https://www.paypal.me/username/amount
    // Note: This is a simple redirect. For production, use PayPal SDK
    const baseUrl = `https://www.paypal.me/${paypalUsername}/${amount.toFixed(2)}`;
    
    // Add note in URL parameters
    const note = encodeURIComponent(`Order #${orderId.substring(0, 8)} - ${customerName}`);
    
    return `${baseUrl}?locale.x=en_US&note=${note}`;
  };

  if (redirectingToPaypal) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.redirectIcon}>
            <i className="fab fa-paypal"></i>
          </div>
          <h1 className={styles.successTitle}>Redirecting to PayPal...</h1>
          <p className={styles.successMessage}>
            Please wait while we redirect you to PayPal to complete your payment.
          </p>
          <div className={styles.loadingBar}>
            <div className={styles.loadingProgress}></div>
          </div>
          <p className={styles.successMessage} style={{ fontSize: '14px', marginTop: '20px', color: '#6b7280' }}>
            <strong>Order ID:</strong> {orderId.substring(0, 8).toUpperCase()}
            <br />
            <strong>Amount:</strong> ${getTotalPrice().toFixed(2)}
          </p>
          <p className={styles.warningNote}>
            <i className="fas fa-info-circle"></i>
            If you are not redirected automatically, please visit: <strong>paypal.me/{sellerPaypalUsername}</strong> to complete payment.
            {sellerPaypalEmail && <><br />Or send payment to: <strong>{sellerPaypalEmail}</strong></>}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.checkoutCard}>
        <div className={styles.header}>
          <Image src="/imgs/logo.png" alt="Logo" width={120} height={30} priority />
          <h1 className={styles.title}>Checkout</h1>
        </div>

        {error && (
          <div className={styles.error}>
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <div className={styles.content}>
          {/* Order Summary */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-shopping-cart"></i>
              Order Summary
            </h2>
            <div className={styles.orderItems}>
              {cart.map((item) => (
                <div key={item.id} className={styles.orderItem}>
                  {item.image && (
                    <img src={item.image} alt={item.name} className={styles.orderItemImage} />
                  )}
                  <div className={styles.orderItemInfo}>
                    <h3 className={styles.orderItemName}>{item.name}</h3>
                    <p className={styles.orderItemMeta}>
                      Quantity: {item.cartQuantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className={styles.orderItemPrice}>
                    ${(item.price * item.cartQuantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.total}>
              <span className={styles.totalLabel}>Total:</span>
              <span className={styles.totalAmount}>${getTotalPrice().toFixed(2)}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-user"></i>
              Your Information
            </h2>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  required
                />
              </div>

              {hasPhysicalProducts && (
                <div className={styles.formGroup}>
                  <label htmlFor="address">Shipping Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main St, City, State, ZIP"
                    rows={4}
                    required
                  />
                  <p className={styles.formHint}>
                    <i className="fas fa-info-circle"></i>
                    Required for physical products
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-credit-card"></i>
              Payment Method
            </h2>
            <div className={styles.paymentInfo}>
              <div className={styles.paypalBadge}>
                <i className="fab fa-paypal"></i>
                <span>Secure PayPal Checkout</span>
              </div>
              <p className={styles.paymentDescription}>
                You'll be redirected to PayPal to complete your payment securely.
              </p>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className={styles.checkoutButton}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-lock"></i>
                Place Order - ${getTotalPrice().toFixed(2)}
              </>
            )}
          </button>

          <p className={styles.secureNote}>
            <i className="fas fa-shield-alt"></i>
            Your payment information is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}

