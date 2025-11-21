"use client";

import { useState, useEffect } from 'react';

export default function NotificationPermissionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Check if notifications are supported and permission is default (not granted or denied)
      const shouldShow = 'Notification' in window &&
                         Notification.permission === 'default' &&
                         location.protocol === 'https:' ||
                         location.hostname === 'localhost' ||
                         location.hostname === '127.0.0.1';

      setShowBanner(shouldShow);
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) return;

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        setShowBanner(false);

        // Show a test notification to confirm it works
        new Notification('Notifications Enabled!', {
          body: 'You will now receive alerts for upcoming tasks and reminders.',
          icon: '/favicon.ico',
          tag: 'notification-test'
        });
      } else if (permission === 'denied') {
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="card" style={{
      background: 'var(--brand-50)',
      border: '1px solid var(--brand-200)',
      marginBottom: '20px'
    }}>
      <div className="row" style={{ gap: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: '16px' }}>
            🔔 Enable Browser Notifications
          </h4>
          <p style={{ margin: 0, color: 'var(--text-2)', fontSize: '14px', lineHeight: '1.4' }}>
            Get alerts for upcoming tasks and deadlines even when the tab isn't active.
            Stay on top of your academic schedule with timely reminders.
          </p>
        </div>

        <div className="row" style={{ gap: '8px', flexShrink: 0 }}>
          <button
            onClick={handleDismiss}
            className="btn ghost"
            disabled={isLoading}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            Maybe Later
          </button>
          <button
            onClick={handleRequestPermission}
            className="btn"
            disabled={isLoading}
            style={{ fontSize: '14px', padding: '8px 16px', minWidth: '140px' }}
          >
            {isLoading ? 'Enabling...' : 'Enable Now'}
          </button>
        </div>
      </div>
    </div>
  );
}