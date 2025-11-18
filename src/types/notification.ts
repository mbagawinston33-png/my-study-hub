/**
 * Notification data types for MyStudyHub persistent notification system
 */

import { Timestamp } from 'firebase/firestore';

// Notification types for different events
export type NotificationType =
  | 'task_due'           // Task due date approaching
  | 'task_completed'     // Task marked as completed
  | 'task_overdue'       // Task became overdue
  | 'reminder_due'       // Reminder due date approaching
  | 'reminder_completed' // Reminder marked as completed
  | 'reminder_overdue'   // Reminder became overdue
  | 'file_uploaded'      // File attached to task/subject
  | 'system'             // System announcements
  | 'timer_complete';    // Study timer session completed

// Priority levels for notifications
export type NotificationPriority = 'low' | 'medium' | 'high';

// Main notification interface stored in Firestore
export interface PersistentNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Timestamp;
  isRead: boolean;
  isDismissed: boolean;
  priority: NotificationPriority;

  // Reference to the entity that triggered this notification
  sourceEntity?: {
    type: 'task' | 'reminder' | 'subject';
    id: string;
  };

  // Optional metadata for additional context
  metadata?: {
    [key: string]: string | number | boolean;
  };

  // For grouping similar notifications
  groupId?: string;
  count?: number; // If grouped, how many notifications are represented
}

// Local notification state (extends existing ToastNotification)
export interface LocalNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: number;
  isRead: boolean;
  sourceEntity?: {
    type: 'task' | 'reminder' | 'subject';
    id: string;
  };
  metadata?: Record<string, any>;
}

// Notification creation data
export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  sourceEntity?: {
    type: 'task' | 'reminder' | 'subject';
    id: string;
  };
  metadata?: Record<string, any>;
  groupId?: string;
}

// Notification filtering options
export interface NotificationFilters {
  types?: NotificationType[];
  readStatus?: 'all' | 'read' | 'unread';
  priority?: NotificationPriority[];
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
}

// Notification sorting options
export type NotificationSortOption = 'timestamp' | 'priority' | 'type';

// Notification statistics
export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  dismissed: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// Notification configuration
export interface NotificationConfig {
  autoMarkAsReadOnClick: boolean;
  maxNotificationsPerUser: number;
  retentionDays: number;
  enableGrouping: boolean;
  groupSimilarWithin: number; // minutes
}

// Notification type configuration
export const NOTIFICATION_TYPE_CONFIG = {
  task_due: {
    label: 'Task Due',
    icon: 'Calendar',
    color: '#F59E0B',
    priority: 'high' as NotificationPriority
  },
  task_completed: {
    label: 'Task Completed',
    icon: 'CheckCircle',
    color: '#10B981',
    priority: 'medium' as NotificationPriority
  },
  task_overdue: {
    label: 'Task Overdue',
    icon: 'AlertTriangle',
    color: '#EF4444',
    priority: 'high' as NotificationPriority
  },
  reminder_due: {
    label: 'Reminder',
    icon: 'Bell',
    color: '#3B82F6',
    priority: 'medium' as NotificationPriority
  },
  reminder_completed: {
    label: 'Reminder Completed',
    icon: 'CheckCircle',
    color: '#10B981',
    priority: 'low' as NotificationPriority
  },
  reminder_overdue: {
    label: 'Reminder Overdue',
    icon: 'AlertTriangle',
    color: '#EF4444',
    priority: 'medium' as NotificationPriority
  },
  file_uploaded: {
    label: 'File Uploaded',
    icon: 'FileText',
    color: '#8B5CF6',
    priority: 'low' as NotificationPriority
  },
  system: {
    label: 'System',
    icon: 'Info',
    color: '#6B7280',
    priority: 'low' as NotificationPriority
  },
  timer_complete: {
    label: 'Study Session',
    icon: 'Clock',
    color: '#06B6D4',
    priority: 'medium' as NotificationPriority
  }
} as const;

// Priority configuration
export const NOTIFICATION_PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    value: 1,
    color: '#6B7280'
  },
  medium: {
    label: 'Medium',
    value: 2,
    color: '#F59E0B'
  },
  high: {
    label: 'High',
    value: 3,
    color: '#EF4444'
  }
} as const;

// Default notification settings
export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  autoMarkAsReadOnClick: true,
  maxNotificationsPerUser: 1000,
  retentionDays: 90,
  enableGrouping: true,
  groupSimilarWithin: 30 // minutes
};

// Helper function to get notification configuration
export const getNotificationConfig = (type: NotificationType) => {
  return NOTIFICATION_TYPE_CONFIG[type];
};

// Helper function to sort notifications by priority
export const sortNotificationsByPriority = (
  notifications: PersistentNotification[]
): PersistentNotification[] => {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return [...notifications].sort((a, b) =>
    priorityOrder[b.priority] - priorityOrder[a.priority]
  );
};

// Helper function to format timestamp
export const formatNotificationTimestamp = (timestamp: Timestamp): string => {
  const now = new Date();
  const notificationDate = timestamp.toDate();
  const diffMs = now.getTime() - notificationDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return notificationDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

// Helper function to create notification from task
export const createTaskNotification = (
  task: any,
  type: 'task_due' | 'task_completed' | 'task_overdue',
  userId: string
): CreateNotificationData => {
  const config = NOTIFICATION_TYPE_CONFIG[type];

  switch (type) {
    case 'task_due':
      return {
        userId,
        type,
        title: 'Task Due Soon',
        message: `"${task.title}" is due ${formatNotificationTimestamp(task.dueDate)}`,
        priority: task.priority,
        sourceEntity: { type: 'task', id: task.id },
        metadata: { taskTitle: task.title, dueDate: task.dueDate.toMillis() }
      };

    case 'task_completed':
      return {
        userId,
        type,
        title: 'Task Completed',
        message: `Great job! You completed "${task.title}"`,
        priority: 'medium',
        sourceEntity: { type: 'task', id: task.id },
        metadata: { taskTitle: task.title }
      };

    case 'task_overdue':
      return {
        userId,
        type,
        title: 'Task Overdue',
        message: `"${task.title}" was due ${formatNotificationTimestamp(task.dueDate)}`,
        priority: 'high',
        sourceEntity: { type: 'task', id: task.id },
        metadata: { taskTitle: task.title, dueDate: task.dueDate.toMillis() }
      };

    default:
      throw new Error(`Unknown task notification type: ${type}`);
  }
};

// Helper function to create notification from reminder
export const createReminderNotification = (
  reminder: any,
  type: 'reminder_due' | 'reminder_completed' | 'reminder_overdue',
  userId: string
): CreateNotificationData => {
  switch (type) {
    case 'reminder_due':
      return {
        userId,
        type,
        title: 'Reminder',
        message: reminder.title,
        priority: 'medium',
        sourceEntity: { type: 'reminder', id: reminder.id },
        metadata: { reminderTitle: reminder.title, dueDate: reminder.dueDate.toMillis() }
      };

    case 'reminder_completed':
      return {
        userId,
        type,
        title: 'Reminder Completed',
        message: `You completed "${reminder.title}"`,
        priority: 'low',
        sourceEntity: { type: 'reminder', id: reminder.id },
        metadata: { reminderTitle: reminder.title }
      };

    case 'reminder_overdue':
      return {
        userId,
        type,
        title: 'Reminder Overdue',
        message: `"${reminder.title}" was due ${formatNotificationTimestamp(reminder.dueDate)}`,
        priority: 'medium',
        sourceEntity: { type: 'reminder', id: reminder.id },
        metadata: { reminderTitle: reminder.title, dueDate: reminder.dueDate.toMillis() }
      };

    default:
      throw new Error(`Unknown reminder notification type: ${type}`);
  }
};