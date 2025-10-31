'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from '../app/home.module.css';
import LazyImage from './LazyImage';

const features = [
  {
    subtitle: 'youtube, tiktok, spotify',
    title: 'content embeds',
    image: '/imgs/feature1.jpg',
    color: 'Beige'
  },
  {
    subtitle: 'payments',
    title: 'tips & paywalls',
    image: '/imgs/feature2.jpg',
    color: 'Green'
  },
  {
    subtitle: 'design',
    title: 'themes & accents',
    image: '/imgs/feature3.jpg',
    color: 'Purple'
  },
  {
    subtitle: 'insights',
    title: 'analytics',
    image: '/imgs/feature4.jpg',
    color: 'Beige'
  }
];

export default function FeaturesSlider() {
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const momentumIdRef = useRef<number | null>(null);
  const autoScrollIdRef = useRef<number | null>(null);

  // Duplicate features for infinite scroll effect
  const allFeatures = [...features, ...features];

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const autoScrollSpeed = 1;

    const autoScroll = () => {
      if (isUserInteracting || !slider) {
        return;
      }

      slider.scrollLeft += autoScrollSpeed;

      const halfScroll = slider.scrollWidth / 2;
      if (slider.scrollLeft >= halfScroll) {
        slider.scrollLeft = 0;
      }

      autoScrollIdRef.current = requestAnimationFrame(autoScroll);
    };

    const startAutoScroll = () => {
      if (!isUserInteracting) {
        autoScrollIdRef.current = requestAnimationFrame(autoScroll);
      }
    };

    const stopAutoScroll = () => {
      if (autoScrollIdRef.current) {
        cancelAnimationFrame(autoScrollIdRef.current);
      }
    };

    // Start auto-scroll
    startAutoScroll();

    const handleMouseEnter = () => {
      setIsUserInteracting(true);
      stopAutoScroll();
    };

    const handleMouseLeave = () => {
      if (!isDown) {
        setTimeout(() => {
          if (!isDown) {
            setIsUserInteracting(false);
          }
        }, 2000);
      }
    };

    slider.addEventListener('mouseenter', handleMouseEnter);
    slider.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      stopAutoScroll();
      slider.removeEventListener('mouseenter', handleMouseEnter);
      slider.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isUserInteracting, isDown]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const slider = sliderRef.current;
    if (!slider) return;
    
    setIsDown(true);
    setIsUserInteracting(true);
    setStartX(e.pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
    
    if (momentumIdRef.current) {
      cancelAnimationFrame(momentumIdRef.current);
    }
    
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDown(false);
    beginMomentumTracking();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const slider = sliderRef.current;
    if (!isDown || !slider) return;

    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    const prevScrollLeft = slider.scrollLeft;
    slider.scrollLeft = scrollLeft - walk;

    setVelocity(slider.scrollLeft - prevScrollLeft);
  };

  const beginMomentumTracking = () => {
    if (momentumIdRef.current) {
      cancelAnimationFrame(momentumIdRef.current);
    }

    const momentumLoop = () => {
      const slider = sliderRef.current;
      if (!slider) return;

      slider.scrollLeft += velocity;
      const newVelocity = velocity * 0.95;
      setVelocity(newVelocity);

      if (Math.abs(newVelocity) > 0.5) {
        momentumIdRef.current = requestAnimationFrame(momentumLoop);
      }
    };

    momentumIdRef.current = requestAnimationFrame(momentumLoop);
  };

  return (
    <div className={styles.featuresSection}>
      <h2 className={styles.featuresTitle}>
        powerful features built<br />for creators:
      </h2>
      <div
        ref={sliderRef}
        className={styles.featuresSlider}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div ref={trackRef} className={styles.featuresTrack}>
          {allFeatures.map((feature, index) => (
            <div
              key={index}
              className={`${styles.featureCard} ${styles[`card${feature.color}`]}`}
            >
              <div className={styles.cardTextContent}>
                <span className={styles.cardSubtitle}>{feature.subtitle}</span>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
              </div>
              <div className={styles.cardImage}>
                <LazyImage
                  src={feature.image}
                  alt={feature.title}
                  width={400}
                  height={400}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

