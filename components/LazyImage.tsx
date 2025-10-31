'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './LazyImage.module.css';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export default function LazyImage({ 
  src, 
  alt, 
  width, 
  height, 
  fill = false,
  priority = false,
  className = '',
  style = {},
  objectFit = 'cover'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Reset states when src changes
    setIsLoaded(false);
    setIsError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(true); // Stop showing skeleton on error
  };

  return (
    <div 
      className={`${styles.lazyImageWrapper} ${className}`}
      style={{
        width: fill ? '100%' : width,
        height: fill ? '100%' : height,
        position: fill ? 'relative' : 'relative',
        ...style
      }}
    >
      {/* Shimmer Skeleton */}
      {!isLoaded && !isError && (
        <div className={styles.skeleton}>
          <div className={styles.shimmer}></div>
        </div>
      )}

      {/* Actual Image */}
      {!isError && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          className={`${styles.image} ${isLoaded ? styles.loaded : ''}`}
          style={fill ? { objectFit } : {}}
        />
      )}

      {/* Error State */}
      {isError && (
        <div className={styles.errorState}>
          <i className="fas fa-image" style={{ fontSize: '24px', color: '#9ca3af' }}></i>
          <span>Failed to load</span>
        </div>
      )}
    </div>
  );
}

