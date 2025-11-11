'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../dashboard.module.css';
import billingStyles from './billing-modern.module.css';
import Link from 'next/link';
import Image from 'next/image';
import ConfirmModal from '@/components/ConfirmModal';

function formatAmount(cents?: number, currency?: string) {
  if (!cents && cents !== 0) return '-';
  const amount = (cents as number) / 100;
  return `${currency?.toUpperCase() || 'USD'} ${amount.toFixed(2)}`;
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [cancelling, setCancelling] = useState(false);
  const [userPremium, setUserPremium] = useState<{ 
    is_premium?: boolean; 
    premium_plan_type?: string | null;
    premium_expires_at?: string | null;
    stripe_subscription_id?: string | null;
  }>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [subscriptionCancelled, setSubscriptionCancelled] = useState(false);
  const [showResubscribeOption, setShowResubscribeOption] = useState(false);

  useEffect(() => {
    // Check for success/error messages
    if (searchParams.get('success')) {
      setMessage('🎉 Payment successful! Your premium features are now active.');
      setMessageType('success');
    } else if (searchParams.get('canceled')) {
      setMessage('Payment was cancelled.');
      setMessageType('error');
    }

    // Load user data
    loadUserData();
  }, [searchParams]);

  const loadUserData = async () => {
    try {
      // Check for pending payments first (in case user paid but didn't complete redirect)
      try {
        const checkResponse = await fetch('/api/billing/check-payment-status', { method: 'POST' });
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.updated) {
            console.log('✅ Payment status updated from pending payment');
          }
        }
      } catch (error) {
        console.log('Payment check skipped:', error);
      }

      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const { user } = await response.json();
        
        console.log('🔍 Billing: User data loaded:', {
          isPremium: user.isPremium,
          planType: user.premiumPlanType,
          expiresAt: user.premiumExpiresAt,
          subscriptionId: user.stripeSubscriptionId,
        });

        setUserPremium({
          is_premium: user.isPremium || false,
          premium_plan_type: user.premiumPlanType || null,
          premium_expires_at: user.premiumExpiresAt || null,
          stripe_subscription_id: user.stripeSubscriptionId || null,
        });

        // Check if subscription is cancelled by calling the API
        if (user.premiumPlanType === 'monthly' || user.stripeSubscriptionId) {
          try {
            const statusResponse = await fetch('/api/billing/subscription-status');
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              console.log('🔍 Billing: Subscription status:', statusData);
              
              // If subscription is canceled and user is not premium, show resubscribe option
              if (statusData.status === 'canceled' && !user.isPremium) {
                setShowResubscribeOption(true);
                setSubscriptionCancelled(false); // Not actively cancelling since already cancelled
              } else {
                setSubscriptionCancelled(statusData.cancel_at_period_end || false);
                setShowResubscribeOption(false);
              }
            }
          } catch (error) {
            console.error('Error checking subscription status:', error);
          }
        } else {
          setSubscriptionCancelled(false);
          setShowResubscribeOption(false);
        }
      }

      // Load transactions
      const txResponse = await fetch('/api/billing/transactions');
      if (txResponse.ok) {
        const { transactions: txData } = await txResponse.json();
        setTransactions(txData || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (externalId: string) => {
    try {
      console.log('📄 Downloading invoice for:', externalId);
      
      const response = await fetch(`/api/billing/invoice?external_id=${externalId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        // Open invoice in new tab
        if (data.invoice_url) {
          window.open(data.invoice_url, '_blank');
        } else if (data.invoice_pdf) {
          window.open(data.invoice_pdf, '_blank');
        } else {
          setMessage('Invoice URL not available');
          setMessageType('error');
        }
      } else {
        setMessage(data.error || 'Failed to fetch invoice');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setMessage('An error occurred while fetching the invoice');
      setMessageType('error');
    }
  };

  const handleCancelSubscription = async () => {
    setShowCancelModal(false);
    setCancelling(true);
    setMessage(null);

    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Subscription cancelled successfully:', data);
        
        if (data.already_cancelled) {
          setMessage('ℹ️ Subscription was already cancelled.');
          setMessageType('success');
        } else {
          setMessage('✅ Subscription cancelled. Premium access removed.');
          setMessageType('success');
        }
        
        // Update local state to show resubscribe option
        setSubscriptionCancelled(false);
        setShowResubscribeOption(true);
        
        // Small delay to let user see the message, then reload
        setTimeout(async () => {
          await loadUserData();
        }, 500);
      } else {
        setMessage(data.error || 'Failed to cancel subscription');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setMessage('An error occurred while cancelling your subscription');
      setMessageType('error');
    } finally {
      setCancelling(false);
    }
  };

  const isPremium = !!userPremium?.is_premium;
  const planType = (userPremium?.premium_plan_type as string) || 'free';
  const expiresAt = userPremium?.premium_expires_at;

  // Format next billing date
  const getNextBillingDate = () => {
    console.log('📅 getNextBillingDate called:', {
      expiresAt,
      planType,
      subscriptionCancelled,
    });
    
    if (!expiresAt) {
      console.log('⚠️ No expiry date available');
      return 'Not available';
    }
    try {
      const date = new Date(expiresAt);
      const formatted = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      console.log('📅 Formatted billing date:', formatted, 'from:', expiresAt);
      return formatted;
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Fixed Left Sidebar */}
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
            {!isPremium && <span className={styles.proBadgeSmall}>PRO</span>}
          </Link>
          <Link href="/dashboard/templates" className={styles.navItem}>
            <i className="fas fa-palette"></i>
            <span>Templates</span>
            {!isPremium && <span className={styles.proBadgeSmall}>PRO</span>}
          </Link>
        </nav>
        <div className={styles.sidebarSection}>
          <div className={styles.sectionTitle}>MAKE MONEY</div>
          <Link href="/dashboard/products" className={styles.navItem}>
            <i className="fas fa-box"></i>
            <span>Products</span>
          </Link>
          <Link href="/dashboard/payments" className={styles.navItem}>
            <i className="fas fa-credit-card"></i>
            <span>Payments</span>
          </Link>
        </div>
        <div className={styles.sidebarBottom}>
          <Link href="/dashboard/billing" className={`${styles.navItem} ${styles.navItemActive}`}>
            <i className="fas fa-credit-card"></i>
            <span>Billing</span>
          </Link>
          {!isPremium && (
          <Link href="/dashboard/verified" className={styles.navItem}>
            <i className="fas fa-check-circle"></i>
            <span>Get Premium</span>
          </Link>
          )}
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
              <span>Billing</span>
            </button>
          </div>
        </div>
        {!isPremium && (
        <div className={styles.topBarActions}>
          <Link href="/dashboard/verified" className={styles.topBarTab}>
            <i className="fas fa-check-circle"></i>
            <span>Get Premium</span>
          </Link>
        </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContentArea}>
        <div className={billingStyles.billingContainer}>
          {/* Message Display */}
          {message && (
            <div className={messageType === 'success' ? billingStyles.billingAlertSuccess : billingStyles.billingAlertError}>
              {message}
            </div>
          )}

          {/* Enhanced Hero Section */}
          <section className={billingStyles.heroSection}>
            <div className={billingStyles.heroBackground}>
              <div className={billingStyles.heroPattern}></div>
            </div>
            <div className={billingStyles.heroContent}>
              <div className={billingStyles.heroIconWrapper}>
                <div className={billingStyles.heroIcon}>
                  <i className="fas fa-crown"></i>
                </div>
                <div className={billingStyles.heroIconGlow}></div>
              </div>
              <div className={billingStyles.heroText}>
                <h1 className={billingStyles.heroTitle}>
                  Billing & Subscription
                  <span className={billingStyles.heroTitleAccent}>Management</span>
                </h1>
                <p className={billingStyles.heroSubtitle}>
                  Take control of your subscription, manage payments, and unlock premium features
                </p>
              </div>
              <div className={billingStyles.heroStats}>
                <div className={billingStyles.heroStat}>
                  <div className={billingStyles.heroStatValue}>{isPremium ? 'Premium' : 'Free'}</div>
                  <div className={billingStyles.heroStatLabel}>Current Plan</div>
                </div>
                <div className={billingStyles.heroStat}>
                  <div className={billingStyles.heroStatValue}>{transactions.length}</div>
                  <div className={billingStyles.heroStatLabel}>Transactions</div>
                </div>
                <div className={billingStyles.heroStat}>
                  <div className={billingStyles.heroStatValue}>
                    {subscriptionCancelled ? 'Cancelling' : showResubscribeOption ? 'Cancelled' : isPremium ? 'Active' : 'Inactive'}
                  </div>
                  <div className={billingStyles.heroStatLabel}>Status</div>
                </div>
              </div>
            </div>
          </section>

          {/* Enhanced Plan Card */}
          <div className={billingStyles.planCardContainer}>
            <div className={billingStyles.planCard}>
              <div className={billingStyles.planCardHeader}>
                <div className={billingStyles.planBadge}>
                  <div className={`${billingStyles.planIcon} ${isPremium ? billingStyles.planIconPremium : billingStyles.planIconFree}`}>
                    {isPremium ? <i className="fas fa-crown"></i> : <i className="fas fa-user"></i>}
                  </div>
                  <div className={billingStyles.planInfo}>
                    <h2 className={billingStyles.planTitle}>
                      {isPremium ? (planType === 'monthly' ? 'Pro Monthly' : planType === 'lifetime' ? 'Pro Lifetime' : 'Pro Plan') : 'Free Plan'}
                    </h2>
                    <p className={billingStyles.planSubtitle}>
                      {isPremium 
                        ? planType === 'monthly' 
                          ? expiresAt
                            ? subscriptionCancelled
                              ? `Access until ${getNextBillingDate()}`
                              : `Next billing: ${getNextBillingDate()}`
                            : 'Billed monthly at $3.99/month'
                          : planType === 'lifetime'
                          ? 'One-time payment - lifetime access'
                          : 'Premium features enabled'
                        : 'Limited features - upgrade to unlock more'}
                    </p>
                  </div>
                </div>
                <div className={billingStyles.planStatus}>
                  <span className={`${billingStyles.statusBadge} ${
                    subscriptionCancelled || showResubscribeOption
                      ? billingStyles.statusCancelled 
                      : isPremium 
                        ? billingStyles.statusActive 
                        : billingStyles.statusFree
                  }`}>
                    <i className={`fas ${
                      subscriptionCancelled || showResubscribeOption
                        ? 'fa-exclamation-circle' 
                        : isPremium 
                          ? 'fa-check-circle' 
                          : 'fa-clock'
                    }`}></i>
                    {subscriptionCancelled ? 'Cancelling' : showResubscribeOption ? 'Cancelled' : isPremium ? 'Active' : 'Free'}
                  </span>
                </div>
              </div>

              {/* Enhanced Features Grid */}
              <div className={billingStyles.featuresContainer}>
                <h3 className={billingStyles.featuresTitle}>Plan Features</h3>
                <div className={billingStyles.featuresGrid}>
                  <div className={`${billingStyles.featureCard} ${isPremium ? billingStyles.featureActive : billingStyles.featureInactive}`}>
                    <div className={billingStyles.featureIcon}>
                      <i className="fas fa-link"></i>
                    </div>
                    <div className={billingStyles.featureContent}>
                      <h4 className={billingStyles.featureTitle}>Links</h4>
                      <p className={billingStyles.featureDescription}>
                        {isPremium ? 'Unlimited links' : 'Up to 5 links'}
                      </p>
                    </div>
                    <div className={billingStyles.featureStatus}>
                      <i className={`fas ${isPremium ? 'fa-check' : 'fa-lock'}`}></i>
                    </div>
                  </div>
                  
                  <div className={`${billingStyles.featureCard} ${isPremium ? billingStyles.featureActive : billingStyles.featureInactive}`}>
                    <div className={billingStyles.featureIcon}>
                      <i className="fas fa-palette"></i>
                    </div>
                    <div className={billingStyles.featureContent}>
                      <h4 className={billingStyles.featureTitle}>Themes</h4>
                      <p className={billingStyles.featureDescription}>
                        {isPremium ? 'Premium themes' : 'Basic themes only'}
                      </p>
                    </div>
                    <div className={billingStyles.featureStatus}>
                      <i className={`fas ${isPremium ? 'fa-check' : 'fa-lock'}`}></i>
                    </div>
                  </div>
                  
                  <div className={`${billingStyles.featureCard} ${isPremium ? billingStyles.featureActive : billingStyles.featureInactive}`}>
                    <div className={billingStyles.featureIcon}>
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div className={billingStyles.featureContent}>
                      <h4 className={billingStyles.featureTitle}>Analytics</h4>
                      <p className={billingStyles.featureDescription}>
                        {isPremium ? 'Advanced analytics' : 'Basic stats only'}
                      </p>
                    </div>
                    <div className={billingStyles.featureStatus}>
                      <i className={`fas ${isPremium ? 'fa-check' : 'fa-lock'}`}></i>
                    </div>
                  </div>
                  
                  <div className={`${billingStyles.featureCard} ${isPremium ? billingStyles.featureActive : billingStyles.featureInactive}`}>
                    <div className={billingStyles.featureIcon}>
                      <i className="fas fa-headset"></i>
                    </div>
                    <div className={billingStyles.featureContent}>
                      <h4 className={billingStyles.featureTitle}>Support</h4>
                      <p className={billingStyles.featureDescription}>
                        {isPremium ? 'Priority support' : 'Community support'}
                      </p>
                    </div>
                    <div className={billingStyles.featureStatus}>
                      <i className={`fas ${isPremium ? 'fa-check' : 'fa-lock'}`}></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Plan Actions */}
              <div className={billingStyles.planActions}>
                {showResubscribeOption ? (
                  <div className={billingStyles.upgradeSection}>
                    <div className={billingStyles.cancelledInfo}>
                      <div className={billingStyles.cancelledIcon}>
                        <i className="fas fa-info-circle"></i>
                      </div>
                      <div className={billingStyles.cancelledContent}>
                        <h4 className={billingStyles.cancelledTitle}>Subscription Cancelled</h4>
                        <p className={billingStyles.cancelledText}>
                          Your subscription has been cancelled. You can resubscribe anytime to regain access to all premium features.
                        </p>
                      </div>
                    </div>
                    <Link href="/dashboard/verified" className={billingStyles.resubscribeButton}>
                      <i className="fas fa-redo"></i>
                      <span>Resubscribe to Premium</span>
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                ) : !isPremium ? (
                  <div className={billingStyles.upgradeSection}>
                    <div className={billingStyles.upgradeContent}>
                      <h4 className={billingStyles.upgradeTitle}>Ready to upgrade?</h4>
                      <p className={billingStyles.upgradeDescription}>Unlock all premium features and take your profile to the next level</p>
                    </div>
                    <Link href="/dashboard/verified" className={billingStyles.upgradeButton}>
                      <i className="fas fa-crown"></i>
                      <span>Upgrade to Pro</span>
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                ) : (
                  <div className={billingStyles.manageSection}>
                    {subscriptionCancelled ? (
                      <>
                        <div className={billingStyles.cancelledInfo}>
                          <div className={billingStyles.cancelledIcon}>
                            <i className="fas fa-info-circle"></i>
                          </div>
                          <div className={billingStyles.cancelledContent}>
                            <h4 className={billingStyles.cancelledTitle}>Subscription Cancelled</h4>
                            <p className={billingStyles.cancelledText}>
                              Your premium access will end on <strong>{getNextBillingDate()}</strong>. 
                              You can resubscribe anytime before then to continue enjoying premium features.
                            </p>
                          </div>
                        </div>
                        <div className={billingStyles.resubscribeSection}>
                          <Link href="/dashboard/verified" className={billingStyles.resubscribeButton}>
                            <i className="fas fa-redo"></i>
                            <span>Resubscribe Now</span>
                          </Link>
                        </div>
                      </>
                    ) : (
                    <div className={billingStyles.manageButtons}>
                        {planType === 'monthly' ? (
                          <button 
                            className={billingStyles.cancelButton}
                            onClick={() => setShowCancelModal(true)}
                            disabled={cancelling}
                          >
                            <i className={`fas ${cancelling ? 'fa-spinner fa-spin' : 'fa-times'}`}></i>
                            <span>{cancelling ? 'Cancelling...' : 'Cancel Subscription'}</span>
                        </button>
                        ) : (
                          <div className={billingStyles.lifetimeInfo}>
                            <i className="fas fa-infinity"></i>
                            <span>Lifetime access - No recurring charges</span>
                          </div>
                      )}
                    </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Payment History */}
          <div className={billingStyles.historySection}>
            <div className={billingStyles.historySectionHeader}>
              <div className={billingStyles.historyHeaderContent}>
                <div className={billingStyles.historyHeaderIcon}>
                  <i className="fas fa-history"></i>
                </div>
                <div className={billingStyles.historyHeaderText}>
                  <h2 className={billingStyles.historyTitle}>Payment History</h2>
                  <p className={billingStyles.historySubtitle}>
                    Track all your transactions and download invoices
                  </p>
                </div>
              </div>
              <div className={billingStyles.historyHeaderActions}>
                {/* Export button removed */}
              </div>
            </div>

            <div className={billingStyles.historyCard}>
              {transactions && transactions.length > 0 ? (
                <div className={billingStyles.transactionsContainer}>
                  <div className={billingStyles.transactionsHeader}>
                    <div className={billingStyles.transactionsSummary}>
                      <div className={billingStyles.summaryItem}>
                        <span className={billingStyles.summaryLabel}>Total Transactions</span>
                        <span className={billingStyles.summaryValue}>{transactions.length}</span>
                      </div>
                      <div className={billingStyles.summaryItem}>
                        <span className={billingStyles.summaryLabel}>Total Spent</span>
                        <span className={billingStyles.summaryValue}>
                          ${transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <table className={billingStyles.transactionsTable}>
                    <thead className={billingStyles.tableHeader}>
                      <tr>
                        <th>Type</th>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={billingStyles.tableBody}>
                    {transactions.map((t, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className={billingStyles.transactionType}>
                              <div className={billingStyles.typeIcon}>
                          <i className={`fas ${t.status === 'succeeded' ? 'fa-check-circle' : t.status === 'pending' ? 'fa-clock' : 'fa-times-circle'}`}></i>
                        </div>
                              <div className={billingStyles.typeDetails}>
                                <div className={billingStyles.typeName}>
                                  {t.plan_type === 'monthly' ? 'Pro Monthly' : 
                                   t.plan_type === 'lifetime' ? 'Pro Lifetime' : 
                                   'Premium'}
                                </div>
                                <div className={billingStyles.typeDate}>
                                {new Date(t.created_at).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={billingStyles.transactionId}>
                              {t.external_id?.substring(0, 20)}...
                          </div>
                          </td>
                          <td>
                          <div className={billingStyles.transactionAmount}>
                              ${t.amount}
                              <span className={billingStyles.amountCurrency}>{t.currency?.toUpperCase()}</span>
                          </div>
                          </td>
                          <td>
                            <span className={`${billingStyles.transactionStatus} ${
                            t.status === 'succeeded' ? billingStyles.statusSuccess : 
                            t.status === 'pending' ? billingStyles.statusPending : 
                            billingStyles.statusFailed
                          }`}>
                              <i className={`fas ${t.status === 'succeeded' ? 'fa-check' : t.status === 'pending' ? 'fa-clock' : 'fa-times'}`}></i>
                            {t.status === 'succeeded' ? 'Paid' : 
                             t.status === 'pending' ? 'Pending' : 
                             'Failed'}
                          </span>
                          </td>
                          <td>
                            <button 
                              className={billingStyles.downloadButton}
                              onClick={() => handleDownloadInvoice(t.external_id)}
                              title="Download invoice"
                            >
                            <i className="fas fa-download"></i>
                              Invoice
                          </button>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={billingStyles.emptyState}>
                    <div className={billingStyles.emptyIcon}>
                      <i className="fas fa-receipt"></i>
                  </div>
                  <h3>No payment history yet</h3>
                  <p>
                      Your transactions will appear here once you make your first purchase. 
                    </p>
                  {!isPremium && (
                    <Link href="/dashboard/verified" className={billingStyles.upgradeButton} style={{ marginTop: '1.5rem' }}>
                      <i className="fas fa-crown"></i>
                      <span>Get Premium</span>
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Cancel Subscription Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription?"
        message="Are you sure you want to cancel your monthly subscription? You will retain premium access until the end of your current billing period."
        confirmText="Yes, Cancel Subscription"
        cancelText="Keep Subscription"
        type="danger"
        isLoading={cancelling}
      />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingContent />
    </Suspense>
  );
}