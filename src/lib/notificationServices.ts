/**
 * Notification services for Firestore operations
 * Handles persistent notification storage and retrieval
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import {
  PersistentNotification,
  CreateNotificationData,
  NotificationFilters,
  NotificationStats,
  NotificationSortOption,
  DEFAULT_NOTIFICATION_CONFIG
} from '@/types/notification';

// Collection reference
const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Create a new notification
 */
export const createNotification = async (
  notificationData: CreateNotificationData
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notificationData,
      timestamp: Timestamp.now(),
      isRead: false,
      isDismissed: false,
      priority: notificationData.priority || 'medium'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
};

/**
 * Create multiple notifications in batch
 */
export const createNotificationsBatch = async (
  notificationsData: CreateNotificationData[]
): Promise<string[]> => {
  try {
    const batch = writeBatch(db);
    const notificationRefs: string[] = [];

    notificationsData.forEach((notificationData) => {
      const docRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
      notificationRefs.push(docRef.id);
      batch.set(docRef, {
        ...notificationData,
        timestamp: Timestamp.now(),
        isRead: false,
        isDismissed: false,
        priority: notificationData.priority || 'medium'
      });
    });

    await batch.commit();
    return notificationRefs;
  } catch (error) {
    console.error('Error creating notifications batch:', error);
    throw new Error('Failed to create notifications');
  }
};

/**
 * Get user notifications with optional filtering and pagination
 */
export const getUserNotifications = async (
  userId: string,
  filters: NotificationFilters = {},
  sortBy: NotificationSortOption = 'timestamp',
  limitCount: number = 50,
  startAfter?: Timestamp
): Promise<PersistentNotification[]> => {
  try {
    let q = query(collection(db, NOTIFICATIONS_COLLECTION));

    // Always filter by user
    q = query(q, where('userId', '==', userId));

    // Apply filters
    if (filters.readStatus === 'read') {
      q = query(q, where('isRead', '==', true));
    } else if (filters.readStatus === 'unread') {
      q = query(q, where('isRead', '==', false));
    }

    if (filters.types && filters.types.length > 0) {
      q = query(q, where('type', 'in', filters.types));
    }

    if (filters.priority && filters.priority.length > 0) {
      q = query(q, where('priority', 'in', filters.priority));
    }

    if (filters.dateRange) {
      q = query(q, where('timestamp', '>=', filters.dateRange.start));
      q = query(q, where('timestamp', '<=', filters.dateRange.end));
    }

    // Apply sorting
    const sortField = sortBy === 'priority' ? 'priority' : 'timestamp';
    const sortDirection = sortBy === 'timestamp' ? 'desc' : 'desc';
    q = query(q, orderBy(sortField, sortDirection as 'asc' | 'desc'));

    // Apply pagination
    if (startAfter) {
      q = query(q, startAfter(startAfter));
    }
    q = query(q, limit(limitCount));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PersistentNotification));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw new Error('Failed to get notifications');
  }
};

/**
 * Get unread notifications count for a user
 */
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('isRead', '==', false),
      where('isDismissed', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

/**
 * Mark multiple notifications as read
 */
export const markMultipleNotificationsAsRead = async (notificationIds: string[]): Promise<void> => {
  try {
    const batch = writeBatch(db);

    notificationIds.forEach((id) => {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, id);
      batch.update(notificationRef, {
        isRead: true,
        readAt: Timestamp.now()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    throw new Error('Failed to mark notifications as read');
  }
};

/**
 * Mark all user notifications as read
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.docs.forEach((docSnapshot) => {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, docSnapshot.id);
      batch.update(notificationRef, {
        isRead: true,
        readAt: Timestamp.now()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
};

/**
 * Dismiss notification (hide from active list)
 */
export const dismissNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      isDismissed: true,
      dismissedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    throw new Error('Failed to dismiss notification');
  }
};

/**
 * Delete notification permanently
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
};

/**
 * Delete old notifications (cleanup based on retention policy)
 */
export const cleanupOldNotifications = async (userId: string): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DEFAULT_NOTIFICATION_CONFIG.retentionDays);

    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('timestamp', '<', Timestamp.fromDate(cutoffDate))
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.docs.forEach((docSnapshot) => {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, docSnapshot.id);
      batch.delete(notificationRef);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw new Error('Failed to cleanup old notifications');
  }
};

/**
 * Get notification statistics for a user
 */
export const getNotificationStats = async (userId: string): Promise<NotificationStats> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => doc.data() as PersistentNotification);

    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead && !n.isDismissed).length,
      read: notifications.filter(n => n.isRead).length,
      dismissed: notifications.filter(n => n.isDismissed).length,
      byType: {
        task_due: 0,
        task_completed: 0,
        task_overdue: 0,
        reminder_due: 0,
        reminder_completed: 0,
        reminder_overdue: 0,
        file_uploaded: 0,
        system: 0,
        timer_complete: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0
      }
    };

    notifications.forEach((notification) => {
      stats.byType[notification.type]++;
      stats.byPriority[notification.priority]++;
    });

    return stats;
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw new Error('Failed to get notification stats');
  }
};

/**
 * Real-time listener for user notifications
 */
export const listenToUserNotifications = (
  userId: string,
  callback: (notifications: PersistentNotification[]) => void,
  filters: NotificationFilters = {}
): (() => void) => {
  let q = query(collection(db, NOTIFICATIONS_COLLECTION));

  // Always filter by user
  q = query(q, where('userId', '==', userId));

  // Apply filters
  if (filters.readStatus === 'read') {
    q = query(q, where('isRead', '==', true));
  } else if (filters.readStatus === 'unread') {
    q = query(q, where('isRead', '==', false));
  }

  if (filters.types && filters.types.length > 0) {
    q = query(q, where('type', 'in', filters.types));
  }

  if (filters.priority && filters.priority.length > 0) {
    q = query(q, where('priority', 'in', filters.priority));
  }

  // Sort by timestamp (newest first)
  q = query(q, orderBy('timestamp', 'desc'));

  // Limit to reasonable number for real-time updates
  q = query(q, limit(100));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PersistentNotification));

    callback(notifications);
  }, (error) => {
    console.error('Error in notifications listener:', error);
  });

  return unsubscribe;
};

/**
 * Real-time listener for unread count
 */
export const listenToUnreadCount = (
  userId: string,
  callback: (count: number) => void
): (() => void) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    where('isRead', '==', false),
    where('isDismissed', '==', false)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    callback(querySnapshot.size);
  }, (error) => {
    console.error('Error in unread count listener:', error);
  });

  return unsubscribe;
};

/**
 * Get notifications related to a specific entity
 */
export const getEntityNotifications = async (
  userId: string,
  entityType: 'task' | 'reminder' | 'subject',
  entityId: string
): Promise<PersistentNotification[]> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('sourceEntity.type', '==', entityType),
      where('sourceEntity.id', '==', entityId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PersistentNotification));
  } catch (error) {
    console.error('Error getting entity notifications:', error);
    throw new Error('Failed to get entity notifications');
  }
};