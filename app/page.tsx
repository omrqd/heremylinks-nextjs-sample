'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import styles from './home.module.css';
import TopBanner from '@/components/TopBanner';
import FeaturesSlider from '@/components/FeaturesSlider';
import ScrollAnimation from '@/components/ScrollAnimation';

export default function Home() {
  const { data: session, status } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <ScrollAnimation />
      <div className="header">
        <TopBanner />
        <div className={styles.navbar}>
          <div className={styles.logo}>
            <Image src="/imgs/logo.png" alt="HereMyLinks" width={240} height={60} priority />
          </div>
          <div className={styles.links}>
            {status === 'loading' ? (
              <div className={styles.loadingPlaceholder}></div>
            ) : session ? (
              <div className={styles.userMenuWrapper}>
                <button
                  className={styles.userMenuButton}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                >
                  {session.user?.image || (session.user as any)?.profileImage ? (
                    <Image
                      src={session.user?.image || (session.user as any)?.profileImage}
                      alt={session.user?.name || 'User'}
                      width={40}
                      height={40}
                      className={styles.userAvatar}
                    />
                  ) : (
                    <div className={styles.userAvatarPlaceholder}>
                      {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={styles.userName}>{session.user?.name || session.user?.email}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`${styles.chevron} ${showUserMenu ? styles.chevronUp : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {showUserMenu && (
                  <div className={styles.userDropdown}>
                    <Link href="/dashboard" className={styles.dropdownItem}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      Dashboard
                    </Link>
                    <button onClick={handleLogout} className={styles.dropdownItem}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className={styles.getStartedBtn}>Get Started</Link>
                <Link href="/login" className={styles.loginBtn}>Login</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.heroSection}>
        <div className={styles.heroSectionText}>
          more than just
          a link, it&apos;s your
          home on the web
          <div className={styles.createYourLink}>
            <div className={styles.linkInputWrapper}>
              <span className={styles.linkPrefix}>heremylinks.com/</span>
              <input type="text" placeholder="yourname" className={styles.linkInput} />
              <Link href="/login" className={styles.linkButtonArrow} aria-label="Get Started">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>
          </div>
        </div>
        <div className={styles.heroSectionImage}>
          <Image src="/imgs/hero-section-image.png" alt="HereMyLinks Platform" width={800} height={600} priority />
        </div>
      </div>

      <FeaturesSlider />

      <div className={`${styles.analyticsSection} analytics-section`}>
        <div className={styles.analyticsContainer}>
          <div className={`${styles.analyticsLeft} analytics-left`}>
            <div className={`${styles.analyticsCard} ${styles.cardOlive}`}>
              <div className={styles.analyticsChart}>
                <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none">
                  <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  <line x1="0" y1="180" x2="400" y2="180" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  <line x1="0" y1="240" x2="400" y2="240" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  
                  <line x1="50" y1="0" x2="50" y2="300" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                  <line x1="100" y1="0" x2="100" y2="300" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                  <line x1="150" y1="0" x2="150" y2="300" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                  <line x1="200" y1="0" x2="200" y2="300" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                  <line x1="250" y1="0" x2="250" y2="300" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                  <line x1="300" y1="0" x2="300" y2="300" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                  <line x1="350" y1="0" x2="350" y2="300" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                  
                  <polyline className={styles.graphLine} points="0,250 30,240 60,230 90,210 120,180 150,190 180,160 210,140 240,120 270,100 300,80 330,60 360,40 400,20" 
                    fill="none" stroke="#c5d952" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.analyticsInfo}>
                <div className={styles.analyticsNumber}>43,500</div>
                <div className={styles.analyticsLabel}>Clicks</div>
              </div>
            </div>
          </div>

          <div className={`${styles.analyticsRight} analytics-right`}>
            <h2 className={styles.analyticsTitle}>Analyze your audience and keep them engaged</h2>
            <p className={styles.analyticsDescription}>Track your engagement over time, monitor revenue and learn what&apos;s converting your audience. Make informed updates on the fly to keep them coming back.</p>
            <Link href="/login" className={styles.analyticsCtaButton}>Get started for free</Link>
          </div>
        </div>
      </div>

      <div className={`${styles.getStartedSection} get-started-section`}>
        <div className={styles.getStartedContainer}>
          <div className={styles.getStartedContent}>
            <span className={styles.getStartedBadge}>✨ Start for free</span>
            <h2 className={styles.getStartedTitle}>Ready to build your link hub?</h2>
            <p className={styles.getStartedDescription}>Join thousands of creators who use HereMyLinks to connect with their audience. Create your personalized link page in seconds.</p>
            
            <div className={styles.getStartedForm}>
              <div className={styles.inputGroup}>
                <span className={styles.inputPrefix}>heremylinks.com/</span>
                <input type="text" placeholder="yourname" className={styles.getStartedInput} />
              </div>
              <Link href="/login" className={styles.getStartedButton}>
                Create my link
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>
            
            <div className={styles.getStartedFeatures}>
              <div className={styles.featureItem}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>No credit card required</span>
              </div>
              <div className={styles.featureItem}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Setup in 2 minutes</span>
              </div>
              <div className={styles.featureItem}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className={`${styles.footer} footer`}>
        <div className={styles.footerContainer}>
          <div className={styles.footerLogo}>
            <Image src="/imgs/logo.png" alt="Logo" width={200} height={50} />
          </div>

          <div className={styles.footerSocial}>
            <a href="#" className={styles.footerSocialIcon} aria-label="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="#" className={styles.footerSocialIcon} aria-label="YouTube">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="#" className={styles.footerSocialIcon} aria-label="TikTok">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            <a href="#" className={styles.footerSocialIcon} aria-label="Twitter/X">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className={styles.footerSocialIcon} aria-label="Email">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </a>
          </div>

          <div className={styles.footerLegal}>
            <a href="#" className={styles.footerTerms}>terms of service</a>
            <span className={styles.footerCopyright}>© 2025, All Rights Reserved</span>
          </div>
        </div>
      </footer>
    </>
  );
}

