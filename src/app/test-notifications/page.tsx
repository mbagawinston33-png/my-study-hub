"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  NotificationType,
  NotificationPriority,
  CreateNotificationData
} from "@/types/notification";

const testNotificationTemplates: Omit<CreateNotificationData, 'userId'>[] = [
  {
    type: 'task_due',
    title: 'Math Assignment Due Soon',
    message: 'Your calculus assignment is due in 2 hours. Don\'t forget to submit it.',
    priority: 'high',
    sourceEntity: {
      type: 'task',
      id: 'test-task-1'
    }
  },
  {
    type: 'reminder_completed',
    title: 'Study Session Completed',
    message: 'Great job! You\'ve completed your physics study session.',
    priority: 'medium',
    sourceEntity: {
      type: 'reminder',
      id: 'test-reminder-1'
    }
  },
  {
    type: 'file_uploaded',
    title: 'New Study Material Added',
    message: 'Chemistry notes for Chapter 5 have been uploaded to your subject folder.',
    priority: 'low',
    sourceEntity: {
      type: 'subject',
      id: 'test-subject-1'
    }
  },
  {
    type: 'task_overdue',
    title: 'Overdue Task Alert',
    message: 'Your biology lab report was due yesterday. Please complete it as soon as possible.',
    priority: 'high',
    sourceEntity: {
      type: 'task',
      id: 'test-task-2'
    }
  },
  {
    type: 'system',
    title: 'Welcome to MyStudyHub',
    message: 'Your academic dashboard is ready! Start organizing your study materials.',
    priority: 'medium'
  },
  {
    type: 'timer_complete',
    title: 'Pomodoro Session Complete',
    message: 'Your 25-minute focus session has ended. Time for a break!',
    priority: 'medium'
  },
  {
    type: 'reminder_due',
    title: 'Exam Reminder',
    message: 'Your chemistry exam is scheduled for tomorrow at 9:00 AM.',
    priority: 'high',
    sourceEntity: {
      type: 'reminder',
      id: 'test-reminder-2'
    }
  }
];

export default function TestNotificationsPage() {
  const { user } = useAuth();
  const {
    createPersistentNotification,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications();

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNotification = async (template: Omit<CreateNotificationData, 'userId'>) => {
    if (!user || isCreating) return;

    setIsCreating(true);
    try {
      await createPersistentNotification({
        ...template,
        userId: user.userId
      });

      // Wait a moment then refresh to see the new notification
      setTimeout(() => {
        refreshNotifications();
      }, 500);
    } catch (error) {
      console.error('Error creating test notification:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateAllNotifications = async () => {
    if (!user || isCreating) return;

    setIsCreating(true);
    try {
      for (const template of testNotificationTemplates) {
        await createPersistentNotification({
          ...template,
          userId: user.userId
        });
        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Refresh to see all new notifications
      setTimeout(() => {
        refreshNotifications();
      }, 1000);
    } catch (error) {
      console.error('Error creating test notifications:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClearAllNotifications = async () => {
    // Mark all as read
    await markAllAsRead();
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'high': return 'var(--danger)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-2)';
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_due':
      case 'reminder_due':
        return '📅';
      case 'task_completed':
      case 'reminder_completed':
        return '✅';
      case 'task_overdue':
      case 'reminder_overdue':
        return '⚠️';
      case 'file_uploaded':
        return '📁';
      case 'timer_complete':
        return '⏰';
      case 'system':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  return (
    <ProtectedRoute>
      <div className="container" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ marginBottom: '8px', fontSize: '28px', color: 'var(--text)' }}>
            📧 Notification System Test
          </h1>
          <p style={{ color: 'var(--text-2)', lineHeight: '1.5' }}>
            Test the Facebook-style notification system by creating sample notifications
            and interacting with the notification bell in the header.
          </p>
        </div>

        {/* Current Status */}
        <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
          <h2 style={{ marginBottom: '12px', fontSize: '18px', color: 'var(--text)' }}>
            Current Status
          </h2>
          <div className="row" style={{ gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--brand)' }}>
                {notifications.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>Total Notifications</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--danger)' }}>
                {unreadCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>Unread</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>
                {notifications.length - unreadCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>Read</div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
          <h2 style={{ marginBottom: '12px', fontSize: '18px', color: 'var(--text)' }}>
            Test Controls
          </h2>
          <div className="row" style={{ gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <button
              onClick={handleCreateAllNotifications}
              disabled={isCreating || !user}
              className="btn"
              style={{ fontSize: '14px' }}
            >
              {isCreating ? 'Creating...' : '🎯 Create All Test Notifications'}
            </button>

            <button
              onClick={refreshNotifications}
              disabled={isCreating}
              className="btn ghost"
              style={{ fontSize: '14px' }}
            >
              🔄 Refresh List
            </button>

            <button
              onClick={handleClearAllNotifications}
              disabled={isCreating || unreadCount === 0}
              className="btn ghost"
              style={{ fontSize: '14px' }}
            >
              ✅ Mark All as Read
            </button>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-2)' }}>
            Click the notification bell in the header to see the notification center in action!
          </p>
        </div>

        {/* Individual Notification Templates */}
        <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
          <h2 style={{ marginBottom: '12px', fontSize: '18px', color: 'var(--text)' }}>
            Individual Test Notifications
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {testNotificationTemplates.map((template, index) => (
              <div
                key={index}
                className="card"
                style={{
                  padding: '12px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)'
                }}
              >
                <div className="row" style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px' }}>{getTypeIcon(template.type)}</span>
                    <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
                      {template.title}
                    </h3>
                  </div>
                  <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                    <span
                      className="badge"
                      style={{
                        background: getPriorityColor(template.priority || 'medium') + '20',
                        color: getPriorityColor(template.priority || 'medium'),
                        borderColor: getPriorityColor(template.priority || 'medium') + '40',
                        fontSize: '10px',
                        padding: '2px 6px'
                      }}
                    >
                      {(template.priority || 'medium').toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleCreateNotification(template)}
                      disabled={isCreating || !user}
                      className="btn ghost"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      + Create
                    </button>
                  </div>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--text-2)',
                  lineHeight: '1.4'
                }}>
                  {template.message}
                </p>
                {template.sourceEntity && (
                  <div style={{
                    marginTop: '4px',
                    fontSize: '10px',
                    color: 'var(--text-3)'
                  }}>
                    Source: {template.sourceEntity.type} ({template.sourceEntity.id})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Notifications List */}
        {notifications.length > 0 && (
          <div className="card" style={{ padding: '16px' }}>
            <h2 style={{ marginBottom: '12px', fontSize: '18px', color: 'var(--text)' }}>
              Current Notifications ({notifications.length})
            </h2>
            <div style={{ display: 'grid', gap: '8px' }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="card"
                  style={{
                    padding: '12px',
                    background: notification.isRead ? 'var(--card)' : 'var(--bg-2)',
                    border: `1px solid ${notification.isRead ? 'var(--border)' : 'var(--brand-200)'}`
                  }}
                >
                  <div className="row" style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px'
                  }}>
                    <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px' }}>{getTypeIcon(notification.type)}</span>
                      <h4 style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'var(--text)',
                        fontWeight: notification.isRead ? '500' : '600'
                      }}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="badge" style={{
                          background: 'var(--brand)',
                          color: 'white',
                          fontSize: '10px',
                          padding: '2px 4px'
                        }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => markAsRead(notification.id)}
                      disabled={notification.isRead}
                      className="btn ghost"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      {notification.isRead ? '✓ Read' : 'Mark as Read'}
                    </button>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--text-2)',
                    lineHeight: '1.4',
                    marginBottom: '6px'
                  }}>
                    {notification.message}
                  </p>
                  <div className="row" style={{
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: 'var(--text-3)'
                  }}>
                    <span>
                      {notification.timestamp.toDate().toLocaleString()}
                    </span>
                    <span style={{
                      color: getPriorityColor(notification.priority),
                      fontWeight: '600'
                    }}>
                      {notification.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="card" style={{ marginTop: '24px', padding: '16px' }}>
          <h2 style={{ marginBottom: '12px', fontSize: '18px', color: 'var(--text)' }}>
            How to Test
          </h2>
          <ol style={{
            margin: 0,
            paddingLeft: '20px',
            color: 'var(--text-2)',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Create Notifications:</strong> Use the buttons above to create test notifications
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Check the Bell:</strong> Look at the notification bell in the header - it should show the unread count
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Open Notification Center:</strong> Click the bell to open the notification dropdown
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Test Interactions:</strong> Try marking notifications as read, filtering, and sorting
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Verify Real-time:</strong> Create new notifications and see them appear immediately
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Test Navigation:</strong> Click on notifications to verify navigation (if applicable)
            </li>
          </ol>
        </div>
      </div>
    </ProtectedRoute>
  );
}