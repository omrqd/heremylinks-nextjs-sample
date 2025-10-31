'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './public-bio.module.css';

interface User {
  username: string;
  name: string;
  bio: string;
  profileImage: string;
  heroImage: string;
  heroHeight: number;
  hideProfilePicture: boolean;
  themeColor: string;
  backgroundColor: string;
  template: string;
  backgroundImage: string;
  backgroundVideo: string;
  cardBackgroundColor: string;
  cardBackgroundImage: string;
  cardBackgroundVideo: string;
  customText: string;
  usernameColor: string;
  bioColor: string;
  customTextColor: string;
}

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon?: string | null;
  image?: string | null;
  layout?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  isTransparent?: boolean;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

interface PublicBioPageProps {
  user: User;
  links: BioLink[];
  socials: SocialLink[];
}

export default function PublicBioPage({ user, links, socials }: PublicBioPageProps) {
  // Video refs for Safari compatibility
  const pageVideoRef = useRef<HTMLVideoElement>(null);
  const cardVideoRef = useRef<HTMLVideoElement>(null);

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
  }, [user.backgroundVideo, user.cardBackgroundVideo]);

  const handleLinkClick = async (linkId: string, url: string) => {
    // Track link click (optional analytics)
    try {
      await fetch('/api/track/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId }),
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }

    // Ensure URL has protocol
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = 'https://' + url;
    }

    // Open link
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={styles.publicBioContainer} 
      style={{ 
        backgroundColor: user.backgroundColor,
        backgroundImage: user.backgroundImage ? `url(${user.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}
    >
      {/* Page Background Video */}
      {user.backgroundVideo && (
        <video
          ref={pageVideoRef}
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          preload="auto"
          className={styles.backgroundVideo}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src={user.backgroundVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      <div 
        className={`${styles.bioCard} ${
          user.template === 'template1' ? styles.template1 : 
          user.template === 'template2' ? styles.template2 : 
          user.template === 'template3' ? styles.template3 : ''
        }`}
        style={{
          // For template3, always use black background - don't apply cardBackgroundColor
          backgroundColor: user.template === 'template3' ? '#000000' : user.cardBackgroundColor,
          backgroundImage: user.cardBackgroundImage ? `url(${user.cardBackgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Hero Image Section - Template 3 Only */}
        {user.template === 'template3' && (
          <div className={styles.heroImageWrapper} style={{ height: `${user.heroHeight}px` }}>
            {user.heroImage ? (
              <img src={user.heroImage} alt="Hero banner" className={styles.heroImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}></div>
            )}
            <div className={styles.heroGradient}></div>
          </div>
        )}

        {/* Card Background Video */}
        {user.cardBackgroundVideo && (
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
              borderRadius: '24px',
            }}
          >
            <source src={user.cardBackgroundVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        {/* Profile Section */}
        <div className={styles.profileSection}>
          {/* Conditionally hide profile picture in template3 */}
          {!(user.template === 'template3' && user.hideProfilePicture) && (
            <div className={styles.profileImageWrapper}>
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className={styles.profileImage} />
              ) : (
                <div className={styles.profilePlaceholder} style={{ background: user.themeColor }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          <h1 className={styles.profileName} style={{ color: user.usernameColor }}>
            {user.name}
            {user.template === 'template3' && (
              <span className={styles.verifiedBadge}>
                <i className="fas fa-check"></i>
              </span>
            )}
          </h1>
          
          {/* @username handle - Template 3 Only */}
          {user.template === 'template3' && (
            <div className={styles.usernameHandle}>
              @{user.username}
            </div>
          )}

          {/* Social Icons - Moved before bio */}
          {socials.length > 0 && (
            <div className={styles.socialIconsContainer}>
              {socials.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLinkClick(social.id, social.url);
                  }}
                  title={social.platform}
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          )}
          
          {user.bio && <p className={styles.profileBio} style={{ color: user.bioColor }}>{user.bio}</p>}
        </div>

        {/* Links Section */}
        <div className={styles.linksSection}>
          {links.length === 0 ? (
            <div className={styles.noLinks}>
              <i className="fas fa-link"></i>
              <p>No links yet</p>
            </div>
          ) : (
            links.map((link) => {
              const layoutClass = link.layout
                ? styles[`layout${link.layout.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`]
                : styles.layoutSimple;

              const isTemplate3 = user.template === 'template3';
              const shouldUseBackgroundImage = isTemplate3 && link.image && (
                link.layout === 'image-top' || 
                link.layout === 'image-top-left' || 
                link.layout === 'image-top-right' || 
                link.layout === 'image-large'
              );
              const hasImageBackground = shouldUseBackgroundImage;

              const linkStyle = {
                // For template3 background images, make transparent by default
                backgroundColor: shouldUseBackgroundImage ? 'transparent' : (link.isTransparent ? 'transparent' : (link.backgroundColor || '#ffffff')),
                borderColor: link.isTransparent ? 'rgba(255, 255, 255, 0.3)' : user.themeColor,
                border: link.isTransparent ? '2px solid rgba(255, 255, 255, 0.3)' : `2px solid ${user.themeColor}`,
                // For template3, apply image as background for specific layouts
                ...(shouldUseBackgroundImage && {
                  backgroundImage: `url(${link.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }),
              };

              return (
                <button
                  key={link.id}
                  className={`${styles.bioLink} ${layoutClass} ${hasImageBackground ? styles.hasImage : ''}`}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  style={linkStyle}
                >
                  {/* Template3: Render icon badge in top-right and title in bottom-left */}
                  {isTemplate3 && hasImageBackground ? (
                    <>
                      {link.icon && (
                        <i className={`${link.icon} ${styles.linkIcon}`}></i>
                      )}
                      <span className={styles.linkTitle}>{link.title}</span>
                    </>
                  ) : (
                    <>
                      {/* Image Left Layout */}
                      {link.image && link.layout === 'image-left' && (
                        <div className={styles.linkImageLeft}>
                          <img src={link.image} alt={link.title} />
                        </div>
                      )}

                      {/* Image Top Layouts */}
                      {link.image && (link.layout === 'image-top' || link.layout === 'image-top-left' || link.layout === 'image-top-right' || link.layout === 'image-large') && (
                        <div className={styles.linkImageTop}>
                          <img src={link.image} alt={link.title} />
                        </div>
                      )}

                      <div className={styles.linkContent}>
                        {link.icon && !link.image && (
                          <i className={`${link.icon} ${styles.linkIcon}`} style={{ color: link.textColor || user.themeColor }}></i>
                        )}
                        <span className={styles.linkTitle} style={{ color: link.textColor || '#1a1a1a' }}>{link.title}</span>
                      </div>

                      {/* Image Right Layout */}
                      {link.image && link.layout === 'image-right' && (
                        <div className={styles.linkImageRight}>
                          <img src={link.image} alt={link.title} />
                        </div>
                      )}

                      <i className="fas fa-arrow-right" style={{ color: user.themeColor }}></i>
                    </>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Custom Text Section */}
        {user.customText && (
          <div className={styles.customTextSection}>
            <p className={styles.customText} style={{ color: user.customTextColor }}>{user.customText}</p>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <a href="/" className={styles.footerLink}>
            <Image 
              src={user.template === 'template3' ? "/imgs/white-logo.png" : "/imgs/logo.png"} 
              alt="HereMyLinks" 
              width={120} 
              height={30} 
            />
          </a>
        </div>
      </div>
    </div>
  );
}

