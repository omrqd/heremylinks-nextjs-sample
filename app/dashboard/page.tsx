'use client';

import { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import Image from 'next/image';

interface BioLink {
  id: string;
  title: string;
}

interface LinkCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconClass: string;
}

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  profileImage: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | null;
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('blocks');
  const [activeMenuItem, setActiveMenuItem] = useState('All Bio Links');
  const [bioLinks, setBioLinks] = useState<BioLink[]>([]);
  const [linkCards, setLinkCards] = useState<LinkCard[]>([
    {
      id: '1',
      title: 'Dribbble',
      description: 'Check this out our shot!',
      icon: 'fab fa-dribbble',
      iconClass: styles.dribbbleIcon
    },
    {
      id: '2',
      title: 'Instagram',
      description: 'Follow our instagram!',
      icon: 'fab fa-instagram',
      iconClass: styles.instagramIcon
    }
  ]);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: 'myprofile',
    displayName: 'My Profile',
    bio: 'Share all your links in one place!',
    profileImage: '',
    platform: null
  });

  // Extract username from social media URLs
  const extractSocialMediaInfo = (url: string): { platform: 'instagram' | 'facebook' | 'tiktok' | null; username: string | null } => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname;

      // Instagram
      if (hostname.includes('instagram.com')) {
        const match = pathname.match(/^\/?(@?[a-zA-Z0-9._]+)\/?/);
        if (match && match[1]) {
          const username = match[1].replace('@', '');
          return { platform: 'instagram', username };
        }
      }

      // Facebook
      if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
        const match = pathname.match(/^\/?([a-zA-Z0-9.]+)\/?/);
        if (match && match[1] && match[1] !== 'profile.php') {
          return { platform: 'facebook', username: match[1] };
        }
      }

      // TikTok
      if (hostname.includes('tiktok.com')) {
        const match = pathname.match(/^\/?@?([a-zA-Z0-9._]+)\/?/);
        if (match && match[1]) {
          const username = match[1].replace('@', '');
          return { platform: 'tiktok', username };
        }
      }

      return { platform: null, username: null };
    } catch {
      return { platform: null, username: null };
    }
  };

  // Fetch real profile data from our scraping API
  const fetchProfileData = async (platform: string, username: string): Promise<ProfileData> => {
    try {
      const response = await fetch('/api/scrape-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform, username }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape profile');
      }

      return {
        username: data.username,
        displayName: data.displayName,
        bio: data.bio,
        profileImage: data.profileImage,
        platform: data.platform
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Return fallback data if scraping fails
      return {
        username,
        displayName: `@${username}`,
        bio: 'Unable to fetch bio from profile',
        profileImage: `https://ui-avatars.com/api/?name=${username}&background=random&size=200`,
        platform: platform as 'instagram' | 'facebook' | 'tiktok'
      };
    }
  };

  // Show toast notification
  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Copy link to clipboard
  const copyLink = async () => {
    const linkText = `heremylinks.com/${profileData.username}`;
    try {
      await navigator.clipboard.writeText(linkText);
      showToastNotification('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Add bio link
  const addBioLink = (title: string) => {
    const newLink: BioLink = {
      id: `link-${Date.now()}`,
      title
    };
    setBioLinks([...bioLinks, newLink]);
  };

  // Add block
  const handleBlockClick = (blockLabel: string) => {
    addBioLink(blockLabel);
    showToastNotification(`${blockLabel} block added!`);
  };

  // Handle AI generation
  const handleGenerate = async () => {
    if (!urlInput.trim()) {
      showToastNotification('Please enter a URL');
      return;
    }

    try {
      new URL(urlInput);
    } catch {
      showToastNotification('Please enter a valid URL');
      return;
    }

    const socialInfo = extractSocialMediaInfo(urlInput);

    if (socialInfo.platform && socialInfo.username) {
      setIsGenerating(true);
      showToastNotification(`Fetching ${socialInfo.platform} profile...`);
      
      try {
        // Fetch profile data
        const data = await fetchProfileData(socialInfo.platform, socialInfo.username);
        
        // Update profile information
        setProfileData(data);
        
        // Clear existing links and add new ones based on platform
        setBioLinks([]);
        
        // Add platform-specific link
        const platformNames: { [key: string]: string } = {
          instagram: 'Instagram',
          facebook: 'Facebook',
          tiktok: 'TikTok'
        };
        
        setTimeout(() => {
          addBioLink(`${platformNames[socialInfo.platform!]} Profile`);
          addBioLink('Contact Me');
          addBioLink('More Links');
        }, 500);
        
        setIsGenerating(false);
        showToastNotification(`Profile loaded from ${platformNames[socialInfo.platform!]}! 🎉`);
        setUrlInput('');
        
      } catch (error) {
        setIsGenerating(false);
        showToastNotification('Failed to fetch profile data');
      }
    } else {
      // Regular website URL
      setIsGenerating(true);
      setTimeout(() => {
        setIsGenerating(false);
        showToastNotification('Bio link generated with AI! ✨');
        addBioLink('My Website');
        addBioLink('Portfolio');
        addBioLink('Contact Me');
      }, 2000);
    }
  };

  // Delete link card
  const deleteCard = (id: string, title: string) => {
    if (confirm(`Delete ${title}?`)) {
      setLinkCards(linkCards.filter(card => card.id !== id));
      showToastNotification(`${title} deleted`);
    }
  };

  // Edit link card
  const editCard = (title: string) => {
    showToastNotification(`Editing ${title}...`);
  };

  // Initialize sample links
  useEffect(() => {
    setTimeout(() => {
      addBioLink('My Website');
      addBioLink('Instagram');
      addBioLink('YouTube Channel');
    }, 500);
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      {/* Left Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.active : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <Image src="/imgs/white-logo.png" alt="HereMyLinks" width={120} height={32} />
          </div>
          <button 
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className={`fas fa-chevron-${sidebarOpen ? 'right' : 'left'}`}></i>
          </button>
        </div>

        <div className={styles.sidebarContent}>
          {/* Main Menu */}
          <div className={styles.menuSection}>
            <h3 className={styles.menuTitle}>Main Menu</h3>
            <nav className={styles.menuNav}>
              {['All Bio Links', 'Media', 'Tags', 'Mentions', 'Search by Profile', 'Search by Hashtags', 'Analytics', 'Integration'].map((item, idx) => (
                <a
                  key={idx}
                  href="#"
                  className={`${styles.menuItem} ${activeMenuItem === item ? styles.active : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveMenuItem(item);
                  }}
                >
                  <i className={`fas fa-${['link', 'photo-film', 'tags', 'at', 'user-search', 'hashtag', 'chart-line', 'puzzle-piece'][idx]}`}></i>
                  <span>{item}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* Account Section */}
          <div className={styles.menuSection}>
            <h3 className={styles.menuTitle}>Account</h3>
            <nav className={styles.menuNav}>
              <a href="#" className={styles.menuItem}>
                <i className="fas fa-gear"></i>
                <span>Settings</span>
              </a>
              <a href="#" className={styles.menuItem}>
                <i className="fas fa-circle-question"></i>
                <span>Help & FAQs</span>
              </a>
            </nav>
          </div>
        </div>

        {/* Logout Button */}
        <div className={styles.sidebarFooter}>
          <a href="/" className={styles.logoutBtn}>
            <i className="fas fa-right-from-bracket"></i>
            <span>Log Out</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.profileSelector}>
            <div className={styles.profileIcon}>
              <i className="fas fa-circle-user"></i>
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>{profileData.displayName}</h2>
              <p className={styles.profileLink}>heremylinks.com/{profileData.username}</p>
            </div>
            <button className={styles.dropdownBtn}>
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>

          <div className={styles.topBarActions}>
            <button className={`${styles.iconBtn} ${styles.notificationBtn}`}>
              <i className="fas fa-bell"></i>
              <span className={styles.badge}>3</span>
            </button>
            <button className={styles.iconBtn}>
              <i className="fas fa-sun"></i>
            </button>
            <button className={styles.iconBtn}>
              <i className="fas fa-moon"></i>
            </button>
            <button className={styles.viewLiveBtn}>
              <i className="fas fa-eye"></i>
              <span>View Live</span>
            </button>
          </div>
        </div>

        {/* Link Actions */}
        <div className={styles.linkActions}>
          <div className={styles.linkDisplay}>
            <span className={styles.linkText}>heremylinks.com/{profileData.username}</span>
          </div>
          <button className={`${styles.actionBtn} ${styles.copyBtn}`} onClick={copyLink}>
            <i className="fas fa-copy"></i>
            Copy link
          </button>
          <button className={`${styles.actionBtn} ${styles.addSocialBtn}`}>
            <i className="fas fa-plus"></i>
            Add to Social Media Profile
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          {['blocks', 'styles', 'settings'].map(tab => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => {
                setActiveTab(tab);
                showToastNotification(`Switched to ${tab} tab`);
              }}
            >
              {tab === 'blocks' ? 'Blocks' : tab === 'styles' ? 'Styles' : 'Page Setting'}
            </button>
          ))}
        </div>

        {/* Mobile Preview */}
        <div className={styles.mobilePreview}>
          <div className={styles.phoneMockup}>
            <div className={styles.phoneHeader}>
              <span className={styles.phoneTime}>9:41</span>
              <div className={styles.phoneNotch}></div>
              <div className={styles.phoneStatus}>
                <i className="fas fa-signal"></i>
                <i className="fas fa-wifi"></i>
                <i className="fas fa-battery-full"></i>
              </div>
            </div>

            <div className={styles.phoneContent}>
              <div className={styles.bioProfile}>
                <div className={styles.bioAvatar}>
                  {profileData.profileImage ? (
                    <img 
                      src={profileData.profileImage} 
                      alt={profileData.displayName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }}
                    />
                  ) : (
                    <i className="fas fa-user"></i>
                  )}
                </div>
                <h3 className={styles.bioName}>{profileData.displayName}</h3>
                <p className={styles.bioDescription}>{profileData.bio}</p>
              </div>

              {/* Social Icons */}
              <div className={styles.bioSocial}>
                {['facebook-f', 'twitter', 'instagram', 'linkedin-in', 'youtube'].map(icon => (
                  <a key={icon} href="#" className={styles.socialIcon}>
                    <i className={`fab fa-${icon}`}></i>
                  </a>
                ))}
              </div>

              {/* Bio Links */}
              <div className={styles.bioLinks}>
                {bioLinks.map(link => (
                  <a key={link.id} href="#" className={styles.bioLinkItem}>
                    {link.title}
                  </a>
                ))}
              </div>
            </div>

            <div className={styles.phoneFooter}>
              <div className={styles.phoneIndicator}></div>
            </div>
          </div>

          {/* Link Cards Below Preview */}
          <div className={styles.linkCards}>
            {linkCards.map(card => (
              <div key={card.id} className={styles.linkCard}>
                <div className={`${styles.cardIcon} ${card.iconClass}`}>
                  <i className={card.icon}></i>
                </div>
                <div className={styles.cardContent}>
                  <h4 className={styles.cardTitle}>{card.title}</h4>
                  <p className={styles.cardDescription}>{card.description}</p>
                </div>
                <div className={styles.cardActions}>
                  <button 
                    className={`${styles.cardBtn} ${styles.editBtn}`}
                    onClick={() => editCard(card.title)}
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                  <button 
                    className={`${styles.cardBtn} ${styles.deleteBtn}`}
                    onClick={() => deleteCard(card.id, card.title)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className={styles.rightSidebar}>
        <div className={styles.aiBuilder}>
          <h2 className={styles.builderTitle}>
            Build Your <span className={styles.highlight}>Bio Link</span> With AI ⚡
          </h2>
          <p className={styles.builderDescription}>
            Paste your Instagram, Facebook, TikTok, or website URL to start!
          </p>
          
          <div className={styles.exampleUrls}>
            <small className={styles.exampleText}>Try: instagram.com/username, facebook.com/username, tiktok.com/@username</small>
          </div>

          <div className={styles.urlInputGroup}>
            <input
              type="url"
              className={styles.urlInput}
              placeholder="https://instagram.com/username"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
              className={styles.generateBtn}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Theme Recommendation */}
        <div className={styles.themeSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Theme Recommendation</h3>
            <a href="#" className={styles.seeAllLink}>See All Theme</a>
          </div>
          <div className={styles.themeGrid}>
            {['dark', 'light', 'gradient', 'minimal'].map(theme => (
              <div key={theme} className={`${styles.themeCard} ${styles[`theme${theme.charAt(0).toUpperCase() + theme.slice(1)}`]}`}>
                <div className={styles.themePreview}>
                  <div className={styles.themeMockup}>
                    <div className={styles.themeAvatar}></div>
                    <div className={styles.themeBar}></div>
                    <div className={styles.themeBar}></div>
                    <div className={styles.themeBar}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add More Blocks */}
        <div className={styles.blocksSection}>
          <h3 className={styles.sectionTitle}>Add More Blocks</h3>
          <div className={styles.blocksGrid}>
            {[
              { label: 'Text', icon: 'font', color: 'text' },
              { label: 'Calendar', icon: 'calendar', color: 'calendar' },
              { label: 'Booking List', icon: 'list-check', color: 'booking' },
              { label: 'Button', icon: 'square', color: 'button' },
              { label: 'Link', icon: 'link', color: 'link' },
              { label: 'Image', icon: 'image', color: 'image' },
              { label: 'Map', icon: 'map-location-dot', color: 'map' },
              { label: 'Newsletter', icon: 'envelope', color: 'newsletter' }
            ].map(block => (
              <button
                key={block.label}
                className={`${styles.blockItem} ${styles[`${block.color}Block`]}`}
                onClick={() => handleBlockClick(block.label)}
              >
                <div className={styles.blockIcon}>
                  <i className={`fas fa-${block.icon}`}></i>
                </div>
                <span className={styles.blockLabel}>{block.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Toast Notification */}
      <div className={`${styles.toast} ${showToast ? styles.show : ''}`}>
        <i className="fas fa-check-circle"></i>
        <span className={styles.toastMessage}>{toastMessage}</span>
      </div>

      {/* Mobile Hamburger */}
      {typeof window !== 'undefined' && window.innerWidth <= 768 && (
        <button
          className={styles.hamburgerBtn}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className="fas fa-bars"></i>
        </button>
      )}
    </div>
  );
}

