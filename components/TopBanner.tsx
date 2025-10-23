'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../app/home.module.css';

export default function TopBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className={styles.topBarMessage}>
      <div className={styles.topBarContent}>
        <span className={styles.topBarText}>
          Get <strong>50% OFF</strong> on Pro — Limited time only
        </span>
        <Link href="/login" className={styles.topBarLink}>
          Learn more →
        </Link>
      </div>
      <button
        className={styles.closeBtn}
        aria-label="Close banner"
        onClick={() => setIsVisible(false)}
      >
        ×
      </button>
    </div>
  );
}

