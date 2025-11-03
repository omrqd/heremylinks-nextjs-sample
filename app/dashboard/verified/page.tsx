'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../dashboard.module.css';
import premiumStyles from './premium-modern.module.css';
import Link from 'next/link';
import Image from 'next/image';

export default function GetPremiumPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const searchParams = useSearchParams();

  // Handle successful payment verification
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId && !verifying) {
      verifySession(sessionId);
    }

    // Check premium status
    loadPremiumStatus();
  }, [searchParams]);

  const loadPremiumStatus = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const { user } = await response.json();
        setIsPremium(user.isPremium || false);
      }
    } catch (error) {
      console.error('Error loading premium status:', error);
    }
  };

  const verifySession = async (sessionId: string) => {
    try {
      setVerifying(true);
      const response = await fetch('/api/billing/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage('🎉 Payment successful! Your premium features are now active. Redirecting...');
        setTimeout(() => {
          window.location.href = '/dashboard/billing?success=true';
        }, 2000);
      } else {
        setMessage(data.error || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      setMessage('Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const startCheckout = async (plan: 'monthly' | 'lifetime') => {
    try {
      setLoadingPlan(plan);
      setMessage(null);
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Failed to start checkout');
        setLoadingPlan(null);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage('Checkout session did not return a URL');
        setLoadingPlan(null);
      }
    } catch (err) {
      console.error(err);
      setMessage('Unexpected error starting checkout');
      setLoadingPlan(null);
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
          {!isPremium && (
          <Link href="/dashboard/verified" className={`${styles.navItem} ${styles.navItemActive}`}> 
            <i className="fas fa-crown"></i>
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
              <i className="fas fa-crown"></i>
              <span>Get Premium</span>
            </button>
          </div>
        </div>
        <div className={styles.topBarActions}>
          <Link href="/dashboard/billing" className={styles.topBarTab}>
            <i className="fas fa-history"></i>
            <span>Billing History</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContentArea}>
        <div className={premiumStyles.premiumContainer}>
          {/* Compact Hero Section */}
          <section className={premiumStyles.premiumHeroSection}>
            <div className={premiumStyles.premiumHeroContent}>
              <div className={premiumStyles.premiumHeroIconWrapper}>
                <div className={premiumStyles.premiumHeroIcon}>
                  <i className="fas fa-crown"></i>
                </div>
                <div className={premiumStyles.premiumHeroIconGlow}></div>
              </div>
              <h1 className={premiumStyles.premiumHeroTitle}>
                  Unlock Your
                <span className={premiumStyles.premiumHeroTitleAccent}>Premium Potential</span>
                </h1>
              <p className={premiumStyles.premiumHeroSubtitle}>
                Transform your profile with advanced features, detailed analytics, and unlimited customization
                </p>
            </div>
          </section>

          {message && (
            <div className={message.includes('successful') || message.includes('🎉') ? premiumStyles.billingAlertSuccess : premiumStyles.billingAlertError}>{message}</div>
          )}

          {/* PRICING SECTION - FIRST! */}
          <section className={premiumStyles.premiumPricingSection}>
            <div className={premiumStyles.premiumPricingHeader}>
              <h2 className={premiumStyles.premiumPricingTitle}>Choose Your Plan</h2>
              <p className={premiumStyles.premiumPricingSubtitle}>
                Select the perfect plan for your needs. Upgrade or downgrade anytime.
              </p>
            </div>
            <div className={premiumStyles.premiumPricingGrid}>
              {/* Monthly Plan */}
              <div className={premiumStyles.premiumPricingCard}>
                <div className={premiumStyles.premiumPricingCardHeader}>
                  <div className={premiumStyles.premiumPlanIcon}>
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <h3 className={premiumStyles.premiumPlanTitle}>Monthly Pro</h3>
                  <p className={premiumStyles.premiumPlanSubtitle}>Perfect for getting started</p>
                </div>
                <div className={premiumStyles.premiumPriceContainer}>
                  <div className={premiumStyles.premiumPrice}>
                    <span className={premiumStyles.premiumPriceSymbol}>$</span>
                    <span className={premiumStyles.premiumPriceAmount}>3.99</span>
                    <span className={premiumStyles.premiumPricePeriod}>/month</span>
                  </div>
                  <div className={premiumStyles.premiumPriceDescription}>
                    Billed monthly, cancel anytime
                  </div>
                </div>
                <div className={premiumStyles.premiumFeaturesList}>
                  <div className={premiumStyles.premiumFeatureItem}>
                    <i className="fas fa-check"></i>
                    <span>All premium features</span>
                  </div>
                  <div className={premiumStyles.premiumFeatureItem}>
                    <i className="fas fa-check"></i>
                    <span>Priority support</span>
                  </div>
                  <div className={premiumStyles.premiumFeatureItem}>
                    <i className="fas fa-check"></i>
                    <span>Advanced analytics</span>
                  </div>
                  <div className={premiumStyles.premiumFeatureItem}>
                    <i className="fas fa-check"></i>
                    <span>Custom themes</span>
                  </div>
                  <div className={premiumStyles.premiumFeatureItem}>
                    <i className="fas fa-check"></i>
                    <span>Cancel anytime</span>
                  </div>
                </div>
                <div className={premiumStyles.premiumPricingActions}>
                  <button
                    onClick={() => startCheckout('monthly')}
                    disabled={loadingPlan === 'monthly'}
                    className={premiumStyles.premiumCtaButton}
                  >
                    {loadingPlan === 'monthly' ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-rocket"></i>
                        <span>Start Monthly Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Lifetime Plan - Featured */}
              <div className={`${premiumStyles.premiumPricingCard} ${premiumStyles.premiumPricingCardFeatured}`}>
                <div className={premiumStyles.premiumFeaturedBadge}>
                  <i className="fas fa-star"></i>
                  <span>Best Value</span>
                </div>
                <div className={premiumStyles.premiumPricingCardHeader}>
                  <div className={premiumStyles.premiumPlanIcon}>
                    <i className="fas fa-gem"></i>
                  </div>
                  <h3 className={premiumStyles.premiumPlanTitle}>Lifetime Pro</h3>
                  <p className={premiumStyles.premiumPlanSubtitle}>Pay once, own forever</p>
                </div>
                <div className={premiumStyles.premiumPriceContainer}>
                  <div className={premiumStyles.premiumPrice}>
                    <span className={premiumStyles.premiumPriceSymbol}>$</span>
                    <span className={premiumStyles.premiumPriceAmount}>14.99</span>
                  </div>
                  <div className={premiumStyles.premiumLifetimeLabel}>One-time payment</div>
                  <div className={premiumStyles.premiumPriceDescription}>
                    Save compared to 4+ months
                  </div>
                </div>
                <div className={premiumStyles.premiumFeaturesList}>
                  <div className={premiumStyles.premiumFeatureItem}>
                    <i className="fas fa-check"></i>
                    <span>All premium features forever</span>
                  </div>
                  <div className={premiumStyles.premiumFeatureItem}>
                    <i className="fas fa-check"></i>
                    <span>No recurring charges</span>
                  </div>
                  <div className={premiumStyles.premiumFeatureItem}>
                    <i className="fas fa-check"></i>
                    <span>Priority support</span>
                  </div>
                  <div className={premiumStyles.premiumFeatureItem}>
                    <i className="fas fa-check"></i>
                    <span>Advanced analytics</span>
                  </div>
                  <div className={premiumStyles.premiumFeatureItem}>
                    <i className="fas fa-check"></i>
                    <span>Future updates included</span>
                  </div>
                </div>
                <div className={premiumStyles.premiumPricingActions}>
                  <button
                    onClick={() => startCheckout('lifetime')}
                    disabled={loadingPlan === 'lifetime'}
                    className={`${premiumStyles.premiumCtaButton} ${premiumStyles.premiumCtaButtonFeatured}`}
                  >
                    {loadingPlan === 'lifetime' ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-gem"></i>
                        <span>Get Lifetime Access</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Enhanced Features Showcase */}
          <section className={premiumStyles.premiumFeaturesSection}>
            <div className={premiumStyles.premiumFeaturesHeader}>
              <h2 className={premiumStyles.premiumFeaturesTitle}>Everything You Need to Succeed</h2>
              <p className={premiumStyles.premiumFeaturesSubtitle}>
                Powerful features designed to help you create the perfect profile and grow your audience
              </p>
            </div>
            <div className={premiumStyles.premiumFeaturesGrid}>
              <div className={premiumStyles.premiumFeatureCard}>
                <div className={premiumStyles.premiumFeatureIcon}>
                  <i className="fas fa-palette"></i>
                </div>
                <div className={premiumStyles.premiumFeatureContent}>
                  <h3 className={premiumStyles.premiumFeatureTitle}>Advanced Themes</h3>
                  <p className={premiumStyles.premiumFeatureDescription}>
                    Access to premium templates and custom styling options to make your profile stand out
                  </p>
                </div>
                <div className={premiumStyles.premiumFeatureBadge}>Premium</div>
              </div>
              <div className={premiumStyles.premiumFeatureCard}>
                <div className={premiumStyles.premiumFeatureIcon}>
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className={premiumStyles.premiumFeatureContent}>
                  <h3 className={premiumStyles.premiumFeatureTitle}>Detailed Analytics</h3>
                  <p className={premiumStyles.premiumFeatureDescription}>
                    Track clicks, views, and engagement with advanced insights and real-time data
                  </p>
                </div>
                <div className={premiumStyles.premiumFeatureBadge}>Premium</div>
              </div>
              <div className={premiumStyles.premiumFeatureCard}>
                <div className={premiumStyles.premiumFeatureIcon}>
                  <i className="fas fa-headset"></i>
                </div>
                <div className={premiumStyles.premiumFeatureContent}>
                  <h3 className={premiumStyles.premiumFeatureTitle}>Priority Support</h3>
                  <p className={premiumStyles.premiumFeatureDescription}>
                    Get help faster with dedicated premium support and priority response times
                  </p>
                </div>
                <div className={premiumStyles.premiumFeatureBadge}>Premium</div>
              </div>
              <div className={premiumStyles.premiumFeatureCard}>
                <div className={premiumStyles.premiumFeatureIcon}>
                  <i className="fas fa-link"></i>
                </div>
                <div className={premiumStyles.premiumFeatureContent}>
                  <h3 className={premiumStyles.premiumFeatureTitle}>Unlimited Links</h3>
                  <p className={premiumStyles.premiumFeatureDescription}>
                    Add as many links as you want to your profile without any restrictions
                  </p>
                </div>
                <div className={premiumStyles.premiumFeatureBadge}>Premium</div>
              </div>
              <div className={premiumStyles.premiumFeatureCard}>
                <div className={premiumStyles.premiumFeatureIcon}>
                  <i className="fas fa-mobile-alt"></i>
                </div>
                <div className={premiumStyles.premiumFeatureContent}>
                  <h3 className={premiumStyles.premiumFeatureTitle}>Mobile Optimized</h3>
                  <p className={premiumStyles.premiumFeatureDescription}>
                    Perfect experience across all devices and screen sizes with responsive design
                  </p>
                </div>
                <div className={premiumStyles.premiumFeatureBadge}>Premium</div>
              </div>
              <div className={premiumStyles.premiumFeatureCard}>
                <div className={premiumStyles.premiumFeatureIcon}>
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className={premiumStyles.premiumFeatureContent}>
                  <h3 className={premiumStyles.premiumFeatureTitle}>SSL Security</h3>
                  <p className={premiumStyles.premiumFeatureDescription}>
                    Your data is protected with enterprise-grade security and encryption
                  </p>
                </div>
                <div className={premiumStyles.premiumFeatureBadge}>Premium</div>
              </div>
            </div>
          </section>

          {/* Enhanced Trust Section */}
          <section className={premiumStyles.premiumTrustSection}>
            <div className={premiumStyles.premiumTrustHeader}>
              <h3 className={premiumStyles.premiumTrustTitle}>Trusted by Thousands</h3>
              <p className={premiumStyles.premiumTrustSubtitle}>Join our community of successful creators</p>
            </div>
            <div className={premiumStyles.premiumTrustGrid}>
              <div className={premiumStyles.premiumTrustItem}>
                <div className={premiumStyles.premiumTrustIcon}>
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className={premiumStyles.premiumTrustLabel}>Secure Payment</div>
                <div className={premiumStyles.premiumTrustValue}>256-bit SSL encryption</div>
              </div>
              <div className={premiumStyles.premiumTrustItem}>
                <div className={premiumStyles.premiumTrustIcon}>
                  <i className="fas fa-undo"></i>
                </div>
                <div className={premiumStyles.premiumTrustLabel}>30-Day Refund</div>
                <div className={premiumStyles.premiumTrustValue}>No questions asked</div>
              </div>
              <div className={premiumStyles.premiumTrustItem}>
                <div className={premiumStyles.premiumTrustIcon}>
                  <i className="fas fa-lock"></i>
                </div>
                <div className={premiumStyles.premiumTrustLabel}>Data Protection</div>
                <div className={premiumStyles.premiumTrustValue}>GDPR compliant</div>
              </div>
              <div className={premiumStyles.premiumTrustItem}>
                <div className={premiumStyles.premiumTrustIcon}>
                  <i className="fas fa-users"></i>
                </div>
                <div className={premiumStyles.premiumTrustLabel}>10,000+ Users</div>
                <div className={premiumStyles.premiumTrustValue}>Growing community</div>
              </div>
            </div>
          </section>

          {/* Enhanced Fine Print */}
          <div style={{ padding: '2rem', textAlign: 'center', color: '#71717a', fontSize: '0.875rem' }}>
              <p>
                By purchasing, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>. 
                Monthly subscriptions can be cancelled anytime from your billing dashboard. Lifetime purchases are final but include a 30-day money-back guarantee.
              </p>
          </div>
        </div>
      </main>
    </div>
  );
}