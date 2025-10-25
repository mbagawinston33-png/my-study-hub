"use client";

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';

      // Restore focus to previous element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Get modal width based on size
  const getModalWidth = () => {
    switch (size) {
      case 'small':
        return 'min(400px, 90vw)';
      case 'large':
        return 'min(800px, 95vw)';
      default:
        return 'min(560px, 92vw)';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'block',
          zIndex: 1000
        }}
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        className="modal"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'grid',
          placeItems: 'center',
          zIndex: 1001,
          padding: '20px'
        }}
      >
        <div
          ref={modalRef}
          className="modal-sheet"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            width: getModalWidth(),
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            padding: '20px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="modal-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border)'
            }}
          >
            <h2
              id="modal-title"
              style={{
                margin: 0,
                fontSize: 'var(--fs-h2)',
                color: 'var(--text)',
                fontWeight: '600'
              }}
            >
              {title}
            </h2>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="btn ghost"
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Content */}
          <div
            className="modal-content"
            style={{
              flex: 1,
              overflow: 'auto',
              minHeight: 0
            }}
          >
            {children}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideIn {
          from {
            transform: translateY(-20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .modal-backdrop {
          animation: modalFadeIn 0.2s ease-out;
        }

        .modal-sheet {
          animation: modalSlideIn 0.3s ease-out;
        }

        /* Focus styles for accessibility */
        .modal-sheet:focus-within {
          outline: 2px solid var(--brand);
          outline-offset: 2px;
        }

        /* Scrollbar styling for modal content */
        .modal-content::-webkit-scrollbar {
          width: 6px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: var(--border);
          border-radius: 3px;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: var(--text-2);
          border-radius: 3px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: var(--text);
        }
      `}</style>
    </>
  );
}