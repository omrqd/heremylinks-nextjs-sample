'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './public-bio.module.css';

interface User {
  username: string;
  name: string;
  bio: string;
  profileImage: string;
  themeColor: string;
  backgroundColor: string;
  template: string;
}

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon?: string | null;
  image?: string | null;
  layout?: string | null;
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

    // Open link
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.publicBioContainer} style={{ backgroundColor: user.backgroundColor }}>
      <div className={`${styles.bioCard} ${user.template === 'template1' ? styles.template1 : ''}`}>
        {/* Profile Section */}
        <div className={styles.profileSection}>
          <div className={styles.profileImageWrapper}>
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} className={styles.profileImage} />
            ) : (
              <div className={styles.profilePlaceholder} style={{ background: user.themeColor }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1 className={styles.profileName}>{user.name}</h1>
          {user.bio && <p className={styles.profileBio}>{user.bio}</p>}
        </div>

        {/* Social Icons */}
        {socials.length > 0 && (
          <div className={styles.socialIconsContainer}>
            {socials.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                style={{ background: user.themeColor }}
                title={social.platform}
              >
                <i className={social.icon}></i>
              </a>
            ))}
          </div>
        )}

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

              return (
                <button
                  key={link.id}
                  className={`${styles.bioLink} ${layoutClass}`}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  style={{ borderColor: user.themeColor }}
                >
                  {/* Image Left Layout */}
                  {link.image && link.layout === 'image-left' && (
                    <div className={styles.linkImageLeft}>
                      <img src={link.image} alt={link.title} />
                    </div>
                  )}

                  {/* Image Top Layouts */}
                  {link.image && (link.layout === 'image-top-left' || link.layout === 'image-top-right' || link.layout === 'image-large') && (
                    <div className={styles.linkImageTop}>
                      <img src={link.image} alt={link.title} />
                    </div>
                  )}

                  <div className={styles.linkContent}>
                    {link.icon && !link.image && (
                      <i className={`${link.icon} ${styles.linkIcon}`} style={{ color: user.themeColor }}></i>
                    )}
                    <span className={styles.linkTitle}>{link.title}</span>
                  </div>

                  {/* Image Right Layout */}
                  {link.image && link.layout === 'image-right' && (
                    <div className={styles.linkImageRight}>
                      <img src={link.image} alt={link.title} />
                    </div>
                  )}

                  <i className="fas fa-arrow-right" style={{ color: user.themeColor }}></i>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <a href="/" className={styles.footerLink}>
            <Image src="/imgs/logo.png" alt="HereMyLinks" width={120} height={30} />
          </a>
        </div>
      </div>
    </div>
  );
}

