'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './analytics.module.css';
import dashboardStyles from '../dashboard.module.css';
import PremiumGate from '../components/PremiumGate';

interface LinkAnalytics {
  id: string;
  title: string;
  url: string;
  click_count: number;
  uniqueVisitors: number;
  totalClicks: number;
  clicksToday: number;
}

interface CountryStats {
  country: string;
  clicks: number;
}

interface LinkDetailedAnalytics {
  link: {
    id: string;
    title: string;
    url: string;
  };
  totalClicks: number;
  uniqueVisitors: number;
  countries: {
    country: string;
    clicks: number;
    uniqueVisitors: number;
  }[];
  deviceBreakdown: { [key: string]: number };
  browserBreakdown: { [key: string]: number };
  osBreakdown: { [key: string]: number };
  referrerBreakdown: { [key: string]: number };
  clicksOverTime: { date: string; clicks: number }[];
  recentClicks: {
    country: string;
    city: string;
    device: string;
    browser: string;
    os: string;
    timestamp: string;
  }[];
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isPublished, setIsPublished] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  const [stats, setStats] = useState<{
    totalUniqueVisitors: number;
    totalClicks: number;
    clicksToday: number;
    links: LinkAnalytics[];
    topCountries: CountryStats[];
    deviceBreakdown: { [key: string]: number };
  } | null>(null);
  
  const [liveVisitors, setLiveVisitors] = useState(0);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [linkDetails, setLinkDetails] = useState<LinkDetailedAnalytics | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
      fetchAnalytics();
      fetchLiveVisitors();
      
      // Refresh live visitors every 10 seconds for more accurate count
      const liveInterval = setInterval(fetchLiveVisitors, 10000);
      
      return () => clearInterval(liveInterval);
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
        setIsPublished(Boolean(u?.isPublished ?? u?.is_published ?? false));
        setUserEmail(session?.user?.email || '');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };
  
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLiveVisitors = async () => {
    try {
      const response = await fetch('/api/analytics/live');
      if (response.ok) {
        const data = await response.json();
        setLiveVisitors(data.totalLiveVisitors);
      }
    } catch (error) {
      console.error('Failed to fetch live visitors:', error);
    }
  };
  
  const fetchLinkDetails = async (linkId: string) => {
    setLoadingDetails(true);
    setSelectedLink(linkId);
    
    try {
      const response = await fetch(`/api/analytics/link/${linkId}`);
      if (response.ok) {
        const data = await response.json();
        setLinkDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch link details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  const closeDetails = () => {
    setSelectedLink(null);
    setLinkDetails(null);
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.container}>
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading analytics...</p>
          </div>
        </div>
      );
    }
    
    if (!stats) {
      return (
        <div className={styles.container}>
          <div className={styles.error}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>Failed to load analytics</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <i className="fas fa-chart-line"></i>
            <h1>Analytics Dashboard</h1>
          </div>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot}></span>
            <span>{liveVisitors} Live Visitor{liveVisitors !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        {/* Overview Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <i className="fas fa-users"></i>
            </div>
            <div className={styles.statContent}>
              <h3>Total Visitors</h3>
              <p className={styles.statNumber}>{stats.totalUniqueVisitors.toLocaleString()}</p>
              <span className={styles.statLabel}>Unique visitors</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <i className="fas fa-mouse-pointer"></i>
            </div>
            <div className={styles.statContent}>
              <h3>Total Clicks</h3>
              <p className={styles.statNumber}>{stats.totalClicks.toLocaleString()}</p>
              <span className={styles.statLabel}>All time</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <i className="fas fa-calendar-day"></i>
            </div>
            <div className={styles.statContent}>
              <h3>Today</h3>
              <p className={styles.statNumber}>{stats.clicksToday.toLocaleString()}</p>
              <span className={styles.statLabel}>Clicks today</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <i className="fas fa-link"></i>
            </div>
            <div className={styles.statContent}>
              <h3>Active Links</h3>
              <p className={styles.statNumber}>{stats.links.length}</p>
              <span className={styles.statLabel}>Total links</span>
            </div>
          </div>
        </div>
        
        {/* Links Table */}
        <div className={styles.section}>
          <h2>
            <i className="fas fa-list"></i>
            Link Performance
          </h2>
          
          {stats.links.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-chart-bar"></i>
              <p>No links yet</p>
              <span>Create links to start tracking analytics</span>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.linksTable}>
                <thead>
                  <tr>
                    <th>Link Title</th>
                    <th>Total Clicks</th>
                    <th>Unique Visitors</th>
                    <th>Today</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.links.map((link) => (
                    <tr key={link.id}>
                      <td>
                        <div className={styles.linkInfo}>
                          <strong>{link.title}</strong>
                          <span className={styles.linkUrl}>{link.url}</span>
                        </div>
                      </td>
                      <td>{link.totalClicks.toLocaleString()}</td>
                      <td>{link.uniqueVisitors.toLocaleString()}</td>
                      <td>
                        <span className={styles.todayBadge}>{link.clicksToday}</span>
                      </td>
                      <td>
                        <button
                          className={styles.detailsButton}
                          onClick={() => fetchLinkDetails(link.id)}
                        >
                          <i className="fas fa-chart-pie"></i>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Top Countries & Device Breakdown */}
        <div className={styles.gridRow}>
          <div className={styles.section}>
            <h2>
              <i className="fas fa-globe"></i>
              Top Countries
            </h2>
            
            {stats.topCountries.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-map-marked-alt"></i>
                <p>No country data yet</p>
              </div>
            ) : (
              <div className={styles.countryList}>
                {stats.topCountries.map((country, index) => (
                  <div key={country.country} className={styles.countryItem}>
                    <div className={styles.countryRank}>{index + 1}</div>
                    <div className={styles.countryName}>{country.country}</div>
                    <div className={styles.countryClicks}>{country.clicks} clicks</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className={styles.section}>
            <h2>
              <i className="fas fa-mobile-alt"></i>
              Device Breakdown
            </h2>
            
            {Object.keys(stats.deviceBreakdown).length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-devices"></i>
                <p>No device data yet</p>
              </div>
            ) : (
              <div className={styles.deviceList}>
                {Object.entries(stats.deviceBreakdown).map(([device, count]) => {
                  const total = Object.values(stats.deviceBreakdown).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(1);
                  
                  const deviceIcon = 
                    device === 'mobile' ? 'fa-mobile-alt' :
                    device === 'tablet' ? 'fa-tablet-alt' :
                    'fa-desktop';
                  
                  return (
                    <div key={device} className={styles.deviceItem}>
                      <i className={`fas ${deviceIcon} ${styles.deviceIcon}`}></i>
                      <div className={styles.deviceInfo}>
                        <div className={styles.deviceName}>{device.charAt(0).toUpperCase() + device.slice(1)}</div>
                        <div className={styles.deviceBar}>
                          <div 
                            className={styles.deviceBarFill} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className={styles.deviceStats}>
                        <span className={styles.devicePercentage}>{percentage}%</span>
                        <span className={styles.deviceCount}>{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Link Details Modal */}
        {selectedLink && (
          <div className={styles.modal} onClick={closeDetails}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={closeDetails}>
                <i className="fas fa-times"></i>
              </button>
              
              {loadingDetails ? (
                <div className={styles.modalLoading}>
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading details...</p>
                </div>
              ) : linkDetails ? (
                <>
                  <div className={styles.modalHeader}>
                    <h2>{linkDetails.link.title}</h2>
                    <p className={styles.modalUrl}>{linkDetails.link.url}</p>
                  </div>
                  
                  <div className={styles.modalStats}>
                    <div className={styles.modalStatItem}>
                      <i className="fas fa-mouse-pointer"></i>
                      <div>
                        <strong>{linkDetails.totalClicks.toLocaleString()}</strong>
                        <span>Total Clicks</span>
                      </div>
                    </div>
                    <div className={styles.modalStatItem}>
                      <i className="fas fa-users"></i>
                      <div>
                        <strong>{linkDetails.uniqueVisitors.toLocaleString()}</strong>
                        <span>Unique Visitors</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Countries */}
                  <div className={styles.modalSection}>
                    <h3><i className="fas fa-globe"></i> Country Distribution</h3>
                    <div className={styles.countryDetailList}>
                      {linkDetails.countries.slice(0, 10).map((country) => (
                        <div key={country.country} className={styles.countryDetailItem}>
                          <span className={styles.countryDetailName}>{country.country}</span>
                          <div className={styles.countryDetailStats}>
                            <span>{country.clicks} clicks</span>
                            <span className={styles.divider}>•</span>
                            <span>{country.uniqueVisitors} visitors</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Devices, Browsers, OS */}
                  <div className={styles.modalGrid}>
                    <div className={styles.modalSection}>
                      <h3><i className="fas fa-mobile-alt"></i> Devices</h3>
                      <div className={styles.breakdownList}>
                        {Object.entries(linkDetails.deviceBreakdown).map(([device, count]) => (
                          <div key={device} className={styles.breakdownItem}>
                            <span>{device.charAt(0).toUpperCase() + device.slice(1)}</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className={styles.modalSection}>
                      <h3><i className="fas fa-window-maximize"></i> Browsers</h3>
                      <div className={styles.breakdownList}>
                        {Object.entries(linkDetails.browserBreakdown).map(([browser, count]) => (
                          <div key={browser} className={styles.breakdownItem}>
                            <span>{browser}</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className={styles.modalSection}>
                      <h3><i className="fas fa-laptop"></i> Operating Systems</h3>
                      <div className={styles.breakdownList}>
                        {Object.entries(linkDetails.osBreakdown).map(([os, count]) => (
                          <div key={os} className={styles.breakdownItem}>
                            <span>{os}</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Clicks */}
                  <div className={styles.modalSection}>
                    <h3><i className="fas fa-history"></i> Recent Clicks</h3>
                    <div className={styles.recentClicksList}>
                      {linkDetails.recentClicks.map((click, index) => (
                        <div key={index} className={styles.recentClickItem}>
                          <div className={styles.recentClickLocation}>
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{click.city}, {click.country}</span>
                          </div>
                          <div className={styles.recentClickInfo}>
                            <span>{click.device}</span>
                            <span className={styles.divider}>•</span>
                            <span>{click.browser}</span>
                            <span className={styles.divider}>•</span>
                            <span>{new Date(click.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
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
    <PremiumGate featureName="Analytics">
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
          <Link href="/dashboard/analytics" className={`${dashboardStyles.navItem} ${dashboardStyles.navItemActive}`}>
            <i className="fas fa-chart-line"></i>
            <span>Analytics</span>
          </Link>
          <Link href="/dashboard/templates" className={dashboardStyles.navItem}>
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
              <i className="fas fa-chart-line"></i>
              <span>Analytics</span>
            </button>
          </div>
        </div>
        <div className={dashboardStyles.topBarRight}>
          {/* Profile Dropdown */}
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
