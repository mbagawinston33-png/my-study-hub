"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Reminder } from '@/types/task';
import notificationConfig from '@/lib/notification-config.json';

interface ToastNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

interface NotificationContextType {
  toastNotifications: ToastNotification[];
  addToastNotification: (notification: ToastNotification) => void;
  removeToastNotification: (id: string) => void;
  upcomingTasks: Task[];
  setUpcomingTasks: (tasks: Task[]) => void;
  upcomingReminders: Reminder[];
  setUpcomingReminders: (reminders: Reminder[]) => void;
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
  const [sentNotifications, setSentNotifications] = useState<Set<string>>(new Set());
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);

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

      return priorityConfig.default || notificationConfig.tasks.default || 30;
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
    console.log('🔔 Global notification check started');

    if (!('Notification' in window)) {
      console.log('❌ Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.log('❌ Notification permission not granted');
      return;
    }

    const now = new Date();
    console.log('⏰ Current time:', now.toLocaleTimeString());

    // Check reminders
    console.log('📅 Checking reminders:', upcomingReminders.length);
    upcomingReminders.forEach((reminder, index) => {
      const notificationTiming = getNotificationTiming(reminder);
      console.log(`📝 Reminder ${index + 1}: "${reminder.title}"`);
      console.log(`   Due: ${reminder.dueDate.toDate().toLocaleTimeString()}`);
      console.log(`   Notification timing: ${notificationTiming} minutes before`);

      if (!notificationTiming) {
        console.log('   ❌ No notification timing found');
        return;
      }

      const dueDate = reminder.dueDate.toDate();
      const notificationTime = new Date(dueDate.getTime() - notificationTiming * 60000);
      const notificationKey = `reminder-${reminder.id}`;
      const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());

      console.log(`   Time diff: ${timeDiff / 1000} seconds`);
      console.log(`   Already sent: ${sentNotifications.has(notificationKey)}`);

      // Check if we're in the notification window
      const isInNotificationWindow = timeDiff < 60000;

      // Clean up expired sent notifications (if time window has passed)
      if (timeDiff > 60000 && sentNotifications.has(notificationKey)) {
        console.log('🧹 Cleaning up expired notification tracking');
        setSentNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificationKey);
          return newSet;
        });
      }

      if (isInNotificationWindow && !sentNotifications.has(notificationKey)) {
        console.log('🚨 SENDING NOTIFICATION!');

        // Always show toast notification
        addToastNotification({
          id: notificationKey,
          title: 'Reminder Due Soon!',
          body: `${reminder.title} is due in ${notificationTiming} minute${notificationTiming !== 1 ? 's' : ''}`,
          timestamp: Date.now()
        });

        // Try browser notification as well
        try {
          new Notification('Reminder Due Soon!', {
            body: `${reminder.title} is due in ${notificationTiming} minute${notificationTiming !== 1 ? 's' : ''}`,
            icon: '/favicon.ico',
            tag: notificationKey
          });
          console.log('✅ Browser notification sent successfully');
        } catch (error) {
          console.error('❌ Browser notification failed:', error);
          console.log('🍞 Toast notification displayed as fallback');
        }

        setSentNotifications(prev => new Set([...prev, notificationKey]));
      } else {
        if (!isInNotificationWindow) {
          console.log('   ⏰ Not in notification window yet');
        } else {
          console.log('   🔔 Already sent in this window');
        }
      }
    });

    // Check tasks
    console.log('🎯 Checking tasks:', upcomingTasks.length);
    upcomingTasks.forEach((task, index) => {
      const notificationTiming = getNotificationTiming(task);
      console.log(`📋 Task ${index + 1}: "${task.title}" (${task.priority})`);
      console.log(`   Due: ${task.dueDate.toDate().toLocaleTimeString()}`);
      console.log(`   Notification timing: ${notificationTiming} minutes before`);

      if (!notificationTiming) {
        console.log('   ❌ No notification timing found');
        return;
      }

      const dueDate = task.dueDate.toDate();
      const notificationTime = new Date(dueDate.getTime() - notificationTiming * 60000);
      const notificationKey = `task-${task.id}`;
      const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());

      console.log(`   Time diff: ${timeDiff / 1000} seconds`);
      console.log(`   Already sent: ${sentNotifications.has(notificationKey)}`);

      // Check if we're in the notification window
      const isInNotificationWindow = timeDiff < 60000;

      // Clean up expired sent notifications (if time window has passed)
      if (timeDiff > 60000 && sentNotifications.has(notificationKey)) {
        console.log('🧹 Cleaning up expired notification tracking');
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

        console.log('🚨 SENDING TASK NOTIFICATION!');

        // Always show toast notification
        addToastNotification({
          id: notificationKey,
          title: `${priority} Priority Task Due Soon!`,
          body: `${task.title} is due in ${timeMessage}`,
          timestamp: Date.now()
        });

        // Try browser notification as well
        try {
          new Notification(`${priority} Priority Task Due Soon!`, {
            body: `${task.title} is due in ${timeMessage}`,
            icon: '/favicon.ico',
            tag: notificationKey
          });
          console.log('✅ Task browser notification sent successfully');
        } catch (error) {
          console.error('❌ Task browser notification failed:', error);
          console.log('🍞 Toast notification displayed as fallback');
        }

        setSentNotifications(prev => new Set([...prev, notificationKey]));
      } else {
        if (!isInNotificationWindow) {
          console.log('   ⏰ Not in notification window yet');
        } else {
          console.log('   🔔 Already sent in this window');
        }
      }
    });

    console.log('🔔 Global notification check completed');
  };

  // Setup global notification system
  useEffect(() => {
    console.log('🚀 Global notification system starting...');

    // Request notification permission
    if ('Notification' in window) {
      console.log('📱 Browser supports notifications');
      if (Notification.permission === 'default') {
        console.log('🔔 Requesting notification permission...');
        Notification.requestPermission().then(permission => {
          console.log('✅ Permission result:', permission);
        });
      } else {
        console.log('📋 Current permission:', Notification.permission);
      }
    } else {
      console.log('❌ Browser does not support notifications');
    }

    // Run notification check immediately
    console.log('⚡ Running immediate global notification check...');
    checkAndSendNotifications();

    // Check for notifications every 10 seconds for testing (change back to 60000 for production)
    console.log('⏰ Setting up global notification interval (every 10 seconds for testing)');
    const notificationInterval = setInterval(() => {
      console.log('⏱️ Global interval triggered - checking notifications...');
      checkAndSendNotifications();
    }, 10000); // 10 seconds for testing, change to 60000 for production

    return () => {
      console.log('🧹 Cleaning up global notification interval');
      clearInterval(notificationInterval);
    };
  }, [upcomingTasks, upcomingReminders, sentNotifications]);

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

  const value: NotificationContextType = {
    toastNotifications,
    addToastNotification,
    removeToastNotification,
    upcomingTasks,
    setUpcomingTasks,
    upcomingReminders,
    setUpcomingReminders,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};