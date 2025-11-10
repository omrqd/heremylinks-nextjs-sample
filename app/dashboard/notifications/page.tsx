'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './notifications.module.css';
import dashboardStyles from '../dashboard.module.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  // User profile
  const [profileImage, setProfileImage] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isPublished, setIsPublished] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserData();
      loadNotifications();
    }
  }, [status, router, filter]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile', { cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json();
        const u = payload.user ?? payload;

        setProfileImage(u?.profileImage ?? u?.profile_image ?? '');
        setDisplayName(u?.name ?? u?.username ?? 'User');
        setUsername(u?.username ?? '');
        setIsPublished(Boolean(u?.isPublished ?? u?.is_published ?? false));
        setIsPremium(Boolean(u?.isPremium ?? u?.is_premium ?? false));
        setIsAdmin(Boolean(u?.isAdmin ?? u?.is_admin ?? false));
        setUserEmail(session?.user?.email || '');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') {
        params.append('unreadOnly', 'true');
      }
      
      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'error': return 'fa-times-circle';
      default: return 'fa-info-circle';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return styles.typeSuccess;
      case 'warning': return styles.typeWarning;
      case 'error': return styles.typeError;
      default: return styles.typeInfo;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (status === 'loading') {
    return (
      <div className={dashboardStyles.dashboardContainer}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.dashboardContainer}>
      {/* Fixed Left Sidebar */}
      <aside className={dashboardStyles.leftSidebar}>
        {/* Logo */}
        <div className={dashboardStyles.sidebarLogo}>
          <Image src="/imgs/white-logo.png" alt="HereMyLinks" width={100} height={25} priority />
          {isPremium && (
            <div className={dashboardStyles.proBadge}>
              <span className={dashboardStyles.proBadgeText}>PRO</span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className={dashboardStyles.sidebarNav}>
          <Link href="/dashboard" className={dashboardStyles.navItem}>
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </Link>
          <Link href="/dashboard/analytics" className={dashboardStyles.navItem}>
            <i className="fas fa-chart-line"></i>
            <span>Analytics</span>
            {!isPremium && <span className={dashboardStyles.proBadgeSmall}>PRO</span>}
          </Link>
          <Link href="/dashboard/templates" className={dashboardStyles.navItem}>
            <i className="fas fa-palette"></i>
            <span>Templates</span>
            {!isPremium && <span className={dashboardStyles.proBadgeSmall}>PRO</span>}
          </Link>
        </nav>

        {/* Make Money Section */}
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

        {/* Bottom Section */}
        <div className={dashboardStyles.sidebarBottom}>
          {isAdmin && (
            <Link href="/admin" className={dashboardStyles.navItem} style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
              borderLeft: '3px solid #8b5cf6'
            }}>
              <i className="fas fa-shield-alt" style={{ color: '#8b5cf6' }}></i>
              <span style={{ color: '#8b5cf6', fontWeight: '600' }}>Admin Dashboard</span>
            </Link>
          )}
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
            <Link href="/dashboard" className={dashboardStyles.topBarTab}>
              <i className="fas fa-arrow-left"></i>
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
        <div className={dashboardStyles.topBarRight}>
          {/* Settings */}
          <button className={dashboardStyles.topBarIcon} title="Settings">
            <i className="fas fa-cog"></i>
          </button>
          
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
                ></div>
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
                      <p className={dashboardStyles.profileDropdownEmail}>{userEmail}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.profileDropdownDivider}></div>
                  <button 
                    className={dashboardStyles.profileDropdownItem}
                    onClick={() => signOut({ callbackUrl: '/login' })}
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={dashboardStyles.mainContent}>
        {/* Notifications Content */}
        <div className={styles.container}>
          {/* Header with Filter Tabs */}
          <div className={styles.header}>
            <div className={styles.titleSection}>
              <i className="fas fa-bell"></i>
              <div>
                <h2>All Notifications</h2>
                <p className={styles.subtitle}>
                  {unreadCount > 0 
                    ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                    : 'You\'re all caught up!'}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className={styles.markAllBtn}
              >
                <i className="fas fa-check-double"></i>
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            <button
              onClick={() => setFilter('all')}
              className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`${styles.filterTab} ${filter === 'unread' ? styles.filterTabActive : ''}`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className={styles.loading}>
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-bell-slash"></i>
              <h3>No notifications</h3>
              <p>
                {filter === 'unread' 
                  ? 'You don\'t have any unread notifications'
                  : 'You haven\'t received any notifications yet'}
              </p>
            </div>
          ) : (
            <div className={styles.notificationsList}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationCard} ${!notification.is_read ? styles.notificationUnread : ''}`}
                >
                  <div className={`${styles.notificationIcon} ${getTypeColor(notification.type)}`}>
                    <i className={`fas ${getTypeIcon(notification.type)}`}></i>
                  </div>

                  <div className={styles.notificationContent}>
                    <div className={styles.notificationHeader}>
                      <h3 className={styles.notificationTitle}>
                        {notification.title}
                        {!notification.is_read && (
                          <span className={styles.unreadDot}></span>
                        )}
                      </h3>
                    </div>
                    
                    <p className={styles.notificationMessage}>{notification.message}</p>
                    
                    <div className={styles.notificationFooter}>
                      <span className={styles.notificationTime}>
                        <i className="fas fa-clock"></i>
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      
                      <div className={styles.notificationActions}>
                        {notification.link && (
                          <a
                            href={notification.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionLink}
                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                          >
                            <i className="fas fa-external-link-alt"></i>
                            View Details
                          </a>
                        )}
                        
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className={styles.actionBtn}
                          >
                            <i className="fas fa-check"></i>
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
