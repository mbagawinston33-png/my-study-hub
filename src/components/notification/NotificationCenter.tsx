"use client";

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import NotificationItem from './NotificationItem';
import {
  CheckSquare,
  X,
  Settings,
  Archive,
  Bell,
  Inbox,
  Filter
} from 'lucide-react';
import {
  PersistentNotification,
  NotificationType,
  NotificationFilters,
  NotificationSortOption
} from '@/types/notification';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    markAllAsRead,
    refreshNotifications
  } = useNotifications();

  const [filters, setFilters] = useState<NotificationFilters>({});
  const [sortBy, setSortBy] = useState<NotificationSortOption>('timestamp');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter(notification => {
      if (filters.types && !filters.types.includes(notification.type)) {
        return false;
      }
      if (filters.readStatus === 'read' && !notification.isRead) {
        return false;
      }
      if (filters.readStatus === 'unread' && notification.isRead) {
        return false;
      }
      if (filters.priority && !filters.priority.includes(notification.priority)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'type':
          return a.type.localeCompare(b.type);
        case 'timestamp':
        default:
          return b.timestamp.toMillis() - a.timestamp.toMillis();
      }
    });

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  const handleFilterChange = (newFilters: Partial<NotificationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSortChange = (newSortBy: NotificationSortOption) => {
    setSortBy(newSortBy);
  };

  const handleNotificationClick = (notification: PersistentNotification) => {
    // Close modal when notification is clicked for navigation
    onClose();
  };

  const handleSelectNotification = (notificationId: string, isSelected: boolean) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(notificationId);
      } else {
        newSet.delete(notificationId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const getFilteredStats = () => {
    const filtered = filteredNotifications;
    const unreadInFiltered = filtered.filter(n => !n.isRead).length;
    return {
      total: filtered.length,
      unread: unreadInFiltered,
      selected: selectedNotifications.size
    };
  };

  const stats = getFilteredStats();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
          <Bell size={20} style={{ color: 'var(--brand)' }} />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span
              className="badge"
              style={{
                background: 'var(--brand)',
                color: 'white',
                fontSize: '11px',
                padding: '2px 6px'
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
      }
      size="medium"
      showCloseButton={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '70vh' }}>
        {/* Header Actions */}
        <div className="row" style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {/* Left Actions */}
          <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleMarkAllAsRead}
              className="btn ghost"
              style={{ fontSize: '13px', padding: '6px 12px' }}
              disabled={unreadCount === 0}
            >
              <CheckSquare size={14} />
              Mark all as read
            </button>

            <button
              onClick={handleRefresh}
              className="btn ghost"
              style={{ fontSize: '13px', padding: '6px 12px' }}
              disabled={isLoadingNotifications}
            >
              ↻ Refresh
            </button>
          </div>

          {/* Right Actions */}
          <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? '' : 'ghost'}`}
              style={{ fontSize: '13px', padding: '6px 12px' }}
              title="Toggle filters"
            >
              <Filter size={14} />
              Filters
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="card" style={{ marginBottom: '16px', padding: '12px' }}>
            <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
              Filter Notifications
            </div>

            {/* Read Status Filter */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ marginBottom: '6px', fontSize: '12px', color: 'var(--text-2)' }}>
                Status:
              </div>
              <div className="row" style={{ gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: 'All' },
                  { value: 'unread', label: 'Unread' },
                  { value: 'read', label: 'Read' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange({
                      readStatus: option.value as any
                    })}
                    className={
                      filters.readStatus === option.value ? 'btn' : 'btn ghost'
                    }
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '4px'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <div style={{ marginBottom: '6px', fontSize: '12px', color: 'var(--text-2)' }}>
                Sort by:
              </div>
              <div className="row" style={{ gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { value: 'timestamp', label: 'Recent' },
                  { value: 'priority', label: 'Priority' },
                  { value: 'type', label: 'Type' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value as NotificationSortOption)}
                    className={sortBy === option.value ? 'btn' : 'btn ghost'}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '4px'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="row" style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          fontSize: '12px',
          color: 'var(--text-2)',
          padding: '8px 12px',
          background: 'var(--bg)',
          borderRadius: '6px'
        }}>
          <span>
            {stats.total} notification{stats.total !== 1 ? 's' : ''}
            {stats.unread > 0 && ` (${stats.unread} unread)`}
          </span>

          {stats.selected > 0 && (
            <span>
              {stats.selected} selected
            </span>
          )}
        </div>

        {/* Notifications List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          minHeight: 0
        }}>
          {isLoadingNotifications ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: 'var(--text-2)'
            }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid var(--brand)',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '12px'
                }}
              />
              <div>Loading notifications...</div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: 'var(--text-2)'
            }}>
              <Inbox size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                {notifications.length === 0 ? 'All caught up!' : 'No notifications match your filters'}
              </div>
              <div style={{ fontSize: '13px' }}>
                {notifications.length === 0
                  ? 'You have no new notifications'
                  : 'Try adjusting your filters to see more notifications'
                }
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                  showActions={true}
                  compact={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with Load More */}
        {!isLoadingNotifications && filteredNotifications.length > 0 && (
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
              Showing recent notifications
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  );
}