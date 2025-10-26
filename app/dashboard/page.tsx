'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  image?: string;
  layout?: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

// Sortable Link Item Component
function SortableLinkItem({ link, onDelete }: { link: BioLink; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const layoutClass = link.layout 
    ? styles[`preview${link.layout.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`] 
    : styles.previewSimple;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`${styles.bioLinkItem} ${layoutClass} ${isDragging ? styles.dragging : ''}`}
    >
      {link.image && link.layout?.includes('image-left') && (
        <div className={styles.previewLinkImage}>
          <img src={link.image} alt={link.title} />
        </div>
      )}
      
      {link.image && (link.layout === 'image-top-left' || link.layout === 'image-top-right' || link.layout === 'image-large') && (
        <div className={styles.previewLinkImageTop}>
          <img src={link.image} alt={link.title} />
        </div>
      )}
      
      <div className={styles.linkContent}>
        {link.icon && !link.image && (
          <div className={styles.linkIcon}>
            <i className={link.icon}></i>
          </div>
        )}
        <span className={styles.linkTitle}>{link.title}</span>
      </div>
      
      {link.image && link.layout?.includes('image-right') && (
        <div className={styles.previewLinkImage}>
          <img src={link.image} alt={link.title} />
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
  
  const [profileImage, setProfileImage] = useState('');
  const [displayName, setDisplayName] = useState('Your Name');
  const [username, setUsername] = useState('yourname');
  const [bio, setBio] = useState('Add your bio here');
  const [bioLinks, setBioLinks] = useState<BioLink[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Publish modal states
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishUsername, setPublishUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [hasCustomUsername, setHasCustomUsername] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  
  // Editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  const [tempBio, setTempBio] = useState(bio);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add Link Modal states
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [addLinkStep, setAddLinkStep] = useState<'layout' | 'form'>('layout');
  const [selectedLayout, setSelectedLayout] = useState<string>('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkImage, setLinkImage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const linkImageInputRef = useRef<HTMLInputElement>(null);

  // Socials states
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [showSocialsModal, setShowSocialsModal] = useState(false);
  const [socialsStep, setSocialsStep] = useState<'platforms' | 'input'>('platforms');
  const [selectedPlatform, setSelectedPlatform] = useState<{ name: string; icon: string } | null>(null);
  const [socialUrl, setSocialUrl] = useState('');

  // Templates states
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('default');

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        // Load user profile
        const profileResponse = await fetch('/api/user/profile');
        if (profileResponse.ok) {
          const { user } = await profileResponse.json();
          setDisplayName(user.name || 'Your Name');
          setUsername(user.username || 'yourname');
          setBio(user.bio || 'Add your bio here');
          setProfileImage(user.profileImage || '');
          setIsPublished(user.isPublished || false);
          setSelectedTemplate(user.template || 'default');
          
          // Check if user has set a custom username (not auto-generated)
          const usernamePattern = /^[a-z]+\d+$/; // Matches auto-generated pattern like "john123"
          const isAutoGenerated = usernamePattern.test(user.username || '');
          setHasCustomUsername(user.username && !isAutoGenerated && user.username.length >= 3);
          setPublishUsername(user.username || '');
        }

        // Load bio links
        const linksResponse = await fetch('/api/links');
        if (linksResponse.ok) {
          const { links } = await linksResponse.json();
          setBioLinks(links);
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

  const addLink = () => {
    const newLink: BioLink = {
      id: Date.now().toString(),
      title: 'New Link',
      url: '#'
    };
    setBioLinks([...bioLinks, newLink]);
    setShowAddMenu(false);
  };

  const deleteLink = async (id: string) => {
    try {
      const response = await fetch(`/api/links?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBioLinks(bioLinks.filter(link => link.id !== id));
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link');
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
        alert('Your page has been published! 🎉\nVisit heremylinks.com/' + (publishUsername || username).toLowerCase());
      }
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Failed to publish page');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTikTokAutofill = async () => {
    if (!tiktokUsername.trim()) {
      alert('Please enter a TikTok username');
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
        alert('Profile autofilled from TikTok! 🎉');
      } else {
        alert('Failed to fetch TikTok profile. Please check the username and try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch TikTok profile. Please try again.');
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
    if (tempBio.trim()) {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;
        setProfileImage(imageData);
        
        // Save to database
        try {
          await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileImage: imageData }),
          });
        } catch (error) {
          console.error('Error saving image:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Link Modal handlers
  const openAddLinkModal = () => {
    setShowAddLinkModal(true);
    setAddLinkStep('layout');
    setSelectedLayout('');
    setLinkTitle('');
    setLinkUrl('');
    setLinkImage('');
  };

  const closeAddLinkModal = () => {
    setShowAddLinkModal(false);
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

  const handleLinkImageUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLinkImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLinkImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLinkImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleLinkImageUpload(file);
    }
  };

  const handleAddLink = async () => {
    if (!linkTitle.trim() || !linkUrl.trim()) {
      alert('Please fill in both title and URL');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: linkTitle.trim(),
          url: linkUrl.trim(),
          icon: selectedLayout.includes('image') ? undefined : 'fas fa-link',
          image: linkImage || undefined,
          layout: selectedLayout,
          order: bioLinks.length,
        }),
      });

      if (response.ok) {
        const { link } = await response.json();
        setBioLinks([...bioLinks, link]);
        closeAddLinkModal();
        alert('Link added successfully! 🎉');
      } else {
        alert('Failed to add link');
      }
    } catch (error) {
      console.error('Error adding link:', error);
      alert('Failed to add link');
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

  const openSocialsModal = () => {
    setShowSocialsModal(true);
    setSocialsStep('platforms');
    setSelectedPlatform(null);
    setSocialUrl('');
  };

  const closeSocialsModal = () => {
    setShowSocialsModal(false);
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
      alert('Please enter a valid URL');
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
        closeSocialsModal();
        alert('Social link added successfully! 🎉');
      } else {
        alert('Failed to add social link');
      }
    } catch (error) {
      console.error('Error adding social link:', error);
      alert('Failed to add social link');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSocialLink = async (id: string) => {
    if (!confirm('Are you sure you want to remove this social link?')) return;

    try {
      const response = await fetch(`/api/socials/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSocialLinks(socialLinks.filter(social => social.id !== id));
      } else {
        alert('Failed to delete social link');
      }
    } catch (error) {
      console.error('Error deleting social link:', error);
      alert('Failed to delete social link');
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
  ];

  const openTemplatesModal = () => {
    setShowTemplatesModal(true);
  };

  const closeTemplatesModal = () => {
    setShowTemplatesModal(false);
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
        closeTemplatesModal();
        alert('Template applied successfully! 🎨');
      } else {
        alert('Failed to apply template');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Top Navigation */}
      <nav className={styles.topNav}>
        <div className={styles.navLeft}>
          <button className={styles.menuBtn}>
            <i className="fas fa-bars"></i>
          </button>
          <Link href="/" className={styles.logoLink}>
            <Image src="/imgs/logo.png" alt="HereMyLinks" width={140} height={35} priority />
          </Link>
        </div>
        
        <div className={styles.navRight}>
          <button className={styles.previewBtn}>
            <i className="fas fa-eye"></i>
            <span>Preview</span>
          </button>
          <button className={styles.shareBtn}>
            <i className="fas fa-share-nodes"></i>
            <span>Share</span>
          </button>
          <button className={styles.publishBtn} onClick={handlePublish} disabled={isSaving}>
            {isSaving ? 'Publishing...' : 'Publish'}
          </button>
          <button 
            className={styles.logoutBtn}
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Logout"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Center Preview */}
        <div className={styles.centerPreview}>
          <div className={`${styles.phoneMockup} ${selectedTemplate === 'template1' ? styles.template1 : ''}`}>
            {/* Profile Section */}
            <div className={styles.profileSection}>
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
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />

              <div className={styles.nameWrapper}>
                {isEditingName ? (
                  <input
                    type="text"
                    className={styles.editNameInput}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={handleNameKeyPress}
                    autoFocus
                    maxLength={50}
                  />
                ) : (
                  <h2 
                    className={styles.profileName}
                    onClick={handleNameClick}
                    title="Click to edit name"
                  >
                    {displayName}
                  </h2>
                )}
              </div>

              <div className={styles.bioWrapper}>
                {isEditingBio ? (
                  <textarea
                    className={styles.editBioInput}
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    onBlur={handleBioSave}
                    onKeyDown={handleBioKeyPress}
                    autoFocus
                    maxLength={150}
                    rows={3}
                  />
                ) : (
                  <p 
                    className={styles.profileBio}
                    onClick={handleBioClick}
                    title="Click to edit bio"
                  >
                    {bio}
                  </p>
                )}
              </div>
            </div>

            {/* Social Icons */}
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
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Add/Edit Buttons */}
          <div className={styles.actionButtons}>
            <button className={styles.addBtn} onClick={() => setShowAddMenu(!showAddMenu)}>
              <i className="fas fa-plus"></i>
            </button>
            <button className={styles.editBtn}>
              <i className="fas fa-pen"></i>
            </button>
          </div>
        </div>

        {/* Right Sidebar - Add Menu */}
        <aside className={styles.rightSidebar}>
          <div className={styles.addSection}>
            <h3 className={styles.addTitle}>add</h3>
            
            <div className={styles.addOptions}>
              <button className={styles.addOption} onClick={openAddLinkModal}>
                <div className={styles.optionIcon}>
                  <i className="fas fa-link"></i>
                </div>
                <div className={styles.optionContent}>
                  <h4 className={styles.optionTitle}>link</h4>
                  <p className={styles.optionDescription}>add any link, any style</p>
                </div>
                <i className="fas fa-chevron-right"></i>
              </button>

              <button className={styles.addOption} onClick={openSocialsModal}>
                <div className={styles.optionIcon}>
                  <i className="fas fa-hashtag"></i>
                </div>
                <div className={styles.optionContent}>
                  <h4 className={styles.optionTitle}>socials</h4>
                  <p className={styles.optionDescription}>connect your social platforms</p>
                </div>
                <i className="fas fa-chevron-right"></i>
              </button>

              <button className={styles.addOption} onClick={openTemplatesModal}>
                <div className={styles.optionIcon}>
                  <i className="fas fa-palette"></i>
                </div>
                <div className={styles.optionContent}>
                  <h4 className={styles.optionTitle}>design & templates</h4>
                  <p className={styles.optionDescription}>customize your page style</p>
                </div>
                <i className="fas fa-chevron-right"></i>
              </button>

              <button className={styles.addOption} onClick={() => setShowTikTokModal(true)}>
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
          </div>
        </aside>
      </div>

      {/* TikTok Autofill Modal */}
      {showTikTokModal && (
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

      {/* Add Link Modal */}
      {showAddLinkModal && (
        <div className={styles.addLinkOverlay} onClick={closeAddLinkModal}>
          <div className={styles.addLinkModal} onClick={(e) => e.stopPropagation()}>
            {addLinkStep === 'layout' ? (
              <>
                {/* Layout Selection Step */}
                <div className={styles.modalHeader}>
                  <button 
                    className={styles.modalBack}
                    onClick={closeAddLinkModal}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <h3 className={styles.modalTitle}>add link</h3>
                  <div style={{ width: '32px' }}></div>
                </div>
                
                <div className={styles.addLinkBody}>
                  <div className={styles.layoutSelectionHeader}>
                    <h4 className={styles.layoutTitle}>select link layout</h4>
                    <p className={styles.layoutSubtitle}>you can change this anytime</p>
                  </div>

                  <div className={styles.layoutOptions}>
                    {/* Layout 1 - Simple Text */}
                    <button 
                      className={styles.layoutOption}
                      onClick={() => handleLayoutSelect('simple')}
                    >
                      <div className={styles.layoutPreview}>
                        <div className={styles.simpleLayout}>
                          <span>link title ...</span>
                        </div>
                      </div>
                    </button>

                    {/* Layout 2 - Image Left + Text Right */}
                    <button 
                      className={styles.layoutOption}
                      onClick={() => handleLayoutSelect('image-left')}
                    >
                      <div className={styles.layoutPreview}>
                        <div className={styles.imageLeftLayout}>
                          <div className={styles.layoutImagePlaceholder}>
                            <span>image</span>
                          </div>
                          <span>link title ...</span>
                        </div>
                      </div>
                    </button>

                    {/* Layout 3 - Image Right + Text Left */}
                    <button 
                      className={styles.layoutOption}
                      onClick={() => handleLayoutSelect('image-right')}
                    >
                      <div className={styles.layoutPreview}>
                        <div className={styles.imageRightLayout}>
                          <div className={styles.layoutImagePlaceholder}>
                            <span>image</span>
                          </div>
                          <span>link title ...</span>
                        </div>
                      </div>
                    </button>

                    {/* Layout 4 - Image Top + Text Bottom (Grid Left) */}
                    <button 
                      className={styles.layoutOption}
                      onClick={() => handleLayoutSelect('image-top-left')}
                    >
                      <div className={styles.layoutPreview}>
                        <div className={styles.imageTopLayout}>
                          <div className={styles.layoutImagePlaceholder}>
                            <span>image</span>
                          </div>
                          <span>link title ...</span>
                        </div>
                      </div>
                    </button>

                    {/* Layout 5 - Image Top + Text Bottom (Grid Right) */}
                    <button 
                      className={styles.layoutOption}
                      onClick={() => handleLayoutSelect('image-top-right')}
                    >
                      <div className={styles.layoutPreview}>
                        <div className={styles.imageTopLayout}>
                          <div className={styles.layoutImagePlaceholder}>
                            <span>image</span>
                          </div>
                          <span>link title ...</span>
                        </div>
                      </div>
                    </button>

                    {/* Layout 6 - Large Image */}
                    <button 
                      className={styles.layoutOption}
                      onClick={() => handleLayoutSelect('image-large')}
                    >
                      <div className={styles.layoutPreview}>
                        <div className={styles.imageLargeLayout}>
                          <div className={styles.layoutImagePlaceholder}>
                            <span>image</span>
                          </div>
                          <span>link title ...</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Form Step */}
                <div className={styles.modalHeader}>
                  <button 
                    className={styles.modalBack}
                    onClick={backToLayoutSelection}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <h3 className={styles.modalTitle}>add link</h3>
                  <div style={{ width: '32px' }}></div>
                </div>
                
                <div className={styles.addLinkBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Link Title</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Enter link title"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Link URL</label>
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
                      <label className={styles.formLabel}>Link Image (Optional)</label>
                      <div 
                        className={`${styles.imageDropZone} ${isDragging ? styles.dragging : ''} ${linkImage ? styles.hasImage : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => linkImageInputRef.current?.click()}
                      >
                        {linkImage ? (
                          <div className={styles.uploadedImage}>
                            <img src={linkImage} alt="Link preview" />
                            <button 
                              className={styles.removeImageBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLinkImage('');
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ) : (
                          <>
                            <i className="fas fa-cloud-upload-alt"></i>
                            <p className={styles.dropZoneText}>
                              Drag and drop or <span>click to upload</span>
                            </p>
                            <p className={styles.dropZoneHint}>PNG, JPG up to 5MB</p>
                          </>
                        )}
                      </div>
                      <input
                        ref={linkImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLinkImageInputChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}

                  <div className={styles.formActions}>
                    <button 
                      className={styles.cancelFormBtn}
                      onClick={closeAddLinkModal}
                    >
                      Cancel
                    </button>
                    <button 
                      className={styles.addLinkBtn}
                      onClick={handleAddLink}
                      disabled={!linkTitle.trim() || !linkUrl.trim()}
                    >
                      Add Link
                    </button>
                  </div>
                </div>
              </>
            )}
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

      {/* Socials Modal */}
      {showSocialsModal && (
        <div className={styles.addLinkOverlay} onClick={closeSocialsModal}>
          <div className={styles.addLinkModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {socialsStep === 'input' && (
                <button className={styles.modalBack} onClick={backToPlatformSelection}>
                  <i className="fas fa-arrow-left"></i>
                </button>
              )}
              <h3 className={styles.modalTitle}>
                {socialsStep === 'platforms' ? 'Add Social Media' : `Add ${selectedPlatform?.name}`}
              </h3>
              <button className={styles.modalClose} onClick={closeSocialsModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className={styles.addLinkBody}>
              {socialsStep === 'platforms' ? (
                <>
                  <div className={styles.layoutSelectionHeader}>
                    <p className={styles.layoutSubtitle}>
                      Choose a platform to connect
                    </p>
                  </div>

                  <div className={styles.socialPlatformsGrid}>
                    {socialPlatforms.map((platform) => (
                      <button
                        key={platform.name}
                        className={styles.socialPlatformBtn}
                        onClick={() => selectPlatform(platform)}
                      >
                        <i className={platform.icon}></i>
                        <span>{platform.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      {selectedPlatform?.name} URL
                    </label>
                    <input
                      type="url"
                      className={styles.formInput}
                      placeholder={`https://${selectedPlatform?.name.toLowerCase()}.com/yourprofile`}
                      value={socialUrl}
                      onChange={(e) => setSocialUrl(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button 
                      className={styles.cancelFormBtn}
                      onClick={closeSocialsModal}
                    >
                      Cancel
                    </button>
                    <button 
                      className={styles.addLinkBtn}
                      onClick={handleAddSocial}
                      disabled={!socialUrl.trim() || isSaving}
                    >
                      {isSaving ? 'Adding...' : 'Add Social'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className={styles.modalOverlay} onClick={closeTemplatesModal}>
          <div className={styles.templatesModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Choose a Template</h3>
              <button className={styles.modalClose} onClick={closeTemplatesModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className={styles.templatesBody}>
              <p className={styles.modalDescription}>
                Select a design template to customize the look of your bio link page
              </p>

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
                      ) : (
                        <div className={styles.templatePreviewBold}>
                          <div className={styles.previewCircle}></div>
                          <div className={styles.previewLine}></div>
                          <div className={styles.previewLine}></div>
                          <div className={styles.previewButtonBold}></div>
                          <div className={styles.previewButtonBold}></div>
                        </div>
                      )}
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
        </div>
      )}
    </div>
  );
}
