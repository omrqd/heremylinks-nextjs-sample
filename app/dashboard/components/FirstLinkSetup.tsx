'use client';

import { useState, useEffect } from 'react';
import styles from '../dashboard.module.css';

interface FirstLinkSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string) => void;
}

export default function FirstLinkSetup({ isOpen, onClose, onSuccess }: FirstLinkSetupProps) {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setError('');
      setIsAvailable(null);
    }
  }, [isOpen]);

  // Check username availability with debounce
  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      setError('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      await checkUsernameAvailability(username);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3) {
      setError('Username must be at least 3 characters');
      setIsAvailable(false);
      return;
    }

    if (usernameToCheck.length > 50) {
      setError('Username must be 50 characters or less');
      setIsAvailable(false);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(usernameToCheck)) {
      setError('Username can only contain letters, numbers, dashes, and underscores');
      setIsAvailable(false);
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      const response = await fetch(`/api/username/check?username=${encodeURIComponent(usernameToCheck)}`);
      const data = await response.json();

      if (!data.available) {
        setError(data.error || 'This username is already taken');
        setIsAvailable(false);
      } else {
        setError('');
        setIsAvailable(true);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setError('Failed to check username availability');
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!username || username.length < 3 || !isAvailable) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/username/set-first', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data.username);
        onClose();
      } else {
        setError(data.error || 'Failed to set username');
      }
    } catch (error) {
      console.error('Error setting username:', error);
      setError('Failed to set username. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <i className="fas fa-user-plus"></i> Choose Your Link
          </h2>
          <button className={styles.modalClose} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalDescription}>
            Set your unique link name. This becomes your public profile URL.
          </p>

          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.formLabel}>
              Link Name <span className={styles.requiredField}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  background: '#2A2A2A',
                  color: '#9CA3AF',
                  padding: '12px 16px',
                  border: '1px solid #3A3A3A',
                  borderRight: 'none',
                  borderTopLeftRadius: 8,
                  borderBottomLeftRadius: 8,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                }}
              >
                heremylinks.com/
              </span>
              <input
                id="username"
                type="text"
                className={styles.formInput}
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                maxLength={50}
                disabled={isSubmitting}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderLeft: 'none',
                }}
              />
            </div>
          </div>

          {/* Validation feedback */}
          {error && (
            <div className={styles.modalDescription} style={{ color: '#FF6B6B' }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
          {isAvailable === true && !error && !isChecking && (
            <div className={styles.modalDescription} style={{ color: '#10b981' }}>
              <i className="fas fa-check-circle"></i> Great! This username is available
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.primaryBtn}
            onClick={handleSubmit}
            disabled={!username || username.length < 3 || !isAvailable || isSubmitting || isChecking}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Setting up...
              </>
            ) : (
              <>
                <i className="fas fa-rocket"></i> Create My Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}