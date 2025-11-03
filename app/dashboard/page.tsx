'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import FileUpload from '@/components/FileUpload';
import dynamic from 'next/dynamic';
import { CropData } from '@/components/ImageCropModal';
import { useRouter } from 'next/navigation';

// Dynamically import ImageCropModal
const ImageCropModal = dynamic(() => import('@/components/ImageCropModal'), { ssr: false });
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './dashboard.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import Sidebar from './components/Sidebar';
import FirstLinkSetup from './components/FirstLinkSetup';
import TemplateChoice from './components/TemplateChoice';

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  image?: string;
  layout?: string;
  backgroundColor?: string;
  textColor?: string;
  isTransparent?: boolean;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

// Sortable Link Item Component
function SortableLinkItem({ link, onDelete, onUpdate, selectedTemplate }: { link: BioLink; onDelete: (id: string) => void; onUpdate: (id: string, updates: Partial<BioLink>) => void; selectedTemplate: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const [showColorControls, setShowColorControls] = useState(false);

  const handleLinkClick = (e: React.MouseEvent) => {
    // If clicking on the link itself (not color controls or action buttons), toggle color controls
    if ((e.target as HTMLElement).closest(`.${styles.linkColorControls}`) || 
        (e.target as HTMLElement).closest(`.${styles.linkActions}`)) {
      return;
    }
    setShowColorControls(!showColorControls);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const layoutClass = link.layout 
    ? styles[`preview${link.layout.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`] 
    : styles.previewSimple;

  // Determine if this is template3 and should use background image
  const isTemplate3 = selectedTemplate === 'template3';
  const shouldUseBackgroundImage = isTemplate3 && link.image && (
    link.layout === 'image-top' || 
    link.layout === 'image-top-left' || 
    link.layout === 'image-top-right' || 
    link.layout === 'image-large'
  );
  const hasImageBackground = shouldUseBackgroundImage;

  const linkStyle = {
    // For template3 background images, make the inner content transparent by default
    backgroundColor: shouldUseBackgroundImage ? 'transparent' : (link.isTransparent ? 'transparent' : (link.backgroundColor || '#ffffff')),
    color: link.textColor || '#1a1a1a',
  };

  const itemStyle = {
    ...style,
    ...(link.isTransparent && { 
      backgroundColor: 'transparent',
      border: '2px dashed #cbd5e1' 
    }),
    // For template3, apply image as background only for specific layouts
    ...(shouldUseBackgroundImage && {
      backgroundImage: `url(${link.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }),
  };

  return (
    <div 
      ref={setNodeRef} 
      style={itemStyle} 
      className={`${styles.bioLinkItem} ${layoutClass} ${isDragging ? styles.dragging : ''} ${link.isTransparent ? styles.transparentLink : ''} ${hasImageBackground ? styles.hasImage : ''}`}
      onClick={handleLinkClick}
    >
      {/* Image Top - Outside linkInner wrapper (only for non-template3) */}
      {!isTemplate3 && link.image && (link.layout === 'image-top' || link.layout === 'image-top-left' || link.layout === 'image-top-right' || link.layout === 'image-large') && (
        <div className={styles.previewLinkImageTop}>
          <img src={link.image} alt={link.title} />
        </div>
      )}

      <div className={styles.linkInner} style={linkStyle}>
      {/* Template3: Render icon badge in top-right and title in bottom-left */}
      {isTemplate3 && hasImageBackground ? (
        <>
          {link.icon && (
            <div className={styles.linkIcon}>
              <i className={link.icon}></i>
            </div>
          )}
          <span className={styles.linkTitle}>{link.title}</span>
        </>
      ) : (
        <>
          {link.image && link.layout?.includes('image-left') && (
            <div className={styles.previewLinkImage}>
              <img src={link.image} alt={link.title} />
            </div>
          )}
          
          <div className={styles.linkContent}>
            {link.icon && !link.image && (
              <div className={styles.linkIcon}>
                <i className={link.icon}></i>
              </div>
            )}
            <span className={styles.linkTitle} style={{ color: link.textColor || '#1a1a1a' }}>{link.title}</span>
          </div>
          
          {link.image && link.layout?.includes('image-right') && (
            <div className={styles.previewLinkImage}>
              <img src={link.image} alt={link.title} />
            </div>
          )}
        </>
      )}
      </div>

      {/* Link Color Controls */}
      {showColorControls && (
        <div 
          className={styles.linkColorControls}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent any blur events
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <label className={styles.colorControlLabel}>
            <i className="fas fa-fill-drip"></i>
            <input
              type="color"
              value={link.backgroundColor || '#ffffff'}
              onChange={(e) => onUpdate(link.id, { backgroundColor: e.target.value, isTransparent: false })}
              className={styles.colorPicker}
              title="Change background color"
            />
          </label>
          <label className={styles.colorControlLabel}>
            <i className="fas fa-font"></i>
            <input
              type="color"
              value={link.textColor || '#1a1a1a'}
              onChange={(e) => onUpdate(link.id, { textColor: e.target.value })}
              className={styles.colorPicker}
              title="Change text color"
            />
          </label>
          <button
            className={styles.transparentBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(link.id, { isTransparent: !link.isTransparent });
            }}
            title={link.isTransparent ? 'Solid background' : 'Transparent background'}
          >
            <i className={link.isTransparent ? 'fas fa-square' : 'fas fa-square-full'}></i>
          </button>
        </div>
      )}
      
      {/* Action Buttons - Drag and Delete */}
      <div className={styles.linkActions}>
        <button 
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
        >
          <i className="fas fa-grip-vertical"></i>
        </button>
        <button 
          className={styles.deleteLinkBtn}
          onClick={() => onDelete(link.id)}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [heroHeight, setHeroHeight] = useState(300);
  const [hideProfilePicture, setHideProfilePicture] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumPlanType, setPremiumPlanType] = useState<string | null>(null);
  const [isResizingHero, setIsResizingHero] = useState(false);
  const [isHoveringMockup, setIsHoveringMockup] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [displayName, setDisplayName] = useState('Your Name');
  const [username, setUsername] = useState('yourname');
  const [bio, setBio] = useState('Add your bio here');
  const [bioLinks, setBioLinks] = useState<BioLink[]>([]);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showLinkTypeModal, setShowLinkTypeModal] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showSocialIconsModal, setShowSocialIconsModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  
  // Publish modal states
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishUsername, setPublishUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [hasCustomUsername, setHasCustomUsername] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  
  // Share URL modal state
  const [showShareUrlModal, setShowShareUrlModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  const [tempBio, setTempBio] = useState(bio);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Active section state - tracks which inline section is open
  const [activeSection, setActiveSection] = useState<'none' | 'addLink' | 'socials' | 'templates' | 'tiktok'>('none');

  // Add Link Section states
  const [addLinkStep, setAddLinkStep] = useState<'layout' | 'form'>('layout');
  const [selectedLayout, setSelectedLayout] = useState<string>('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkImage, setLinkImage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const linkImageInputRef = useRef<HTMLInputElement>(null);

  // Socials states
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [socialsStep, setSocialsStep] = useState<'platforms' | 'input'>('platforms');
  const [selectedPlatform, setSelectedPlatform] = useState<{ name: string; icon: string } | null>(null);
  const [socialUrl, setSocialUrl] = useState('');

  // Templates states
  const [selectedTemplate, setSelectedTemplate] = useState('template3');

  // Bottom action buttons states
  const [showAddTextModal, setShowAddTextModal] = useState(false);
  const [addTextContent, setAddTextContent] = useState('');
  const [customText, setCustomText] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [backgroundVideo, setBackgroundVideo] = useState('');
  const [cardBackgroundColor, setCardBackgroundColor] = useState('#ffffff');
  const [cardBackgroundImage, setCardBackgroundImage] = useState('');
  const [cardBackgroundVideo, setCardBackgroundVideo] = useState('');
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  // Image crop modal states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropAspectRatio, setCropAspectRatio] = useState<number | null>(16 / 9);
  const [cropUploadType, setCropUploadType] = useState<'hero' | 'background' | 'card-background'>('hero');

  // Text color states
  const [usernameColor, setUsernameColor] = useState(selectedTemplate === 'template3' ? '#ffffff' : '#1a1a1a');
  const [bioColor, setBioColor] = useState('#6b7280');
  const [customTextColor, setCustomTextColor] = useState('#4b5563');

  // Video refs for Safari compatibility
  const pageVideoRef = useRef<HTMLVideoElement>(null);
  const cardVideoRef = useRef<HTMLVideoElement>(null);

  // First-time user setup states
  const [showFirstLinkSetup, setShowFirstLinkSetup] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [showTemplateChoice, setShowTemplateChoice] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle successful first link setup
  const handleFirstLinkSetupSuccess = (newUsername: string) => {
    setUsername(newUsername);
    setPublishUsername(newUsername);
    setHasCustomUsername(true);
    setIsPublished(true);
    setShowFirstLinkSetup(false);
    setIsFirstTimeUser(false);
    setShowTemplateChoice(true);
    showToast('Welcome! Your profile is now live! 🎉', 'success');
  };

  // Handle drag end to reorder links
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = bioLinks.findIndex((link) => link.id === active.id);
      const newIndex = bioLinks.findIndex((link) => link.id === over.id);

      const newBioLinks = arrayMove(bioLinks, oldIndex, newIndex);
      setBioLinks(newBioLinks);

      // Update order in database
      try {
        await fetch('/api/links/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            links: newBioLinks.map((link, index) => ({ id: link.id, order: index })),
          }),
        });
      } catch (error) {
        console.error('Error updating link order:', error);
        // Revert on error
        setBioLinks(bioLinks);
      }
    }
  };

  // Load user profile and links from database
  useEffect(() => {
    const loadUserData = async () => {
      if (status === 'loading') return;
      
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        // Check for pending payments first (in case user paid but didn't complete redirect)
        try {
          await fetch('/api/billing/check-payment-status', { method: 'POST' });
        } catch (error) {
          console.log('Payment check skipped:', error);
        }

        // Load user profile
        const profileResponse = await fetch('/api/user/profile');
        let userData = null;
        if (profileResponse.ok) {
          const { user } = await profileResponse.json();
          userData = user;
          setDisplayName(user.name || 'Your Name');
          setUsername(user.username || 'yourname');
          setBio(user.bio || 'Add your bio here');
          setProfileImage(user.profileImage || '');
          setHeroImage(user.heroImage || '');
          setHeroHeight(user.heroHeight || 300);
          setHideProfilePicture(user.hideProfilePicture || false);
          setIsPublished(user.isPublished || false);
          setSelectedTemplate(user.template || 'template3');
          setCustomText(user.customText || '');
          setBackgroundImage(user.backgroundImage || '');
          setBackgroundVideo(user.backgroundVideo || '');
          setCardBackgroundColor(user.cardBackgroundColor || '#ffffff');
          setCardBackgroundImage(user.cardBackgroundImage || '');
          setCardBackgroundVideo(user.cardBackgroundVideo || '');
          setUsernameColor(
            user.usernameColor || ((user.template || 'template3') === 'template3' ? '#ffffff' : '#1a1a1a')
          );
          setBioColor(user.bioColor || '#6b7280');
          setCustomTextColor(user.customTextColor || '#4b5563');
          setIsPremium(user.isPremium || false);
          setPremiumPlanType(user.premiumPlanType || null);
          
          // Check if user has set a custom username (not auto-generated from email)
          // Auto-generated usernames are created from email prefix (e.g., mora.dxbuae@gmail.com -> moradxbuae)
          // We detect this by checking if username matches the session email prefix
          const emailPrefix = session?.user?.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || '';
          const isAutoGenerated = user.username === emailPrefix;
          setHasCustomUsername(user.username && !isAutoGenerated && user.username.length >= 3);
          setPublishUsername(user.username || '');
        }

        // Load bio links
        const linksResponse = await fetch('/api/links');
        if (linksResponse.ok) {
          const { links } = await linksResponse.json();
          setBioLinks(links);
          
          // Check if user is first-time user (has auto-generated username and no published links)
          if (userData) {
            const emailPrefix = session?.user?.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || '';
            const isAutoGenerated = userData.username === emailPrefix;
            const hasNoLinks = links.length === 0;
            const isNotPublished = !userData.isPublished;
            
            if (isAutoGenerated && hasNoLinks && isNotPublished) {
              setIsFirstTimeUser(true);
              setShowFirstLinkSetup(true);
            }
          }
        }

        // Load social links
        const socialsResponse = await fetch('/api/socials');
        if (socialsResponse.ok) {
          const { socials } = await socialsResponse.json();
          setSocialLinks(socials);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [session, status, router]);

  // Safari video compatibility - ensure videos loop infinitely
  useEffect(() => {
    const handleVideoLoop = (videoElement: HTMLVideoElement | null) => {
      if (!videoElement) return;

      const playVideo = () => {
        videoElement.play().catch(err => {
          console.log('Video autoplay prevented:', err);
        });
      };

      const handleEnded = () => {
        videoElement.currentTime = 0;
        playVideo();
      };

      // Force play on mount
      playVideo();

      // Add ended event listener to restart video (Safari fallback)
      videoElement.addEventListener('ended', handleEnded);

      return () => {
        videoElement.removeEventListener('ended', handleEnded);
      };
    };

    const cleanupPage = handleVideoLoop(pageVideoRef.current);
    const cleanupCard = handleVideoLoop(cardVideoRef.current);

    return () => {
      cleanupPage?.();
      cleanupCard?.();
    };
  }, [backgroundVideo, cardBackgroundVideo]);

  const addLink = () => {
    const newLink: BioLink = {
      id: Date.now().toString(),
      title: 'New Link',
      url: '#'
    };
    setBioLinks([...bioLinks, newLink]);
    setShowEditMenu(false);
  };

  const deleteLink = async (id: string) => {
    try {
      const response = await fetch(`/api/links?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBioLinks(bioLinks.filter(link => link.id !== id));
        showToast('Link deleted successfully', 'success');
      } else {
        showToast('Failed to delete link', 'error');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      showToast('Failed to delete link', 'error');
    }
  };

  const updateLink = async (id: string, updates: Partial<BioLink>) => {
    try {
      const response = await fetch('/api/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        setBioLinks(bioLinks.map(link => 
          link.id === id ? { ...link, ...updates } : link
        ));
      }
    } catch (error) {
      console.error('Error updating link:', error);
    }
  };

  const handlePublish = () => {
    setShowPublishModal(true);
  };

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, dashes, and underscores');
      return false;
    }

    setIsCheckingUsername(true);
    setUsernameError('');

    try {
      const response = await fetch(`/api/username/check?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (!data.available) {
        setUsernameError('This username is already taken');
        return false;
      }

      setUsernameError('');
      return true;
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Failed to check username availability');
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handlePublishConfirm = async () => {
    try {
      setIsSaving(true);

      // If user hasn't set a custom username yet, validate and save it
      if (!hasCustomUsername) {
        const isAvailable = await checkUsernameAvailability(publishUsername);
        if (!isAvailable) {
          setIsSaving(false);
          return;
        }

        // Save the new username
        const usernameResponse = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: publishUsername.toLowerCase() }),
        });

        if (!usernameResponse.ok) {
          const data = await usernameResponse.json();
          setUsernameError(data.error || 'Failed to save username');
          setIsSaving(false);
          return;
        }

        setHasCustomUsername(true);
        setUsername(publishUsername.toLowerCase());
      }

      // Publish the page
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: true }),
      });

      if (response.ok) {
        setIsPublished(true);
        setShowPublishModal(false);
        showToast(`Your page has been published! 🎉 Visit heremylinks.com/${(publishUsername || username).toLowerCase()}`, 'success');
      } else {
        showToast('Failed to publish page', 'error');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      showToast('Failed to publish page', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTikTokAutofill = async () => {
    if (!tiktokUsername.trim()) {
      showToast('Please enter a TikTok username', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/scrape-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'tiktok',
          username: tiktokUsername.replace('@', '')
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update profile with TikTok data
        setDisplayName(data.displayName);
        setUsername(data.username);
        setBio(data.bio);
        setProfileImage(data.profileImage);

        // Add TikTok link to bio links
        const tiktokLink: BioLink = {
          id: Date.now().toString(),
          title: 'TikTok',
          url: `https://tiktok.com/@${data.username}`,
          icon: 'fab fa-tiktok'
        };
        setBioLinks([tiktokLink]);

        setShowTikTokModal(false);
        setTiktokUsername('');
        showToast('Profile autofilled from TikTok! 🎉', 'success');
      } else {
        showToast('Failed to fetch TikTok profile. Please check the username and try again.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to fetch TikTok profile. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Profile editing handlers
  const handleNameClick = () => {
    setTempName(displayName);
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (tempName.trim()) {
      setDisplayName(tempName.trim());
      // Save to database
      try {
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tempName.trim() }),
        });
      } catch (error) {
        console.error('Error saving name:', error);
      }
    }
    setIsEditingName(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const handleBioClick = () => {
    setTempBio(bio);
    setIsEditingBio(true);
  };

  const handleBioSave = async () => {
    // Allow empty bio - user can completely remove it
      setBio(tempBio.trim());
      // Save to database
      try {
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bio: tempBio.trim() }),
        });
      } catch (error) {
        console.error('Error saving bio:', error);
    }
    setIsEditingBio(false);
  };

  const handleBioKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBioSave();
    } else if (e.key === 'Escape') {
      setIsEditingBio(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageUpload = async (fileUrl: string) => {
    console.log('📤 Uploading new profile image:', fileUrl);
    setProfileImage(fileUrl);
    
    // Save to database
    try {
      console.log('📡 Sending PATCH request to /api/user/profile...');
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: fileUrl }),
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error('Failed to update profile');
      }
      
      const responseData = await response.json();
      console.log('✅ API Response:', responseData);
      
      showToast('Profile image updated successfully', 'success');
    } catch (error) {
      console.error('❌ Error saving image:', error);
      showToast('Failed to update profile image', 'error');
    }
  };

  const handleHeroImageUpload = async (fileUrl: string) => {
    setHeroImage(fileUrl);
    
    // Save to database
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroImage: fileUrl }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update hero image');
      }
      
      showToast('Hero image updated successfully! 🎨', 'success');
    } catch (error) {
      console.error('Error saving hero image:', error);
      showToast('Failed to update hero image', 'error');
    }
  };

  // Handle hero height change
  const handleHeroHeightChange = async (newHeight: number) => {
    setHeroHeight(newHeight);
    
    // Save to database
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroHeight: newHeight }),
      });
    } catch (error) {
      console.error('Error saving hero height:', error);
    }
  };

  // Handle hero banner hover with delay
  const handleHeroBannerEnter = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHoveringMockup(true);
  };

  const handleHeroBannerLeave = () => {
    // Set a 2-second delay before hiding the resize handle
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHoveringMockup(false);
      hoverTimeoutRef.current = null;
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Toggle profile picture visibility
  const handleToggleProfilePicture = async () => {
    const newValue = !hideProfilePicture;
    setHideProfilePicture(newValue);
    
    // Save to database
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hideProfilePicture: newValue }),
      });
      showToast(
        newValue ? 'Profile picture hidden' : 'Profile picture shown',
        'success'
      );
    } catch (error) {
      console.error('Error toggling profile picture:', error);
      showToast('Failed to update profile picture visibility', 'error');
    }
  };

  // Handle crop complete
  const handleCropComplete = async (croppedImageUrl: string, cropData: CropData) => {
    setShowCropModal(false);
    setIsUploadingBackground(true);

    try {
      // Convert blob URL to File
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });

      // Upload the cropped file
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`/api/upload?type=${cropUploadType === 'hero' ? 'hero' : 'profile'}`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        showToast('Failed to upload cropped image', 'error');
        return;
      }

      const { fileUrl } = await uploadResponse.json();

      // Handle different upload types
      if (cropUploadType === 'hero') {
        handleHeroImageUpload(fileUrl);
      } else if (cropUploadType === 'background' || cropUploadType === 'card-background') {
        // For background images, use the background upload endpoint
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');
        
        const bgUploadResponse = await fetch('/api/upload/background', {
          method: 'POST',
          body: formData,
        });
        
        if (!bgUploadResponse.ok) {
          showToast('Failed to upload image', 'error');
          return;
        }
        
        const { path } = await bgUploadResponse.json();
        
        if (cropUploadType === 'background') {
          setBackgroundImage(path);
          await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backgroundImage: path }),
          });
          showToast('Background image updated! 🎨', 'success');
        } else {
          setCardBackgroundImage(path);
          await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardBackgroundImage: path }),
          });
          showToast('Card background image updated! 🎨', 'success');
        }
      }

      // Clean up blob URL
      URL.revokeObjectURL(croppedImageUrl);
    } catch (error) {
      console.error('Error uploading cropped image:', error);
      showToast('Failed to upload cropped image', 'error');
    } finally {
      setIsUploadingBackground(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
  };

  // Add Link Section handlers (changed to modal)
  const openAddLinkSection = () => {
    setShowLinkTypeModal(true);
    setSelectedLayout('');
    setLinkTitle('');
    setLinkUrl('');
    setLinkImage('');
  };

  const handleLinkTypeSelect = (layout: string) => {
    setSelectedLayout(layout);
    setShowLinkTypeModal(false);
    setShowAddLinkModal(true);
  };

  const closeAddLinkSection = () => {
    setActiveSection('none');
    setAddLinkStep('layout');
    setSelectedLayout('');
    setLinkTitle('');
    setLinkUrl('');
    setLinkImage('');
  };

  const handleLayoutSelect = (layout: string) => {
    setSelectedLayout(layout);
    setAddLinkStep('form');
  };

  const handleLinkImageUpload = (fileUrl: string) => {
    setLinkImage(fileUrl);
  };

  // These handlers are no longer needed as we're using the FileUpload component

  const handleAddLink = async () => {
    if (!linkTitle.trim() || !linkUrl.trim()) {
      showToast('Please fill in both title and URL', 'error');
      return;
    }

    try {
      setIsSaving(true);
      
      // Ensure URL has http:// or https:// prefix
      let formattedUrl = linkUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: linkTitle.trim(),
          url: formattedUrl,
          icon: selectedLayout.includes('image') ? undefined : 'fas fa-link',
          image: linkImage || undefined,
          layout: selectedLayout,
          order: bioLinks.length,
        }),
      });

      if (response.ok) {
        const { link } = await response.json();
        setBioLinks([...bioLinks, link]);
        setShowAddLinkModal(false);
        setLinkTitle('');
        setLinkUrl('');
        setLinkImage('');
        setSelectedLayout('');
        showToast('Link added successfully! 🎉', 'success');
      } else {
        showToast('Failed to add link', 'error');
      }
    } catch (error) {
      console.error('Error adding link:', error);
      showToast('Failed to add link', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const backToLayoutSelection = () => {
    setAddLinkStep('layout');
    setLinkTitle('');
    setLinkUrl('');
    setLinkImage('');
  };

  // Social Media Platforms
  const socialPlatforms = [
    { name: 'Instagram', icon: 'fab fa-instagram' },
    { name: 'Facebook', icon: 'fab fa-facebook-f' },
    { name: 'Twitter', icon: 'fab fa-twitter' },
    { name: 'TikTok', icon: 'fab fa-tiktok' },
    { name: 'YouTube', icon: 'fab fa-youtube' },
    { name: 'LinkedIn', icon: 'fab fa-linkedin-in' },
    { name: 'Snapchat', icon: 'fab fa-snapchat' },
    { name: 'Pinterest', icon: 'fab fa-pinterest' },
    { name: 'Twitch', icon: 'fab fa-twitch' },
    { name: 'Discord', icon: 'fab fa-discord' },
    { name: 'WhatsApp', icon: 'fab fa-whatsapp' },
    { name: 'Telegram', icon: 'fab fa-telegram' },
    { name: 'Reddit', icon: 'fab fa-reddit' },
    { name: 'GitHub', icon: 'fab fa-github' },
    { name: 'Website', icon: 'fas fa-globe' },
  ];

  const openSocialsSection = () => {
    setShowSocialIconsModal(true);
    setSocialsStep('platforms');
    setSelectedPlatform(null);
    setSocialUrl('');
  };

  const closeSocialsSection = () => {
    setShowSocialIconsModal(false);
    setSocialsStep('platforms');
    setSelectedPlatform(null);
    setSocialUrl('');
  };

  const selectPlatform = (platform: { name: string; icon: string }) => {
    setSelectedPlatform(platform);
    setSocialsStep('input');
  };

  const backToPlatformSelection = () => {
    setSocialsStep('platforms');
    setSocialUrl('');
  };

  const handleAddSocial = async () => {
    if (!selectedPlatform || !socialUrl.trim()) {
      showToast('Please enter a valid URL', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/socials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform.name,
          url: socialUrl.trim(),
          icon: selectedPlatform.icon,
        }),
      });

      if (response.ok) {
        const { social } = await response.json();
        setSocialLinks([...socialLinks, social]);
        closeSocialsSection();
        showToast('Social link added successfully! 🎉', 'success');
      } else {
        showToast('Failed to add social link', 'error');
      }
    } catch (error) {
      console.error('Error adding social link:', error);
      showToast('Failed to add social link', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSocialLink = async (id: string) => {
    try {
      const response = await fetch(`/api/socials/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSocialLinks(socialLinks.filter(social => social.id !== id));
        showToast('Social link removed', 'success');
      } else {
        showToast('Failed to delete social link', 'error');
      }
    } catch (error) {
      console.error('Error deleting social link:', error);
      showToast('Failed to delete social link', 'error');
    }
  };

  // Templates functions
  const templates = [
    {
      id: 'default',
      name: 'Default',
      description: 'Clean and modern design with gradient colors',
      preview: '/imgs/template-default.png',
    },
    {
      id: 'template1',
      name: 'Bold & Classic',
      description: 'Bold black borders with clean white background',
      preview: '/imgs/template1.png',
    },
    {
      id: 'template2',
      name: 'Ocean Gradient',
      description: 'Teal to blue gradient with elegant link cards',
      preview: '/imgs/template2.png',
    },
    {
      id: 'template3',
      name: 'Influencer Hero',
      description: 'Modern hero image with grid-based link cards',
      preview: '/imgs/screen.png',
    },
  ];

  const openTemplatesSection = () => {
    setActiveSection('templates');
  };

  // Open Templates modal (Tools → Templates)
  const openTemplatesModal = () => {
    setActiveSection('none');
    setShowTemplateChoice(true);
  };

  const closeTemplatesSection = () => {
    setActiveSection('none');
  };

  const handleTemplateSelect = async (templateId: string) => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: templateId }),
      });

      if (response.ok) {
        setSelectedTemplate(templateId);
        closeTemplatesSection();
        showToast('Template applied successfully! 🎨', 'success');
      } else {
        showToast('Failed to apply template', 'error');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      showToast('Failed to apply template', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openTikTokSection = () => {
    setActiveSection('tiktok');
    setTiktokUsername('');
  };

  const closeTikTokSection = () => {
    setActiveSection('none');
    setTiktokUsername('');
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Image Crop Modal */}
      {showCropModal && imageToCrop && (
        <ImageCropModal
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={cropAspectRatio}
        />
      )}

      {/* Fixed Left Sidebar */}
      <aside className={styles.leftSidebar}>
        {/* Logo */}
        <div className={styles.sidebarLogo}>
          <Image src="/imgs/white-logo.png" alt="HereMyLinks" width={100} height={25} priority />
          {isPremium && (
            <div className={styles.proBadge}>
              <span className={styles.proBadgeText}>PRO</span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className={styles.sidebarNav}>
          <Link href="/dashboard" className={`${styles.navItem} ${styles.navItemActive}`}>
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

        {/* Make Money Section */}
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

        {/* Bottom Section */}
        <div className={styles.sidebarBottom}>
          <Link href="/dashboard/billing" className={styles.navItem}>
            <i className="fas fa-credit-card"></i>
            <span>Billing</span>
          </Link>
          {!isPremium && (
          <Link href="/dashboard/verified" className={styles.navItem}>
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
            {/* Tools Dropdown */}
            <div className={styles.dropdownWrapper}>
          <button 
                className={styles.topBarTab}
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
          >
                <i className="fas fa-tools"></i>
                <span>Tools</span>
                <i className={`fas fa-chevron-down ${styles.dropdownIcon}`}></i>
          </button>
              
              {showToolsDropdown && (
                <>
                  <div 
                    className={styles.dropdownOverlay} 
                    onClick={() => setShowToolsDropdown(false)}
                  />
                  <div className={styles.dropdownMenu}>
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        openAddLinkSection();
                        setShowToolsDropdown(false);
                      }}
                    >
                      <i className="fas fa-link"></i>
                      <span>Add Link</span>
                    </button>
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        openTemplatesModal();
                        setShowToolsDropdown(false);
                      }}
                    >
                      <i className="fas fa-palette"></i>
                      <span>Templates</span>
                    </button>
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        openSocialsSection();
                        setShowToolsDropdown(false);
                      }}
                    >
                      <i className="fas fa-hashtag"></i>
                      <span>Social Icons</span>
                    </button>
                  </div>
                </>
              )}
        </div>
        
            <button className={`${styles.topBarTab} ${styles.topBarTabActive}`}>
              <span>Profile</span>
          </button>
          </div>

          {/* Action Buttons */}
          <div className={styles.topBarActions}>
          <button 
              className={styles.actionButton}
              onClick={openAddLinkSection}
              title="Add new item"
          >
              <i className="fas fa-plus"></i>
          </button>
            
            <div className={styles.dropdownWrapper}>
              <button 
                className={styles.actionButton}
                onClick={() => setShowEditMenu(!showEditMenu)}
                title="Edit options"
              >
                <i className="fas fa-pen"></i>
              </button>
              
              {showEditMenu && (
                <>
                  <div 
                    className={styles.dropdownOverlay} 
                    onClick={() => setShowEditMenu(false)}
                  />
                  <div className={styles.dropdownMenu}>
                    {/* Page Background Video */}
                    <button className={styles.dropdownItem}>
                      <label htmlFor="topBackgroundVideoUpload" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: '100%' }}>
                        <i className="fas fa-video"></i>
                        <span>Change Page Background Video</span>
                      </label>
                      <input
                        id="topBackgroundVideoUpload"
                        type="file"
                        accept="video/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 50 * 1024 * 1024) {
                              showToast('Video must be less than 50MB', 'error');
                              return;
                            }
                            
                            try {
                              setIsUploadingBackground(true);
                              
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('type', 'video');
                              
                              const uploadResponse = await fetch('/api/upload/background', {
                                method: 'POST',
                                body: formData,
                              });
                              
                              if (!uploadResponse.ok) {
                                const errorData = await uploadResponse.json();
                                showToast(errorData.error || 'Failed to upload video', 'error');
                                return;
                              }
                              
                              const { path } = await uploadResponse.json();
                              setBackgroundVideo(path);
                              
                              await fetch('/api/user/profile', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ backgroundVideo: path }),
                              });
                              
                              showToast('Background video updated! 🎬', 'success');
                            } catch (error) {
                              console.error('Error uploading video:', error);
                              showToast('Failed to upload video', 'error');
                            } finally {
                              setIsUploadingBackground(false);
                            }
                          }
                          setShowEditMenu(false);
                          e.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                    </button>

                    {/* Page Background Image */}
                    <button className={styles.dropdownItem}>
                      <label htmlFor="topBackgroundImageUpload" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: '100%' }}>
                        <i className="fas fa-image"></i>
                        <span>Change Page Background Image</span>
                      </label>
                      <input
                        id="topBackgroundImageUpload"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setImageToCrop(reader.result as string);
                              setCropAspectRatio(16 / 9);
                              setCropUploadType('background');
                              setShowCropModal(true);
                            };
                            reader.readAsDataURL(file);
                          }
                          setShowEditMenu(false);
                          e.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                    </button>

                    {/* Hero Banner - Only for Template 3 */}
                    {selectedTemplate === 'template3' && (
                      <button className={styles.dropdownItem}>
                        <label htmlFor="topHeroImageUpload" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: '100%' }}>
                          <i className="fas fa-image"></i>
                          <span>Change Hero Banner</span>
                        </label>
                        <input
                          id="topHeroImageUpload"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setImageToCrop(reader.result as string);
                                // Calculate aspect ratio based on phone mockup dimensions
                                // Phone mockup width: 480px, padding: 30px each side = 420px content width
                                const phoneMockupContentWidth = 420;
                                const calculatedAspectRatio = phoneMockupContentWidth / heroHeight;
                                setCropAspectRatio(calculatedAspectRatio);
                                setCropUploadType('hero');
                                setShowCropModal(true);
                              };
                              reader.readAsDataURL(file);
                            }
                            setShowEditMenu(false);
                            e.target.value = '';
                          }}
                          style={{ display: 'none' }}
                        />
                      </button>
                    )}

                    {/* Card Background Color */}
                    <button className={styles.dropdownItem}>
                      <label htmlFor="topCardBackgroundColorPicker" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: '100%' }}>
                        <i className="fas fa-palette"></i>
                        <span>Change Card Background Color</span>
                      </label>
                      <input
                        id="topCardBackgroundColorPicker"
                        type="color"
                        value={cardBackgroundColor}
                        onChange={async (e) => {
                          const color = e.target.value;
                          setCardBackgroundColor(color);
                          
                          try {
                            await fetch('/api/user/profile', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ cardBackgroundColor: color }),
                            });
                            showToast('Card background color updated! 🎨', 'success');
                          } catch (error) {
                            console.error('Error updating color:', error);
                            showToast('Failed to update color', 'error');
                          }
                          setShowEditMenu(false);
                        }}
                        style={{ display: 'none' }}
                      />
                    </button>

                    {/* Card Background Image */}
                    <button className={styles.dropdownItem}>
                      <label htmlFor="topCardBackgroundImageUpload" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: '100%' }}>
                        <i className="fas fa-image"></i>
                        <span>Change Card Background Image</span>
                      </label>
                      <input
                        id="topCardBackgroundImageUpload"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setImageToCrop(reader.result as string);
                              setCropAspectRatio(16 / 9);
                              setCropUploadType('card-background');
                              setShowCropModal(true);
                            };
                            reader.readAsDataURL(file);
                          }
                          setShowEditMenu(false);
                          e.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                    </button>

                    {/* Card Background Video */}
                    <button className={styles.dropdownItem}>
                      <label htmlFor="topCardBackgroundVideoUpload" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: '100%' }}>
                        <i className="fas fa-video"></i>
                        <span>Change Card Background Video</span>
                      </label>
                      <input
                        id="topCardBackgroundVideoUpload"
                        type="file"
                        accept="video/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 50 * 1024 * 1024) {
                              showToast('Video must be less than 50MB', 'error');
                              return;
                            }
                            
                            try {
                              setIsUploadingBackground(true);
                              
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('type', 'video');
                              
                              const uploadResponse = await fetch('/api/upload/background', {
                                method: 'POST',
                                body: formData,
                              });
                              
                              if (!uploadResponse.ok) {
                                const errorData = await uploadResponse.json();
                                showToast(errorData.error || 'Failed to upload video', 'error');
                                return;
                              }
                              
                              const { path } = await uploadResponse.json();
                              setCardBackgroundVideo(path);
                              
                              await fetch('/api/user/profile', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ cardBackgroundVideo: path }),
                              });
                              
                              showToast('Card background video updated! 🎬', 'success');
                            } catch (error) {
                              console.error('Error uploading video:', error);
                              showToast('Failed to upload video', 'error');
                            } finally {
                              setIsUploadingBackground(false);
                            }
                          }
                          setShowEditMenu(false);
                          e.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                    </button>

                    {/* Toggle Profile Picture Visibility */}
                    <button 
                      className={styles.dropdownItem}
                      onClick={async () => {
                        await handleToggleProfilePicture();
                        setShowEditMenu(false);
                      }}
                    >
                      <i className={hideProfilePicture ? "fas fa-user" : "fas fa-user-slash"}></i>
                      <span>{hideProfilePicture ? 'Show Profile Picture' : 'Hide Profile Picture'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.topBarRight}>
          <button
            className={styles.topBarTab}
            title="Preview"
            onClick={() => {
              const slug = (publishUsername || username).toLowerCase();
              const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
              const url = isLocal
                ? `${window.location.origin}/${slug}`
                : `https://heremylinks.com/${slug}`;
              window.open(url, '_blank', 'noopener');
            }}
          >
            <i className="fas fa-eye"></i>
            <span>Preview</span>
          </button>
          <button
            className={styles.publishBtn}
            title="Publish"
            onClick={() => setShowShareUrlModal(true)}
          >
            <i className="fas fa-share-alt"></i>
            <span>Publish</span>
          </button>
          {/* Notifications Dropdown */}
          <div className={styles.dropdownWrapper}>
            <button 
              className={styles.topBarIcon} 
              title="Notifications"
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
            >
              <i className="fas fa-bell"></i>
            </button>
            
            {showNotificationsDropdown && (
              <>
                <div 
                  className={styles.dropdownOverlay} 
                  onClick={() => setShowNotificationsDropdown(false)}
                />
                <div className={styles.notificationsDropdown}>
                  <div className={styles.notificationsHeader}>
                    <h3>Notifications</h3>
                  </div>
                  <div className={styles.notificationsList}>
                    <div className={styles.notificationItem}>
                      <div className={styles.notificationIcon}>
                        <i className="fas fa-info-circle"></i>
                      </div>
                      <div className={styles.notificationContent}>
                        <p className={styles.notificationText}>Welcome to HereMyLinks! 🎉</p>
                        <span className={styles.notificationTime}>Just now</span>
                      </div>
                    </div>
                    {/* Add more notifications here when available */}
                  </div>
                  <button 
                    className={styles.notificationsViewAll}
                    onClick={() => {
                      setShowNotificationsDropdown(false);
                      // Navigate to notifications page when implemented
                    }}
                  >
                    Show all notifications
                  </button>
                </div>
              </>
            )}
          </div>

          <button className={styles.topBarIcon} title="Settings">
            <i className="fas fa-cog"></i>
          </button>
          
          {/* Debug: Test First-Time Setup */}
          <button 
            className={styles.topBarIcon} 
            title="Test First-Time Setup"
            onClick={() => {
              setShowFirstLinkSetup(true);
              setIsFirstTimeUser(true);
            }}
            style={{ color: '#8B5CF6' }}
          >
            <i className="fas fa-magic"></i>
          </button>
          
          {/* Profile Dropdown */}
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
                />
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

      {/* Main Content Area */}
      <main className={styles.mainContentArea}>
        {/* Center Preview */}
        <div 
          className={styles.centerPreview}
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Page Background Video */}
          {backgroundVideo && (
            <video
              ref={pageVideoRef}
              autoPlay
              loop
              muted
              playsInline
              webkit-playsinline="true"
              preload="auto"
              className={styles.pageBackgroundVideo}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0,
              }}
            >
              <source src={backgroundVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}

          <div 
            className={`${styles.phoneMockup} ${
              selectedTemplate === 'template1' ? styles.template1 : 
              selectedTemplate === 'template2' ? styles.template2 :
              selectedTemplate === 'template3' ? styles.template3 : ''
            }`}
            style={{
              // For template3, always use black background - don't apply cardBackgroundColor
              backgroundColor: selectedTemplate === 'template3' ? '#000000' : cardBackgroundColor,
              backgroundImage: cardBackgroundImage ? `url(${cardBackgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              position: 'relative',
            }}
          >
            {/* Hero Image Section - Template 3 Only */}
            {selectedTemplate === 'template3' && (
              <div 
                className={styles.heroImageWrapper} 
                style={{ 
                  position: 'relative',
                  height: `${heroHeight}px`,
                  minHeight: '200px',
                  maxHeight: '600px'
                }}
                onMouseEnter={handleHeroBannerEnter}
                onMouseLeave={handleHeroBannerLeave}
              >
                {heroImage ? (
                  <img src={heroImage} alt="Hero banner" className={styles.heroImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' }}>
                    Click + icon below to add hero image
                  </div>
                )}
                <div className={styles.heroGradient}></div>
                
                
                {/* Hero Image Upload handled via top bar input & crop modal */}
                
                {/* Hero Resize Handle - Only show on hover */}
                {isHoveringMockup && (
                <div 
                  className={styles.heroResizeHandle}
                  onClick={() => console.log('Resize handle clicked!')}
                    onMouseEnter={handleHeroBannerEnter}
                    onMouseLeave={handleHeroBannerLeave}
                  onMouseDown={(e: React.MouseEvent) => {
                    console.log('Mouse down on resize handle');
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizingHero(true);
                    const startY = e.clientY;
                    const startHeight = heroHeight;
                    let currentHeight = startHeight;
                    
                    const handleMouseMove = (moveEvent: any) => {
                      moveEvent.preventDefault();
                      const delta = moveEvent.clientY - startY;
                      currentHeight = Math.max(200, Math.min(600, startHeight + delta));
                      console.log('Dragging, new height:', currentHeight);
                      setHeroHeight(currentHeight);
                    };
                    
                    const handleMouseUp = async () => {
                      console.log('Mouse up, final height:', currentHeight);
                      setIsResizingHero(false);
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                      // Save to database
                      await handleHeroHeightChange(currentHeight);
                      showToast('Hero height updated!', 'success');
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                  style={{ 
                    cursor: isResizingHero ? 'ns-resize' : 'grab',
                    touchAction: 'none'
                  }}
                >
                  <div className={styles.resizeIcon}>
                    <i className="fas fa-arrows-alt-v"></i>
                    <span>Drag to resize height</span>
                  </div>
                </div>
                )}
              </div>
            )}

            {/* Card Background Video */}
            {cardBackgroundVideo && (
              <video
                ref={cardVideoRef}
                autoPlay
                loop
                muted
                playsInline
                webkit-playsinline="true"
                preload="auto"
                className={styles.cardBackgroundVideo}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                  borderRadius: '40px',
                }}
              >
                <source src={cardBackgroundVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            {/* Profile Section */}
            <div className={styles.profileSection}>
              {/* Completely hide profile picture when hideProfilePicture is true */}
              {!hideProfilePicture && (
                <div className={styles.profilePictureWrapper}>
                  <div 
                    className={styles.profileImage} 
                    onClick={handleImageClick}
                    title="Click to upload profile picture"
                  >
                    {profileImage ? (
                      <img src={profileImage} alt={displayName} />
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                    <div className={styles.imageOverlay}>
                      <i className="fas fa-camera"></i>
                    </div>
                    
                    {/* Hide Profile Picture Button - Template 3 Only */}
                    {selectedTemplate === 'template3' && (
                      <div 
                        className={styles.profileHideButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleProfilePicture();
                        }}
                        title="Hide profile picture"
                      >
                        <i className="fas fa-eye-slash"></i>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <FileUpload
                onUploadComplete={handleProfileImageUpload}
                uploadType="profile"
                currentImage={profileImage}
                className={styles.hiddenFileUpload}
                hideButton={true}
                showPreview={false}
                ref={fileInputRef}
              />

              <div className={styles.nameWrapper}>
                {isEditingName ? (
                  <div className={styles.editWithColorWrapper}>
                    <input
                      type="text"
                      className={styles.editNameInput}
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={handleNameSave}
                      onKeyDown={handleNameKeyPress}
                      autoFocus
                      maxLength={50}
                      style={{ color: usernameColor }}
                    />
                    <div 
                      className={styles.textColorControls}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur on input
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className={styles.colorControlLabel}>
                        <i className="fas fa-palette"></i>
                        <input
                          type="color"
                          value={usernameColor}
                          onChange={async (e) => {
                            const color = e.target.value;
                            setUsernameColor(color);
                            await fetch('/api/user/profile', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ usernameColor: color }),
                            });
                          }}
                          className={styles.colorPicker}
                          title="Change username color"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <h2 
                    className={styles.profileName}
                    onClick={handleNameClick}
                    title="Click to edit name"
                    style={{ color: usernameColor }}
                  >
                    {displayName}
                    {selectedTemplate === 'template3' && (
                      <span className={styles.verifiedBadge}>
                        <i className="fas fa-check"></i>
                      </span>
                    )}
                  </h2>
                )}
              </div>

              {/* @username handle - Template 3 Only */}
              {selectedTemplate === 'template3' && publishUsername && (
                <div className={styles.usernameHandle}>
                  @{publishUsername}
                </div>
              )}

              {/* Social Icons - Moved before bio */}
              {socialLinks.length > 0 && (
                <div className={styles.socialIconsContainer}>
                  {socialLinks.map((social) => (
                    <div key={social.id} className={styles.socialIconWrapper}>
                      <a 
                        href={social.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={styles.socialIcon}
                        title={social.platform}
                      >
                        <i className={social.icon}></i>
                      </a>
                      <button 
                        className={styles.deleteSocialBtn}
                        onClick={() => deleteSocialLink(social.id)}
                        title="Remove social link"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.bioWrapper}>
                {isEditingBio ? (
                  <div className={styles.editWithColorWrapper}>
                    <textarea
                      className={styles.editBioInput}
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      onBlur={handleBioSave}
                      onKeyDown={handleBioKeyPress}
                      autoFocus
                      maxLength={150}
                      rows={3}
                      style={{ color: bioColor }}
                    />
                    <div 
                      className={styles.textColorControls}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur on textarea
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className={styles.colorControlLabel}>
                        <i className="fas fa-palette"></i>
                        <input
                          type="color"
                          value={bioColor}
                          onChange={async (e) => {
                            const color = e.target.value;
                            setBioColor(color);
                            await fetch('/api/user/profile', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ bioColor: color }),
                            });
                          }}
                          className={styles.colorPicker}
                          title="Change bio color"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <p 
                    className={styles.profileBio}
                    onClick={handleBioClick}
                    title="Click to edit bio"
                    style={{ color: bioColor }}
                  >
                    {bio}
                  </p>
                )}
              </div>
            </div>

            {/* Bio Links */}
            <div className={styles.bioLinksContainer}>
              {bioLinks.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <i className="fas fa-link"></i>
                  </div>
                  <p className={styles.emptyText}>
                    Start by adding links and customize your themes and style
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={bioLinks.map(link => link.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {bioLinks.map((link) => (
                      <SortableLinkItem 
                        key={link.id} 
                        link={link} 
                        onDelete={deleteLink}
                        onUpdate={updateLink}
                        selectedTemplate={selectedTemplate}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Custom Text Section */}
            {customText && (
              <div className={styles.customTextSection}>
                <div className={styles.customTextWrapper}>
                  <p className={styles.customText} style={{ color: customTextColor }}>{customText}</p>
                  <div className={styles.customTextControls}>
                    <label className={styles.colorControlLabel}>
                      <i className="fas fa-palette"></i>
                      <input
                        type="color"
                        value={customTextColor}
                        onChange={async (e) => {
                          const color = e.target.value;
                          setCustomTextColor(color);
                          await fetch('/api/user/profile', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ customTextColor: color }),
                          });
                        }}
                        className={styles.colorPicker}
                        title="Change text color"
                      />
                    </label>
                    <button
                      className={styles.removeTextBtn}
                      onClick={async () => {
                        setCustomText('');
                        await fetch('/api/user/profile', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ customText: '' }),
                        });
                        showToast('Custom text removed', 'success');
                      }}
                      title="Remove custom text"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
            </div>

      </main>

      {/* Modals and Floating Actions - Hidden for now in new design */}
      <div style={{display: 'none'}}>
        {/* Right Sidebar - Add Menu - HIDDEN */}
          <aside className={styles.rightSidebar}>
            <div className={styles.addSection}>
             {activeSection === 'none' ? (
               <>
                 <h3 className={styles.addTitle}>add</h3>
                 
                 <div className={styles.addOptions}>
                   <button className={styles.addOption} onClick={openAddLinkSection}>
                     <div className={styles.optionIcon}>
                       <i className="fas fa-link"></i>
                     </div>
                     <div className={styles.optionContent}>
                       <h4 className={styles.optionTitle}>link</h4>
                       <p className={styles.optionDescription}>add any link, any style</p>
                     </div>
                     <i className="fas fa-chevron-right"></i>
                   </button>

                   <button className={styles.addOption} onClick={openSocialsSection}>
                     <div className={styles.optionIcon}>
                       <i className="fas fa-hashtag"></i>
                     </div>
                     <div className={styles.optionContent}>
                       <h4 className={styles.optionTitle}>socials</h4>
                       <p className={styles.optionDescription}>connect your social platforms</p>
                     </div>
                     <i className="fas fa-chevron-right"></i>
                   </button>

                   <button className={styles.addOption} onClick={openTemplatesSection}>
                     <div className={styles.optionIcon}>
                       <i className="fas fa-palette"></i>
                     </div>
                     <div className={styles.optionContent}>
                       <h4 className={styles.optionTitle}>design & templates</h4>
                       <p className={styles.optionDescription}>customize your page style</p>
                     </div>
                     <i className="fas fa-chevron-right"></i>
                   </button>

                   <button className={styles.addOption} onClick={openTikTokSection}>
                     <div className={styles.optionIcon}>
                       <i className="fab fa-tiktok"></i>
                     </div>
                     <div className={styles.optionContent}>
                       <h4 className={styles.optionTitle}>autofill from tiktok</h4>
                       <p className={styles.optionDescription}>import your tiktok profile info</p>
                     </div>
                     <i className="fas fa-chevron-right"></i>
                   </button>
                 </div>
               </>
             ) : activeSection === 'addLink' ? (
              <div className={styles.addLinkInlineSection}>
                {addLinkStep === 'layout' ? (
                  <>
                    {/* Layout Selection Step */}
                    <div className={styles.inlineHeader}>
                      <button 
                        className={styles.inlineBack}
                        onClick={closeAddLinkSection}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <h3 className={styles.inlineTitle}>add link</h3>
                    </div>
                    
                    <div className={styles.addLinkBody}>
                      <div className={styles.layoutSelectionHeader}>
                        <h4 className={styles.layoutTitle}>select link layout</h4>
                        <p className={styles.layoutSubtitle}>you can change this anytime</p>
                      </div>

                      <div className={styles.layoutOptions}>
                        {/* Layout 1 - Simple Text */}
                        <button 
                          className={`${styles.layoutOption} ${selectedLayout === 'simple' ? styles.layoutOptionSelected : ''}`}
                          onClick={() => handleLayoutSelect('simple')}
                        >
                          <div className={styles.layoutInfo}>
                            <h4 className={styles.layoutOptionName}>Simple Link</h4>
                            <p className={styles.layoutOptionDesc}>Clean text-only link with an icon</p>
                          </div>
                          <div className={styles.layoutPreview}>
                            <div className={styles.simpleLayout}>
                              <i className="fas fa-link"></i>
                              <span>link title</span>
                            </div>
                          </div>
                        </button>

                        {/* Layout 2 - Image Right + Text Left */}
                        <button 
                          className={`${styles.layoutOption} ${selectedLayout === 'image-right' ? styles.layoutOptionSelected : ''}`}
                          onClick={() => handleLayoutSelect('image-right')}
                        >
                          <div className={styles.layoutInfo}>
                            <h4 className={styles.layoutOptionName}>Image Right</h4>
                            <p className={styles.layoutOptionDesc}>Title on left, thumbnail on right</p>
                          </div>
                          <div className={styles.layoutPreview}>
                            <div className={styles.imageRightLayout}>
                              <span>link title</span>
                              <div className={styles.layoutImagePlaceholder}>
                                <i className="fas fa-image"></i>
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Layout 3 - Image Top + Text Bottom */}
                        <button 
                          className={`${styles.layoutOption} ${selectedLayout === 'image-top' ? styles.layoutOptionSelected : ''}`}
                          onClick={() => handleLayoutSelect('image-top')}
                        >
                          <div className={styles.layoutInfo}>
                            <h4 className={styles.layoutOptionName}>Image Top</h4>
                            <p className={styles.layoutOptionDesc}>Image above title in card layout</p>
                          </div>
                          <div className={styles.layoutPreview}>
                            <div className={styles.imageTopLayout}>
                              <div className={styles.layoutImagePlaceholder}>
                                <i className="fas fa-image"></i>
                              </div>
                              <span>link title</span>
                            </div>
                          </div>
                        </button>

                        {/* Layout 4 - Large Image */}
                        <button 
                          className={`${styles.layoutOption} ${selectedLayout === 'image-large' ? styles.layoutOptionSelected : ''}`}
                          onClick={() => handleLayoutSelect('image-large')}
                        >
                          <div className={styles.layoutInfo}>
                            <h4 className={styles.layoutOptionName}>Large Banner</h4>
                            <p className={styles.layoutOptionDesc}>Full-width image with title below</p>
                          </div>
                          <div className={styles.layoutPreview}>
                            <div className={styles.imageLargeLayout}>
                              <div className={styles.layoutImagePlaceholder}>
                                <i className="fas fa-image"></i>
                              </div>
                              <span>link title</span>
                            </div>
                          </div>
                        </button>
                      </div>
                      
                      <button 
                        className={styles.continueBtn}
                        onClick={() => setAddLinkStep('form')}
                      >
                        Continue <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Form Step */}
                    <div className={styles.inlineHeader}>
                      <button 
                        className={styles.inlineBack}
                        onClick={backToLayoutSelection}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <h3 className={styles.inlineTitle}>add link details</h3>
                    </div>
                    
                    <div className={styles.addLinkBody}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Link Title <span className={styles.requiredField}>*</span></label>
                        <input
                          type="text"
                          className={styles.formInput}
                          placeholder="Enter link title"
                          value={linkTitle}
                          onChange={(e) => setLinkTitle(e.target.value)}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Link URL <span className={styles.requiredField}>*</span></label>
                        <input
                          type="url"
                          className={styles.formInput}
                          placeholder="https://example.com"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                        />
                      </div>

                      {selectedLayout !== 'simple' && (
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Link Image</label>
                          <FileUpload
                            onUploadComplete={(fileUrl) => setLinkImage(fileUrl)}
                            uploadType="link"
                          />
                        </div>
                      )}

                      <button 
                        className={styles.addLinkBtn}
                        onClick={handleAddLink}
                        disabled={!linkTitle.trim() || !linkUrl.trim() || isSaving}
                      >
                        {isSaving ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> Adding...
                          </>
                        ) : (
                          <>Add Link <i className="fas fa-plus"></i></>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
             ) : activeSection === 'socials' ? (
               <div className={styles.addLinkInlineSection}>
                 {socialsStep === 'platforms' ? (
                   <>
                     {/* Platform Selection Step */}
                     <div className={styles.inlineHeader}>
                       <button 
                         className={styles.inlineBack}
                         onClick={closeSocialsSection}
                       >
                         <i className="fas fa-chevron-left"></i>
                       </button>
                       <h3 className={styles.inlineTitle}>add social</h3>
                     </div>
                     
                     <div className={styles.addLinkBody}>
                       <div className={styles.layoutSelectionHeader}>
                         <h4 className={styles.layoutTitle}>choose a platform</h4>
                         <p className={styles.layoutSubtitle}>connect your social media</p>
                       </div>

                       <div className={styles.socialPlatformsGrid}>
                         {socialPlatforms.map((platform) => (
                           <button
                             key={platform.name}
                             className={styles.platformCard}
                             onClick={() => selectPlatform(platform)}
                           >
                             <i className={`${platform.icon} ${styles.platformIcon}`}></i>
                             <span className={styles.platformName}>{platform.name}</span>
                           </button>
                         ))}
                       </div>
                     </div>
                   </>
                 ) : (
                   <>
                     {/* URL Input Step */}
                     <div className={styles.inlineHeader}>
                       <button 
                         className={styles.inlineBack}
                         onClick={backToPlatformSelection}
                       >
                         <i className="fas fa-chevron-left"></i>
                       </button>
                       <h3 className={styles.inlineTitle}>add {selectedPlatform?.name}</h3>
                     </div>
                     
                     <div className={styles.addLinkBody}>
                       <div className={styles.formGroup}>
                         <label className={styles.formLabel}>
                           {selectedPlatform?.name} URL <span className={styles.requiredField}>*</span>
                         </label>
                         <input
                           type="url"
                           className={styles.formInput}
                           placeholder={`https://${selectedPlatform?.name.toLowerCase()}.com/yourprofile`}
                           value={socialUrl}
                           onChange={(e) => setSocialUrl(e.target.value)}
                         />
                       </div>

                       <button 
                         className={styles.addLinkBtn}
                         onClick={handleAddSocial}
                         disabled={!socialUrl.trim() || isSaving}
                       >
                         {isSaving ? (
                           <>
                             <i className="fas fa-spinner fa-spin"></i> Adding...
                           </>
                         ) : (
                           <>Add Social <i className="fas fa-plus"></i></>
                         )}
                       </button>
                     </div>
                   </>
                 )}
               </div>
             ) : activeSection === 'templates' ? (
               <div className={styles.addLinkInlineSection}>
                 <div className={styles.inlineHeader}>
                   <button 
                     className={styles.inlineBack}
                     onClick={closeTemplatesSection}
                   >
                     <i className="fas fa-chevron-left"></i>
                   </button>
                   <h3 className={styles.inlineTitle}>choose template</h3>
                 </div>

                 <div className={styles.addLinkBody}>
                   <div className={styles.layoutSelectionHeader}>
                     <h4 className={styles.layoutTitle}>select a design</h4>
                     <p className={styles.layoutSubtitle}>customize your page style</p>
                   </div>

                   <div className={styles.templatesGrid}>
                     {templates.map((template) => (
                       <button
                         key={template.id}
                         className={`${styles.templateCard} ${selectedTemplate === template.id ? styles.templateCardActive : ''}`}
                         onClick={() => handleTemplateSelect(template.id)}
                         disabled={isSaving}
                       >
                         <div className={styles.templatePreview}>
                           {template.id === 'default' ? (
                             <div className={styles.templatePreviewDefault}>
                               <div className={styles.previewCircle}></div>
                               <div className={styles.previewLine}></div>
                               <div className={styles.previewLine}></div>
                               <div className={styles.previewButton}></div>
                               <div className={styles.previewButton}></div>
                             </div>
                           ) : template.id === 'template1' ? (
                             <div className={styles.templatePreviewBold}>
                               <div className={styles.previewCircle}></div>
                               <div className={styles.previewLine}></div>
                               <div className={styles.previewLine}></div>
                               <div className={styles.previewButtonBold}></div>
                               <div className={styles.previewButtonBold}></div>
                             </div>
                          ) : template.id === 'template2' ? (
                            <div className={styles.templatePreviewOcean}>
                              <div className={styles.previewCircle}></div>
                              <div className={styles.previewLine}></div>
                              <div className={styles.previewLine}></div>
                              <div className={styles.previewButtonOcean}></div>
                              <div className={styles.previewButtonOcean}></div>
                            </div>
                          ) : template.id === 'template3' ? (
                            <div className={styles.templatePreviewHero}>
                              <div className={styles.previewHeroImage}></div>
                              <div className={styles.previewCircle}></div>
                              <div className={styles.previewLine}></div>
                              <div className={styles.previewGridCards}>
                                <div className={styles.previewGridCard}></div>
                                <div className={styles.previewGridCard}></div>
                                <div className={styles.previewGridCard}></div>
                                <div className={styles.previewGridCard}></div>
                              </div>
                            </div>
                          ) : null}
                         </div>

                         <div className={styles.templateInfo}>
                           <h4 className={styles.templateName}>
                             {template.name}
                             {selectedTemplate === template.id && (
                               <i className="fas fa-check-circle" style={{ color: '#667eea', marginLeft: '8px' }}></i>
                             )}
                           </h4>
                           <p className={styles.templateDescription}>{template.description}</p>
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>
               </div>
             ) : activeSection === 'tiktok' ? (
               <div className={styles.addLinkInlineSection}>
                 <div className={styles.inlineHeader}>
                   <button 
                     className={styles.inlineBack}
                     onClick={closeTikTokSection}
                   >
                     <i className="fas fa-chevron-left"></i>
                   </button>
                   <h3 className={styles.inlineTitle}>autofill from tiktok</h3>
                 </div>
                 
                 <div className={styles.addLinkBody}>
                   <div className={styles.layoutSelectionHeader}>
                     <h4 className={styles.layoutTitle}>import your profile</h4>
                     <p className={styles.layoutSubtitle}>automatically fetch your TikTok info</p>
                   </div>

                   <div className={styles.formGroup}>
                     <label className={styles.formLabel}>TikTok Username <span className={styles.requiredField}>*</span></label>
                     <div className={styles.inputGroup}>
                       <div className={styles.inputIcon}>
                         <i className="fab fa-tiktok"></i>
                       </div>
                       <input
                         type="text"
                         className={styles.formInput}
                         placeholder="@username or username"
                         value={tiktokUsername}
                         onChange={(e) => setTiktokUsername(e.target.value)}
                         onKeyPress={(e) => e.key === 'Enter' && handleTikTokAutofill()}
                         disabled={isLoading}
                       />
                     </div>
                   </div>

                   <button 
                     className={styles.addLinkBtn}
                     onClick={handleTikTokAutofill}
                     disabled={isLoading || !tiktokUsername.trim()}
                   >
                     {isLoading ? (
                       <>
                         <i className="fas fa-spinner fa-spin"></i> Importing...
                       </>
                     ) : (
                       <>
                         <i className="fas fa-download"></i> Import Profile
                       </>
                     )}
                   </button>
                 </div>
               </div>
             ) : null}
          </div>
        </aside>
      </div>

      {/* TikTok Autofill Modal - REMOVE THIS */}
      {false && (
        <div className={styles.modalOverlay} onClick={() => setShowTikTokModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Autofill from TikTok</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowTikTokModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>
                Enter your TikTok username to automatically import your profile picture, name, and bio.
              </p>
              
              <div className={styles.inputGroup}>
                <div className={styles.inputIcon}>
                  <i className="fab fa-tiktok"></i>
                </div>
                <input
                  type="text"
                  className={styles.modalInput}
                  placeholder="@username or username"
                  value={tiktokUsername}
                  onChange={(e) => setTiktokUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTikTokAutofill()}
                  disabled={isLoading}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => setShowTikTokModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  className={styles.importBtn}
                  onClick={handleTikTokAutofill}
                  disabled={isLoading || !tiktokUsername.trim()}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Importing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download"></i>
                      Import Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPublishModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Publish Your Page</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowPublishModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {!hasCustomUsername ? (
                <>
                  <p className={styles.modalDescription}>
                    Choose your unique username to publish your bio link page. This will be your permanent URL.
                  </p>
                  
                  <div className={styles.inputGroup}>
                    <div className={styles.inputIcon}>
                      <i className="fas fa-link"></i>
                    </div>
                    <span className={styles.urlPrefix}>heremylinks.com/</span>
                    <input
                      type="text"
                      className={styles.usernameInput}
                      placeholder="yourname"
                      value={publishUsername}
                      onChange={(e) => {
                        setPublishUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                        setUsernameError('');
                      }}
                      disabled={isSaving}
                      maxLength={30}
                    />
                  </div>
                  
                  {usernameError && (
                    <p className={styles.errorMessage}>
                      <i className="fas fa-exclamation-circle"></i>
                      {usernameError}
                    </p>
                  )}
                  
                  <p className={styles.helperText}>
                    • Minimum 3 characters<br />
                    • Letters, numbers, dashes, and underscores only<br />
                    • Cannot be changed later
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.modalDescription}>
                    Your page is ready to be published at:
                  </p>
                  
                  <div className={styles.publishUrlDisplay}>
                    <i className="fas fa-link"></i>
                    <span className={styles.publishUrl}>heremylinks.com/{username}</span>
                  </div>
                  
                  <p className={styles.helperText}>
                    {isPublished 
                      ? '✅ Your page is currently published and live!'
                      : 'Click publish to make your page live and accessible to everyone.'}
                  </p>
                </>
              )}

              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => setShowPublishModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  className={styles.importBtn}
                  onClick={handlePublishConfirm}
                  disabled={isSaving || isCheckingUsername || (!hasCustomUsername && publishUsername.length < 3)}
                >
                  {isSaving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-rocket"></i>
                      {isPublished ? 'Update & Publish' : 'Publish'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Old modals removed - now using inline sections */}

      {/* Link Type Selection Modal */}
      {showLinkTypeModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLinkTypeModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <i className="fas fa-link"></i> Choose Link Type
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowLinkTypeModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>
                Select a layout style for your link
              </p>
              
              <div className={styles.linkTypeGrid}>
                <button 
                  className={styles.linkTypeCard}
                  onClick={() => handleLinkTypeSelect('simple')}
                >
                  <div className={styles.linkTypePreview}>
                    <div className={styles.simplePreview}>
                      <i className="fas fa-link"></i>
                      <span>Link Title</span>
                    </div>
                  </div>
                  <div className={styles.linkTypeInfo}>
                    <h3>Text Only</h3>
                    <p>Simple text link</p>
                  </div>
                </button>

                <button 
                  className={styles.linkTypeCard}
                  onClick={() => handleLinkTypeSelect('image-left')}
                >
                  <div className={styles.linkTypePreview}>
                    <div className={styles.imageLeftPreview}>
                      <div className={styles.previewImageBox}></div>
                      <span>Link Title</span>
                    </div>
                  </div>
                  <div className={styles.linkTypeInfo}>
                    <h3>Image Left</h3>
                    <p>Image on the left</p>
                  </div>
                </button>

                <button 
                  className={styles.linkTypeCard}
                  onClick={() => handleLinkTypeSelect('image-right')}
                >
                  <div className={styles.linkTypePreview}>
                    <div className={styles.imageRightPreview}>
                      <span>Link Title</span>
                      <div className={styles.previewImageBox}></div>
                    </div>
                  </div>
                  <div className={styles.linkTypeInfo}>
                    <h3>Image Right</h3>
                    <p>Image on the right</p>
                  </div>
                </button>

                <button 
                  className={styles.linkTypeCard}
                  onClick={() => handleLinkTypeSelect('image-top')}
                >
                  <div className={styles.linkTypePreview}>
                    <div className={styles.imageTopPreview}>
                      <div className={styles.previewImageBox}></div>
                      <span>Link Title</span>
                    </div>
                  </div>
                  <div className={styles.linkTypeInfo}>
                    <h3>Image Top</h3>
                    <p>Image on top</p>
                  </div>
                </button>

                <button 
                  className={styles.linkTypeCard}
                  onClick={() => handleLinkTypeSelect('image-large')}
                >
                  <div className={styles.linkTypePreview}>
                    <div className={styles.imageLargePreview}>
                      <div className={styles.previewImageBox}></div>
                      <span>Link Title</span>
                    </div>
                  </div>
                  <div className={styles.linkTypeInfo}>
                    <h3>Large Image</h3>
                    <p>Big featured image</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Link Details Modal */}
      {showAddLinkModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddLinkModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <i className="fas fa-link"></i> Add Link
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowAddLinkModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Link Title <span className={styles.requiredField}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g., My Website"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Link URL <span className={styles.requiredField}>*</span>
                </label>
                <input
                  type="url"
                  className={styles.formInput}
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>

              {selectedLayout && selectedLayout.includes('image') && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Link Image {selectedLayout.includes('large') && <span className={styles.requiredField}>*</span>}
                  </label>
                  <FileUpload
                    onUploadComplete={handleLinkImageUpload}
                    uploadType="link"
                    currentImage={linkImage}
                    hideButton={false}
                    showPreview={true}
                  />
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryBtn}
                onClick={() => {
                  setShowAddLinkModal(false);
                  setLinkTitle('');
                  setLinkUrl('');
                  setLinkImage('');
                }}
              >
                Cancel
              </button>
              <button 
                className={styles.primaryBtn}
                onClick={handleAddLink}
                disabled={isSaving || !linkTitle.trim() || !linkUrl.trim()}
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Adding...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i> Add Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Text Modal */}
      {showAddTextModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddTextModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <i className="fas fa-text"></i> Add Text to Bio Page
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowAddTextModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <i className="fas fa-align-left"></i> Text Content
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="Enter your text content..."
                  value={addTextContent}
                  onChange={(e) => setAddTextContent(e.target.value)}
                  rows={6}
                />
                <p className={styles.helperText}>
                  This text will appear as a separate block on your bio page
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryBtn}
                onClick={() => {
                  setShowAddTextModal(false);
                  setAddTextContent('');
                }}
              >
                Cancel
              </button>
              <button 
                className={styles.primaryBtn}
                onClick={async () => {
                  if (!addTextContent.trim()) {
                    showToast('Please enter some text', 'error');
                    return;
                  }
                  
                  try {
                    const response = await fetch('/api/user/profile', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        customText: addTextContent 
                      }),
                    });

                    if (response.ok) {
                      setCustomText(addTextContent);
                      showToast('Text added successfully! ✨', 'success');
                      setShowAddTextModal(false);
                      setAddTextContent('');
                    } else {
                      showToast('Failed to add text', 'error');
                    }
                  } catch (error) {
                    console.error('Error adding text:', error);
                    showToast('Failed to add text', 'error');
                  }
                }}
                disabled={!addTextContent.trim()}
              >
                <i className="fas fa-plus"></i> Add Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Icons Modal */}
      {showSocialIconsModal && (
        <div className={styles.modalOverlay} onClick={closeSocialsSection}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {socialsStep === 'platforms' ? 'Add Social Icon' : `Add ${selectedPlatform?.name} Link`}
              </h2>
              <button 
                className={styles.modalClose}
                onClick={closeSocialsSection}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {socialsStep === 'platforms' ? (
                <>
                  <p className={styles.modalDescription}>
                    Select a social platform to add to your profile
                  </p>
                  
                  <div className={styles.socialPlatformsGrid}>
                    {socialPlatforms.map((platform) => (
                      <button
                        key={platform.name}
                        className={styles.socialPlatformCard}
                        onClick={() => selectPlatform(platform)}
                      >
                        <div className={styles.socialPlatformIcon}>
                          <i className={platform.icon}></i>
                        </div>
                        <span className={styles.socialPlatformName}>{platform.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.socialInputHeader}>
                    <button 
                      className={styles.backButton}
                      onClick={() => setSocialsStep('platforms')}
                    >
                      <i className="fas fa-arrow-left"></i>
                    </button>
                    <div className={styles.selectedPlatformDisplay}>
                      <div className={styles.selectedPlatformIcon}>
                        <i className={selectedPlatform?.icon}></i>
                      </div>
                      <span>{selectedPlatform?.name}</span>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Profile URL <span className={styles.requiredField}>*</span>
                    </label>
                    <input
                      type="url"
                      className={styles.formInput}
                      placeholder={`https://www.${selectedPlatform?.name.toLowerCase()}.com/yourprofile`}
                      value={socialUrl}
                      onChange={(e) => setSocialUrl(e.target.value)}
                      autoFocus
                    />
                    <p className={styles.inputHint}>
                      Enter the full URL to your {selectedPlatform?.name} profile
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {socialsStep === 'input' && (
              <div className={styles.modalFooter}>
                <button 
                  className={styles.secondaryBtn}
                  onClick={closeSocialsSection}
                >
                  Cancel
                </button>
                <button 
                  className={styles.primaryBtn}
                  onClick={handleAddSocial}
                  disabled={!socialUrl.trim() || isSaving}
                >
                  {isSaving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Adding...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i> Add Social Icon
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* First Link Setup Modal */}
      {showFirstLinkSetup && (
        <FirstLinkSetup
          isOpen={showFirstLinkSetup}
          onSuccess={handleFirstLinkSetupSuccess}
          onClose={() => setShowFirstLinkSetup(false)}
        />
      )}

      {/* Template Choice Modal */}
      {showTemplateChoice && (
        <TemplateChoice
          isOpen={showTemplateChoice}
          defaultTemplate="template3"
          onApply={(templateId) => handleTemplateSelect(templateId)}
          onClose={() => setShowTemplateChoice(false)}
        />
      )}

      {/* Share URL Modal */}
      {showShareUrlModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <i className="fas fa-link"></i>
                Your Link is Live!
              </h3>
              <button 
                className={styles.modalClose}
                onClick={() => {
                  setShowShareUrlModal(false);
                  setCopied(false);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p className={styles.shareUrlDescription}>
                Share your personalized bio link with the world. Copy the URL below and add it to your social media profiles.
              </p>

              <div className={styles.shareUrlBox}>
                <div className={styles.urlDisplayRow}>
                  <div className={styles.urlIconWrapper}>
                    <i className="fas fa-link"></i>
                  </div>
                  <div className={styles.urlTextWrapper}>
                    <span className={styles.urlLabel}>Your Link</span>
                    <a 
                      href={`https://heremylinks.com/${(publishUsername || username).toLowerCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.urlText}
                    >
                      heremylinks.com/{(publishUsername || username).toLowerCase()}
                    </a>
                  </div>
                </div>
                <button
                  className={styles.copyUrlBtn}
                  onClick={() => {
                    const url = `https://heremylinks.com/${(publishUsername || username).toLowerCase()}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? (
                    <>
                      <i className="fas fa-check"></i>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-copy"></i>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className={styles.shareActionsGrid}>
                <a
                  href={`https://heremylinks.com/${(publishUsername || username).toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.shareActionBtn}
                >
                  <i className="fas fa-external-link-alt"></i>
                  <span>Visit Page</span>
                </a>
                <button
                  className={styles.shareActionBtn}
                  onClick={() => {
                    const url = `https://heremylinks.com/${(publishUsername || username).toLowerCase()}`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'Check out my bio link!',
                        url: url
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                >
                  <i className="fas fa-share-nodes"></i>
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
