"use client";

import { useNotifications } from '@/contexts/NotificationContext';

export default function GlobalToast() {
  const { toastNotifications, removeToastNotification } = useNotifications();

  if (toastNotifications.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: 'var(--font-geist-sans), sans-serif'
      }}
    >
      {toastNotifications.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            background: 'var(--brand)',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: '350px',
            minWidth: '300px',
            animation: `slideIn 0.3s ease-out ${index * 0.1}s both`,
            transform: 'translateX(0)',
            opacity: 1,
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '16px' }}>
            {toast.title}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {toast.body}
          </div>
          <button
            onClick={() => removeToastNotification(toast.id)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              lineHeight: 1,
              opacity: 0.8,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            ×
          </button>
        </div>
      ))}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}