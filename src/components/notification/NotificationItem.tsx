"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  Info,
  X,
  ExternalLink,
  Check
} from 'lucide-react';
import {
  PersistentNotification,
  getNotificationConfig,
  formatNotificationTimestamp,
  NOTIFICATION_PRIORITY_CONFIG
} from '@/types/notification';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationItemProps {
  notification: PersistentNotification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: PersistentNotification) => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  showActions = true,
  compact = false
}: NotificationItemProps) {
  const router = useRouter();
  const { markAsRead } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const config = getNotificationConfig(notification.type);
  const priorityConfig = NOTIFICATION_PRIORITY_CONFIG[notification.priority];

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'task_due':
      case 'reminder_due':
        return <Calendar size={20} />;
      case 'task_completed':
      case 'reminder_completed':
        return <CheckCircle size={20} />;
      case 'task_overdue':
      case 'reminder_overdue':
        return <AlertTriangle size={20} />;
      case 'file_uploaded':
        return <FileText size={20} />;
      case 'timer_complete':
        return <Clock size={20} />;
      case 'system':
        return <Info size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const handleClick = async () => {
    if (onClick) {
      onClick(notification);
      return;
    }

    // Default behavior: navigate to related entity
    if (notification.sourceEntity) {
      let navigationUrl = '';

      switch (notification.sourceEntity.type) {
        case 'task':
          navigationUrl = `/dashboard/tasks?highlight=${notification.sourceEntity.id}`;
          break;
        case 'reminder':
          navigationUrl = `/dashboard/reminders?highlight=${notification.sourceEntity.id}`;
          break;
        case 'subject':
          navigationUrl = `/dashboard/subjects?highlight=${notification.sourceEntity.id}`;
          break;
      }

      if (navigationUrl) {
        router.push(navigationUrl);
      }
    }

    // Mark as read if unread
    if (!notification.isRead) {
      await handleMarkAsRead();
    }
  };

  const handleMarkAsRead = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (isLoading || notification.isRead) return;

    setIsLoading(true);
    try {
      if (onMarkAsRead) {
        onMarkAsRead(notification.id);
      } else {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isLoading || !onDelete) return;

    setIsLoading(true);
    try {
      onDelete(notification.id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`card ${notification.isRead ? 'read' : 'unread'}`}
      style={{
        padding: compact ? '12px 16px' : '16px',
        cursor: 'pointer',
        background: notification.isRead ? 'var(--card)' : 'var(--bg-2)',
        border: `1px solid ${notification.isRead ? 'var(--border)' : 'var(--brand-200)'}`,
        borderRadius: 'var(--radius)',
        marginBottom: '8px',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        position: 'relative'
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Priority Indicator */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          borderTopLeftRadius: 'var(--radius)',
          borderBottomLeftRadius: 'var(--radius)',
          background: priorityConfig.color
        }}
      />

      <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
        {/* Notification Icon */}
        <div
          style={{
            color: config.color,
            flexShrink: 0,
            marginTop: '2px'
          }}
        >
          {getNotificationIcon()}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <div className="row" style={{
            gap: '8px',
            alignItems: 'center',
            marginBottom: '4px',
            flexWrap: 'wrap'
          }}>
            <h4
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: notification.isRead ? '500' : '600',
                color: 'var(--text)',
                lineHeight: '1.4'
              }}
            >
              {notification.title}
            </h4>

            {/* Priority Badge */}
            {!compact && (
              <span
                className="badge"
                style={{
                  background: priorityConfig.color + '20',
                  color: priorityConfig.color,
                  borderColor: priorityConfig.color + '40',
                  fontSize: '10px',
                  padding: '2px 6px'
                }}
              >
                {priorityConfig.label}
              </span>
            )}
          </div>

          {/* Message */}
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-2)',
              lineHeight: '1.4',
              marginBottom: '6px'
            }}
          >
            {notification.message}
          </div>

          {/* Timestamp */}
          <div className="row" style={{
            gap: '6px',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--text-2)'
          }}>
            <Clock size={12} />
            <span>{formatNotificationTimestamp(notification.timestamp)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="row" style={{ gap: '4px', alignItems: 'center' }}>
            {/* Mark as Read Button */}
            {!notification.isRead && (
              <button
                onClick={handleMarkAsRead}
                className="btn ghost"
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.2s ease'
                }}
                title="Mark as read"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid var(--brand)',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                ) : (
                  <Check size={14} />
                )}
              </button>
            )}

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="btn ghost"
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  color: 'var(--danger)',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.2s ease'
                }}
                title="Delete notification"
                disabled={isLoading}
              >
                <X size={14} />
              </button>
            )}

            {/* External Link Indicator */}
            {notification.sourceEntity && (
              <div
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  color: 'var(--text-2)',
                  opacity: isHovered ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}
              >
                <ExternalLink size={14} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '6px',
            padding: '4px'
          }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--brand)',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .card:hover {
          border-color: var(--brand);
        }

        .card.unread {
          background: var(--bg-2);
          border-left: 4px solid var(--brand);
        }
      `}</style>
    </div>
  );
}