'use client';

import { useState, useRef } from 'react';
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

export default function DashboardPage() {
  const [profileImage, setProfileImage] = useState('');
  const [displayName, setDisplayName] = useState('Your Name');
  const [username, setUsername] = useState('yourname');
  const [bio, setBio] = useState('Add your bio here');
  const [bioLinks, setBioLinks] = useState<BioLink[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const addLink = () => {
    const newLink: BioLink = {
      id: Date.now().toString(),
      title: 'New Link',
      url: '#'
    };
    setBioLinks([...bioLinks, newLink]);
    setShowAddMenu(false);
  };

  const deleteLink = (id: string) => {
    setBioLinks(bioLinks.filter(link => link.id !== id));
  };

  const handlePublish = () => {
    alert('Your page has been published!');
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

  const handleNameSave = () => {
    if (tempName.trim()) {
      setDisplayName(tempName.trim());
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

  const handleBioSave = () => {
    if (tempBio.trim()) {
      setBio(tempBio.trim());
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
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
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

  const handleAddLink = () => {
    if (!linkTitle.trim() || !linkUrl.trim()) {
      alert('Please fill in both title and URL');
      return;
    }

    const newLink: BioLink = {
      id: Date.now().toString(),
      title: linkTitle.trim(),
      url: linkUrl.trim(),
      icon: selectedLayout.includes('image') ? undefined : 'fas fa-link',
      image: linkImage || undefined,
      layout: selectedLayout
    };

    setBioLinks([...bioLinks, newLink]);
    closeAddLinkModal();
    alert('Link added successfully! 🎉');
  };

  const backToLayoutSelection = () => {
    setAddLinkStep('layout');
    setLinkTitle('');
    setLinkUrl('');
    setLinkImage('');
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
          <button className={styles.publishBtn} onClick={handlePublish}>
            Publish
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Center Preview */}
        <div className={styles.centerPreview}>
          <div className={styles.phoneMockup}>
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
                bioLinks.map((link) => {
                  const layoutClass = link.layout ? styles[`preview${link.layout.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`] : styles.previewSimple;
                  
                  return (
                    <div key={link.id} className={`${styles.bioLinkItem} ${layoutClass}`}>
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
                      
                      <button 
                        className={styles.deleteLinkBtn}
                        onClick={() => deleteLink(link.id)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  );
                })
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

              <button className={styles.addOption}>
                <div className={styles.optionIcon}>
                  <i className="fas fa-hashtag"></i>
                </div>
                <div className={styles.optionContent}>
                  <h4 className={styles.optionTitle}>socials</h4>
                  <p className={styles.optionDescription}>connect your social platforms</p>
                </div>
                <i className="fas fa-chevron-right"></i>
              </button>

              <button className={styles.addOption}>
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
    </div>
  );
}
