'use client';

import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, duration = 4000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-hide after duration
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div 
      className={`${styles.toast} ${styles[type]} ${isVisible ? styles.visible : ''} ${isLeaving ? styles.leaving : ''}`}
      onClick={() => {
        setIsLeaving(true);
        setTimeout(onClose, 300);
      }}
    >
      <div className={styles.content}>
        <span className={styles.icon}>{getIcon()}</span>
        <span className={styles.message}>{message}</span>
      </div>
      <button className={styles.closeButton} onClick={(e) => {
        e.stopPropagation();
        setIsLeaving(true);
        setTimeout(onClose, 300);
      }}>
        ×
      </button>
    </div>
  );
}