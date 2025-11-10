'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './templates.module.css';
import dashboardStyles from '../dashboard.module.css';
import PremiumGate from '../components/PremiumGate';

interface Template {
  username: string;
  name: string;
  bio: string;
  profileImage: string;
  heroImage: string;
  template: string;
  themeColor: string;
  backgroundColor: string;
  backgroundImage: string;
  backgroundVideo: string;
  cardBackgroundColor: string;
  cardBackgroundImage: string;
  cardBackgroundVideo: string;
  usernameColor: string;
  bioColor: string;
  customTextColor: string;
  heroHeight: number;
  hideProfilePicture: boolean;
}

const TEMPLATE_USERS = ['omarnasr', 'moramoqa', 'morq', 'mrmoqa1'];

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
      fetchTemplates();
    }
  }, [status]);
  
  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile', { cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json();
        const u = payload.user ?? payload;

        const premium = Boolean(u?.isPremium ?? u?.is_premium ?? false);
        setIsPremium(premium);
        setProfileImage(u?.profileImage ?? u?.profile_image ?? '');
        setDisplayName(u?.name ?? u?.username ?? 'User');
        setUsername(u?.username ?? '');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };
  
  const fetchTemplates = async () => {
    try {
      const templatePromises = TEMPLATE_USERS.map(async (username) => {
        const response = await fetch(`/api/templates/preview?username=${username}`);
        if (response.ok) {
          return await response.json();
        }
        return null;
      });
      
      const results = await Promise.all(templatePromises);
      const validTemplates = results.filter(t => t !== null);
      setTemplates(validTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApplyTemplate = async (template: Template) => {
    if (!confirm(`Apply ${template.name}'s template? This will replace your current design settings (but keep your profile picture and content).`)) {
      return;
    }
    
    setApplying(template.username);
    
    try {
      const response = await fetch('/api/templates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUsername: template.username,
        }),
      });
      
      if (response.ok) {
        alert('✨ Template applied successfully! Redirecting to your dashboard...');
        router.push('/dashboard');
      } else {
        const data = await response.json();
        alert(`Failed to apply template: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      alert('Failed to apply template. Please try again.');
    } finally {
      setApplying(null);
    }
  };
  
  const handlePreview = (template: Template) => {
    window.open(`/${template.username}`, '_blank');
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    const slider = e.currentTarget as HTMLElement;
    setIsDragging(true);
    setStartX(e.pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
    slider.style.cursor = 'grabbing';
  };
  
  const handleMouseLeave = (e: React.MouseEvent) => {
    setIsDragging(false);
    const slider = e.currentTarget as HTMLElement;
    slider.style.cursor = 'grab';
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    const slider = e.currentTarget as HTMLElement;
    slider.style.cursor = 'grab';
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const slider = e.currentTarget as HTMLElement;
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
    slider.scrollLeft = scrollLeft - walk;
  };
  
  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const slider = e.currentTarget as HTMLElement;
    setTouchStartX(e.touches[0].clientX);
    setScrollLeft(slider.scrollLeft);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const slider = e.currentTarget as HTMLElement;
    const touchCurrentX = e.touches[0].clientX;
    const diff = touchStartX - touchCurrentX;
    slider.scrollLeft = scrollLeft + diff;
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.container}>
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading templates...</p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <i className="fas fa-palette"></i>
            <h1>Choose Your Template</h1>
            <p className={styles.subtitle}>Swipe through professional templates and apply instantly</p>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-palette"></i>
            <p>No templates available</p>
            <span>Check back later for new templates</span>
          </div>
        ) : (
          <>
            <div className={styles.sliderContainer}>
              <button 
                className={`${styles.sliderArrow} ${styles.sliderArrowLeft}`}
                onClick={() => {
                  const container = document.querySelector(`.${styles.templatesSlider}`);
                  if (container) {
                    container.scrollBy({ left: -450, behavior: 'smooth' });
                  }
                }}
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              <div 
                className={styles.templatesSlider}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                {templates.map((template) => (
                  <div key={template.username} className={styles.templateCard}>
                    <div className={styles.templatePreview}>
                      <iframe
                        src={`/${template.username}`}
                        className={styles.templateIframe}
                        title={`${template.name}'s template`}
                      />
                      <div className={styles.templateOverlay}>
                        <button 
                          className={styles.previewButton}
                          onClick={() => handlePreview(template)}
                        >
                          <i className="fas fa-eye"></i>
                          Full Preview
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles.templateInfo}>
                      <div className={styles.templateAuthor}>
                        {template.profileImage && (
                          <img src={template.profileImage} alt={template.name} className={styles.authorAvatar} />
                        )}
                        <div className={styles.authorDetails}>
                          <h3>{template.name}</h3>
                          <p>@{template.username}</p>
                        </div>
                      </div>
                      
                      <div className={styles.templateFeatures}>
                        <div className={styles.feature}>
                          <i className="fas fa-palette"></i>
                          <span>{template.template}</span>
                        </div>
                        {template.backgroundVideo && (
                          <div className={styles.feature}>
                            <i className="fas fa-video"></i>
                            <span>Video BG</span>
                          </div>
                        )}
                        {template.backgroundImage && (
                          <div className={styles.feature}>
                            <i className="fas fa-image"></i>
                            <span>Image BG</span>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        className={styles.applyButton}
                        onClick={() => handleApplyTemplate(template)}
                        disabled={applying !== null}
                      >
                        {applying === template.username ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>Applying...</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-magic"></i>
                            <span>Apply Template</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className={`${styles.sliderArrow} ${styles.sliderArrowRight}`}
                onClick={() => {
                  const container = document.querySelector(`.${styles.templatesSlider}`);
                  if (container) {
                    container.scrollBy({ left: 450, behavior: 'smooth' });
                  }
                }}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            <div className={styles.sliderIndicator}>
              <i className="fas fa-hand-pointer"></i>
              <span>Swipe or use arrows to browse templates</span>
            </div>
          </>
        )}
        
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <i className="fas fa-info-circle"></i>
            <h3>What happens when you apply a template?</h3>
            <ul>
              <li><i className="fas fa-check"></i> Your design settings will be updated</li>
              <li><i className="fas fa-check"></i> Colors, backgrounds, and layouts will change</li>
              <li><i className="fas fa-times"></i> Your profile picture stays the same</li>
              <li><i className="fas fa-times"></i> Your links and content won't be affected</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (status === 'loading') {
    return (
      <div className={dashboardStyles.dashboardContainer}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PremiumGate featureName="Templates">
      <div className={dashboardStyles.dashboardContainer}>
        {/* Fixed Left Sidebar */}
        <aside className={dashboardStyles.leftSidebar}>
        <div className={dashboardStyles.sidebarLogo}>
          <Image src="/imgs/white-logo.png" alt="HereMyLinks" width={100} height={25} priority />
          {isPremium && (
            <div className={dashboardStyles.proBadge}>
              <span className={dashboardStyles.proBadgeText}>PRO</span>
            </div>
          )}
        </div>
        <nav className={dashboardStyles.sidebarNav}>
          <Link href="/dashboard" className={dashboardStyles.navItem}>
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </Link>
          <Link href="/dashboard/analytics" className={dashboardStyles.navItem}>
            <i className="fas fa-chart-line"></i>
            <span>Analytics</span>
          </Link>
          <Link href="/dashboard/templates" className={`${dashboardStyles.navItem} ${dashboardStyles.navItemActive}`}>
            <i className="fas fa-palette"></i>
            <span>Templates</span>
          </Link>
        </nav>
        <div className={dashboardStyles.sidebarSection}>
          <div className={dashboardStyles.sectionTitle}>MAKE MONEY</div>
          <Link href="/dashboard/products" className={dashboardStyles.navItem}>
            <i className="fas fa-box"></i>
            <span>Products</span>
          </Link>
          <Link href="/dashboard/payments" className={dashboardStyles.navItem}>
            <i className="fas fa-credit-card"></i>
            <span>Payments</span>
          </Link>
        </div>
        <div className={dashboardStyles.sidebarBottom}>
          <Link href="/dashboard/billing" className={dashboardStyles.navItem}>
            <i className="fas fa-credit-card"></i>
            <span>Billing</span>
          </Link>
          {!isPremium && (
            <Link href="/dashboard/verified" className={dashboardStyles.navItem}>
              <i className="fas fa-crown"></i>
              <span>Get Premium</span>
            </Link>
          )}
          <Link href="/dashboard/help" className={dashboardStyles.navItem}>
            <i className="fas fa-question-circle"></i>
            <span>Help Center</span>
          </Link>
        </div>
      </aside>

      {/* Top Bar */}
      <header className={dashboardStyles.topBar}>
        <div className={dashboardStyles.topBarLeft}>
          <div className={dashboardStyles.topBarTabs}>
            <button className={`${dashboardStyles.topBarTab} ${dashboardStyles.topBarTabActive}`}>
              <i className="fas fa-palette"></i>
              <span>Templates</span>
            </button>
          </div>
        </div>
        <div className={dashboardStyles.topBarRight}>
          <div className={dashboardStyles.dropdownWrapper}>
            <button 
              className={dashboardStyles.topBarProfile}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              {profileImage ? (
                <img src={profileImage} alt={displayName} className={dashboardStyles.topBarAvatar} />
              ) : (
                <div className={dashboardStyles.topBarAvatarPlaceholder}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            
            {showProfileDropdown && (
              <>
                <div 
                  className={dashboardStyles.dropdownOverlay} 
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className={dashboardStyles.profileDropdown}>
                  <div className={dashboardStyles.profileDropdownHeader}>
                    <div className={dashboardStyles.profileDropdownAvatar}>
                      {profileImage ? (
                        <img src={profileImage} alt={displayName} />
                      ) : (
                        <div className={dashboardStyles.profileDropdownAvatarPlaceholder}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={dashboardStyles.profileDropdownInfo}>
                      <p className={dashboardStyles.profileDropdownName}>{displayName}</p>
                      <p className={dashboardStyles.profileDropdownEmail}>{session?.user?.email}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.profileDropdownDivider}></div>
                  <button 
                    className={dashboardStyles.profileDropdownItem}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      signOut({ callbackUrl: '/login' });
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
      <main className={dashboardStyles.mainContentArea}>
        {renderContent()}
      </main>
    </div>
    </PremiumGate>
  );
}

