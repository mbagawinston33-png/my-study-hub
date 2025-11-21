"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task } from '@/types/task';
import { Reminder } from '@/types/reminder';
import {
  PersistentNotification,
  LocalNotification,
  CreateNotificationData,
  createTaskNotification,
  createReminderNotification
} from '@/types/notification';
import {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  listenToUserNotifications,
  listenToUnreadCount,
  cleanupOldNotifications as cleanupOldNotificationsService
} from '@/lib/notificationServices';
import { useAuth } from './AuthContext';
import notificationConfig from '@/lib/notification-config.json';

interface ToastNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

interface NotificationContextType {
  // Existing toast functionality
  toastNotifications: ToastNotification[];
  addToastNotification: (notification: ToastNotification) => void;
  removeToastNotification: (id: string) => void;
  upcomingTasks: Task[];
  setUpcomingTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  upcomingReminders: Reminder[];
  setUpcomingReminders: (reminders: Reminder[] | ((prev: Reminder[]) => Reminder[])) => void;

  // New persistent notification functionality
  notifications: PersistentNotification[];
  unreadCount: number;
  isLoadingNotifications: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createPersistentNotification: (data: CreateNotificationData) => Promise<void>;
  cleanupOldNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [sentNotifications, setSentNotifications] = useState<Set<string>>(new Set());
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);

  // Wrapper function to update upcoming reminders and trigger immediate notification check
  const updateUpcomingReminders = (reminders: Reminder[] | ((prev: Reminder[]) => Reminder[])) => {
    setUpcomingReminders(prev => {
      const newReminders = typeof reminders === 'function' ? reminders(prev) : reminders;
      // Trigger immediate notification check after a brief delay to ensure state is updated
      setTimeout(() => {
        checkAndSendNotificationsEnhanced();
      }, 100);
      return newReminders;
    });
  };

  // New persistent notification states
  const [notifications, setNotifications] = useState<PersistentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false);

  // Get notification timing based on config
  const getNotificationTiming = (item: Task | Reminder) => {
    const now = new Date();
    const dueDate = item.dueDate.toDate();
    const minutesUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60);
    const hoursUntilDue = minutesUntilDue / 60;

    // Check if it's a task
    if ('priority' in item) {
      const task = item as Task;
      const priorityConfig = notificationConfig.tasks[task.priority];

      if (!priorityConfig) return null;

      for (const timeFrame of priorityConfig.timeFrames) {
        const minMinutes = timeFrame.minMinutes || (timeFrame.minHours ? timeFrame.minHours * 60 : 0);
        const maxMinutes = timeFrame.maxMinutes || (timeFrame.maxHours ? timeFrame.maxHours * 60 : Infinity);

        if (minutesUntilDue >= minMinutes && minutesUntilDue < maxMinutes) {
          return timeFrame.notification; // minutes before due date
        }
      }

      // Return the last timeFrame notification as fallback, or default 30 minutes
      return priorityConfig.timeFrames[priorityConfig.timeFrames.length - 1]?.notification || 30;
    }
    // It's a reminder
    else {
      const reminder = item as Reminder;
      const reminderConfig = notificationConfig.reminders;

      for (const timeFrame of reminderConfig.timeFrames) {
        const minMinutes = timeFrame.minMinutes || (timeFrame.minHours ? timeFrame.minHours * 60 : 0);
        const maxMinutes = timeFrame.maxMinutes || (timeFrame.maxHours ? timeFrame.maxHours * 60 : Infinity);

        if (minutesUntilDue >= minMinutes && minutesUntilDue < maxMinutes) {
          return timeFrame.notification; // minutes before due date
        }
      }

      return reminderConfig.default || 30;
    }
  };

  // Check and send notifications
  const checkAndSendNotifications = () => {
    // Always process toast notifications (they work everywhere)
    const canSendBrowserNotifications =
      'Notification' in window &&
      Notification.permission === 'granted' &&
      (location.protocol === 'https:' ||
       location.hostname === 'localhost' ||
       location.hostname === '127.0.0.1');

    const now = new Date();

    // Check reminders
    upcomingReminders.forEach((reminder) => {
      const notificationTiming = getNotificationTiming(reminder);

      if (!notificationTiming) return;

      const dueDate = reminder.dueDate.toDate();
      const notificationTime = new Date(dueDate.getTime() - notificationTiming * 60000);
      const notificationKey = `reminder-${reminder.id}`;
      const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());

      // Check if we're in the notification window
      const isInNotificationWindow = timeDiff < 60000;

      // Clean up expired sent notifications (if time window has passed)
      if (timeDiff > 60000 && sentNotifications.has(notificationKey)) {
        setSentNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificationKey);
          return newSet;
        });
      }

      if (isInNotificationWindow && !sentNotifications.has(notificationKey)) {
        // Always show toast notification
        addToastNotification({
          id: notificationKey,
          title: 'Reminder Due Soon!',
          body: `${reminder.title} is due in ${notificationTiming} minute${notificationTiming !== 1 ? 's' : ''}`,
          timestamp: Date.now()
        });

        // Send browser notification only if available
        if (canSendBrowserNotifications) {
          try {
            new Notification('Reminder Due Soon!', {
              body: `${reminder.title} is due in ${notificationTiming} minute${notificationTiming !== 1 ? 's' : ''}`,
              icon: '/favicon.ico',
              tag: notificationKey
            });
          } catch (error) {
            console.error('Browser notification failed:', error);
          }
        }

        setSentNotifications(prev => new Set([...prev, notificationKey]));
      }
    });

    // Check tasks
    upcomingTasks.forEach((task) => {
      const notificationTiming = getNotificationTiming(task);

      if (!notificationTiming) return;

      const dueDate = task.dueDate.toDate();
      const notificationTime = new Date(dueDate.getTime() - notificationTiming * 60000);
      const notificationKey = `task-${task.id}`;
      const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());

      // Check if we're in the notification window
      const isInNotificationWindow = timeDiff < 60000;

      // Clean up expired sent notifications (if time window has passed)
      if (timeDiff > 60000 && sentNotifications.has(notificationKey)) {
        setSentNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificationKey);
          return newSet;
        });
      }

      if (isInNotificationWindow && !sentNotifications.has(notificationKey)) {
        const priority = task.priority.toUpperCase();
        const timeMessage = notificationTiming >= 60
          ? `${notificationTiming / 60} hour${notificationTiming / 60 !== 1 ? 's' : ''}`
          : `${notificationTiming} minute${notificationTiming !== 1 ? 's' : ''}`;

        // Always show toast notification
        addToastNotification({
          id: notificationKey,
          title: `${priority} Priority Task Due Soon!`,
          body: `${task.title} is due in ${timeMessage}`,
          timestamp: Date.now()
        });

        // Send browser notification only if available
        if (canSendBrowserNotifications) {
          try {
            new Notification(`${priority} Priority Task Due Soon!`, {
              body: `${task.title} is due in ${timeMessage}`,
              icon: '/favicon.ico',
              tag: notificationKey
            });
          } catch (error) {
            console.error('Task browser notification failed:', error);
          }
        }

        setSentNotifications(prev => new Set([...prev, notificationKey]));
      }
    });
  };

  
  // Add multiple toast notifications
  const addToastNotification = (notification: ToastNotification) => {
    setToastNotifications(prev => [...prev, notification]);
  };

  // Remove specific toast notification
  const removeToastNotification = (id: string) => {
    setToastNotifications(prev => prev.filter(toast => toast.id !== id));
  };

  // Note: Toast now stays on screen until manually closed
  // Auto-hide functionality removed to keep notification visible

  // New persistent notification functions
  const createPersistentNotification = async (data: CreateNotificationData) => {
    if (!user) return;

    try {
      // Create persistent notification in Firestore
      await createNotification(data);

      // Also create toast notification for immediate feedback
      addToastNotification({
        id: `persistent-${Date.now()}`,
        title: data.title,
        body: data.message,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error creating persistent notification:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const cleanupOldNotifications = async () => {
    if (!user) return;

    try {
      await cleanupOldNotificationsService(user.userId);
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;

    setIsLoadingNotifications(true);
    try {
      // Trigger a refresh by creating a temporary notification
      // The real-time listener will handle the actual data refresh
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Setup real-time listeners for persistent notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let unsubscribeNotifications: (() => void) | undefined;
    let unsubscribeUnreadCount: (() => void) | undefined;

    const setupListeners = () => {
      // Listen to user notifications
      unsubscribeNotifications = listenToUserNotifications(
        user.userId,
        (notificationList) => {
          setNotifications(notificationList);
        },
        { readStatus: 'all' } // Get all notifications, not just unread
      );

      // Listen to unread count
      unsubscribeUnreadCount = listenToUnreadCount(
        user.userId,
        (count) => {
          setUnreadCount(count);
        }
      );
    };

    // Initial setup
    setupListeners();

    // Cleanup old notifications on mount
    cleanupOldNotifications();

    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
      if (unsubscribeUnreadCount) {
        unsubscribeUnreadCount();
      }
    };
  }, [user]);

  // Enhanced notification check with persistent storage
  const checkAndSendNotificationsEnhanced = () => {
    const canSendBrowserNotifications =
      'Notification' in window &&
      Notification.permission === 'granted' &&
      (location.protocol === 'https:' ||
       location.hostname === 'localhost' ||
       location.hostname === '127.0.0.1');

    if (!user) {
      return;
    }

    const now = new Date();

    // Check reminders and create persistent notifications
    upcomingReminders.forEach((reminder) => {
      const notificationTiming = getNotificationTiming(reminder);

      if (!notificationTiming) return;

      const dueDate = reminder.dueDate.toDate();
      const notificationTime = new Date(dueDate.getTime() - notificationTiming * 60000);
      const notificationKey = `reminder-${reminder.id}`;
      const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());
      const isInNotificationWindow = timeDiff < 60000;

      if (isInNotificationWindow && !sentNotifications.has(notificationKey)) {
        // Create persistent notification
        const notificationData = createReminderNotification(
          reminder,
          'reminder_due',
          user.userId
        );

        createPersistentNotification(notificationData);

        // Show immediate toast notification
        addToastNotification({
          id: notificationKey,
          title: 'Reminder Due Soon!',
          body: `${reminder.title} is due in ${notificationTiming} minute${notificationTiming !== 1 ? 's' : ''}`,
          timestamp: Date.now()
        });

        // Send browser notification
        if (canSendBrowserNotifications) {
          try {
            new Notification('Reminder Due Soon!', {
              body: `${reminder.title} is due in ${notificationTiming} minute${notificationTiming !== 1 ? 's' : ''}`,
              icon: '/favicon.ico',
              tag: notificationKey
            });
          } catch (error) {
            console.error('Browser notification failed:', error);
          }
        }

        setSentNotifications(prev => new Set([...prev, notificationKey]));
      }

      // Clean up expired sent notifications
      if (timeDiff > 60000 && sentNotifications.has(notificationKey)) {
        setSentNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificationKey);
          return newSet;
        });
      }
    });

    // Check tasks and create persistent notifications
    upcomingTasks.forEach((task) => {
      const notificationTiming = getNotificationTiming(task);

      if (!notificationTiming) return;

      const dueDate = task.dueDate.toDate();
      const notificationTime = new Date(dueDate.getTime() - notificationTiming * 60000);
      const notificationKey = `task-${task.id}`;
      const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());
      const isInNotificationWindow = timeDiff < 60000;

      if (isInNotificationWindow && !sentNotifications.has(notificationKey)) {
        // Determine notification type based on task status
        let notificationType: 'task_due' | 'task_overdue' = 'task_due';
        const isOverdue = dueDate < now;

        if (isOverdue) {
          notificationType = 'task_overdue';
        }

        const notificationData = createTaskNotification(
          task,
          notificationType,
          user.userId
        );

        createPersistentNotification(notificationData);

        // Show immediate toast notification
        const priority = task.priority.toUpperCase();
        const timeMessage = notificationTiming >= 60
          ? `${notificationTiming / 60} hour${notificationTiming / 60 !== 1 ? 's' : ''}`
          : `${notificationTiming} minute${notificationTiming !== 1 ? 's' : ''}`;

        addToastNotification({
          id: notificationKey,
          title: `${priority} Priority Task Due Soon!`,
          body: `${task.title} is due in ${timeMessage}`,
          timestamp: Date.now()
        });

        // Send browser notification
        if (canSendBrowserNotifications) {
          try {
            new Notification(`${priority} Priority Task Due Soon!`, {
              body: `${task.title} is due in ${timeMessage}`,
              icon: '/favicon.ico',
              tag: notificationKey
            });
          } catch (error) {
            console.error('Browser notification failed:', error);
          }
        }

        setSentNotifications(prev => new Set([...prev, notificationKey]));
      }

      // Clean up expired sent notifications
      if (timeDiff > 60000 && sentNotifications.has(notificationKey)) {
        setSentNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificationKey);
          return newSet;
        });
      }
    });
  };

  // Replace existing checkAndSendNotifications with enhanced version
  useEffect(() => {
    if (!user) return;

    // Request notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // Run immediate check
    checkAndSendNotificationsEnhanced();

    // Set up interval
    const notificationInterval = setInterval(() => {
      checkAndSendNotificationsEnhanced();
    }, 10000); // 10 seconds for testing, change to 60000 for production

    return () => {
      clearInterval(notificationInterval);
    };
  }, [user, upcomingTasks, upcomingReminders, sentNotifications]);

  const value: NotificationContextType = {
    // Existing toast functionality
    toastNotifications,
    addToastNotification,
    removeToastNotification,
    upcomingTasks,
    setUpcomingTasks,
    upcomingReminders,
    setUpcomingReminders: updateUpcomingReminders,

    // New persistent notification functionality
    notifications,
    unreadCount,
    isLoadingNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    createPersistentNotification,
    cleanupOldNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};