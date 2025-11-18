"use client";

import { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationBellProps {
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function NotificationBell({ onClick, className = '', style }: NotificationBellProps) {
  const { unreadCount } = useNotifications();
  const [isHovered, setIsHovered] = useState(false);

  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`btn ghost ${className}`}
      style={{
        position: 'relative',
        padding: '8px 12px',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        ...style
      }}
      title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      {/* Bell Icon */}
      <div
        style={{
          color: isHovered ? 'var(--brand)' : 'var(--text-2)',
          transition: 'color 0.2s ease'
        }}
      >
        {unreadCount > 0 ? <BellRing size={18} /> : <Bell size={18} />}
      </div>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <span
          className="badge"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'var(--danger)',
            color: 'white',
            border: '2px solid var(--card)',
            borderRadius: '999px',
            fontSize: '10px',
            fontWeight: 'bold',
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            boxShadow: 'var(--shadow-sm)',
            animation: unreadCount > 0 ? 'bellPulse 2s ease-in-out infinite' : 'none'
          }}
        >
          {displayCount}
        </span>
      )}

      {/* Hover Effect Styles */}
      <style jsx>{`
        @keyframes bellPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        button:hover {
          border-color: var(--brand);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--brand), transparent 90%);
        }

        button:active {
          transform: translateY(1px);
        }
      `}</style>
    </button>
  );
}