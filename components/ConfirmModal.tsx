'use client';

import React from 'react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={`${styles.icon} ${styles[`icon${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}>
            {type === 'danger' && <i className="fas fa-exclamation-triangle"></i>}
            {type === 'warning' && <i className="fas fa-exclamation-circle"></i>}
            {type === 'info' && <i className="fas fa-info-circle"></i>}
          </div>
        </div>
        
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`${styles.confirmButton} ${styles[`confirmButton${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

