'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './PremiumGate.module.css';

interface PremiumGateProps {
  children: React.ReactNode;
  featureName: string;
}

export default function PremiumGate({ children, featureName }: PremiumGateProps) {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        setIsPremium(false);
        setShowPopup(true);
        return;
      }

      const payload = await response.json();
      const u = payload.user ?? payload;

      let premium = Boolean(u?.isPremium ?? u?.is_premium ?? false);
      const planType = u?.premiumPlanType ?? u?.premium_plan_type ?? null;
      const expiresAt = u?.premiumExpiresAt ?? u?.premium_expires_at ?? null;

      // If monthly, ensure it hasn't expired
      if (premium && planType === 'monthly' && expiresAt) {
        const exp = new Date(expiresAt);
        if (!Number.isNaN(exp.getTime()) && exp < new Date()) {
          premium = false;
        }
      }

      setIsPremium(premium);
      setShowPopup(!premium);
    } catch (error) {
      console.error('Failed to check premium status:', error);
      setIsPremium(false);
      setShowPopup(true);
    }
  };

  const handleUpgrade = () => {
    router.push('/dashboard/verified');
  };

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  if (isPremium === null) {
    // Loading state
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <i className="fas fa-spinner fa-spin"></i>
        </div>
      </div>
    );
  }

  if (isPremium) {
    // User is premium, show the content
    return <>{children}</>;
  }

  // User is not premium, show popup
  return (
    <>
      <div className={styles.blurredContent}>
        {children}
      </div>
      
      {showPopup && (
        <div className={styles.premiumPopupOverlay}>
          <div className={styles.premiumPopup}>
            <div className={styles.premiumPopupContent}>
              <div className={styles.premiumIcon}>
                <i className="fas fa-crown"></i>
              </div>
              
              <h2 className={styles.premiumTitle}>Premium Feature</h2>
              <p className={styles.premiumDescription}>
                Unlock <strong>{featureName}</strong> and all premium features
              </p>

              <div className={styles.premiumFeatures}>
                <div className={styles.premiumFeature}>
                  <i className="fas fa-check"></i>
                  <span>Advanced Analytics</span>
                </div>
                <div className={styles.premiumFeature}>
                  <i className="fas fa-check"></i>
                  <span>Premium Templates</span>
                </div>
                <div className={styles.premiumFeature}>
                  <i className="fas fa-check"></i>
                  <span>Remove HereMyLinks Branding</span>
                </div>
                <div className={styles.premiumFeature}>
                  <i className="fas fa-check"></i>
                  <span>Priority Support</span>
                </div>
              </div>

              <div className={styles.premiumActions}>
                <button 
                  className={styles.upgradeButton}
                  onClick={handleUpgrade}
                >
                  <i className="fas fa-crown"></i>
                  <span>Upgrade to Premium</span>
                </button>
                <button 
                  className={styles.backButton}
                  onClick={handleGoBack}
                >
                  Go Back
                </button>
              </div>

              <div className={styles.premiumFooter}>
                <Image 
                  src="/imgs/white-logo.png" 
                  alt="HereMyLinks" 
                  width={100} 
                  height={25}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


