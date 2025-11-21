"use client";

import { useState } from 'react';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}: ConfirmModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading || internalLoading) return;

    try {
      setInternalLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Confirm action failed:', error);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleClose = () => {
    if (loading || internalLoading) return;
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          confirmBg: 'var(--danger)',
          confirmHover: 'var(--danger-hover, #dc2626)',
          confirmText: 'white'
        };
      case 'warning':
        return {
          confirmBg: 'var(--warning, #f59e0b)',
          confirmHover: 'var(--warning-hover, #d97706)',
          confirmText: 'white'
        };
      case 'info':
        return {
          confirmBg: 'var(--brand)',
          confirmHover: 'var(--brand-hover, #2563eb)',
          confirmText: 'white'
        };
      default:
        return {
          confirmBg: 'var(--danger)',
          confirmHover: 'var(--danger-hover, #dc2626)',
          confirmText: 'white'
        };
    }
  };

  const styles = getVariantStyles();
  const isLoading = loading || internalLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="small"
      showCloseButton={!isLoading}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Message */}
        <p style={{
          margin: 0,
          color: 'var(--text)',
          lineHeight: '1.5',
          fontSize: 'var(--fs-body)'
        }}>
          {message}
        </p>

        {/* Warning icon for dangerous actions */}
        {variant === 'danger' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            backgroundColor: 'var(--danger-bg, #fef2f2)',
            border: '1px solid var(--danger-border, #fecaca)',
            borderRadius: '8px'
          }}>
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--danger, #dc2626)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>
              <path d="M12 9v4"/>
              <path d="m12 17 .01 0"/>
            </svg>
            <span style={{
              color: 'var(--danger, #dc2626)',
              fontSize: 'var(--fs-small)',
              fontWeight: '500'
            }}>
              This action cannot be undone
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '8px'
        }}>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="btn"
            style={{
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="btn"
            style={{
              backgroundColor: styles.confirmBg,
              color: styles.confirmText,
              border: 'none',
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = styles.confirmHover;
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = styles.confirmBg;
              }
            }}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}