/**
 * Firebase Firestore utilities for Timer Management
 * Handles CRUD operations and session management for Pomodoro timer
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getDb } from './firebase';
import {
  TimerSession,
  TimerStats,
  TimerSessionType,
  TimerStatus,
  TimerFilter,
  TimerSortOption
} from '@/types/timer';
import { DEFAULT_TIMER_SETTINGS } from '@/types/timer';

const TIMER_SESSIONS_COLLECTION = 'timer-sessions';
const TIMER_SETTINGS_COLLECTION = 'timer-settings';

/**
 * Create a new timer session
 */
export async function createTimerSession(
  userId: string,
  sessionData: {
    type: TimerSessionType;
    duration: number;
    taskId?: string;
    sessionNumber: number;
    completedSessions: number;
  }
): Promise<TimerSession> {
  const db = getDb();

  try {
    const sessionDoc = {
      userId,
      type: sessionData.type,
      duration: sessionData.duration,
      actualDuration: 0,
      taskId: sessionData.taskId || null,
      startTime: serverTimestamp(),
      endTime: null,
      status: 'running' as TimerStatus,
      sessionNumber: sessionData.sessionNumber,
      completedSessions: sessionData.completedSessions,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, TIMER_SESSIONS_COLLECTION), sessionDoc);
    const newDoc = await getDoc(docRef);

    if (!newDoc.exists()) {
      throw new Error('Failed to create timer session');
    }

    return { id: newDoc.id, ...newDoc.data() } as TimerSession;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to create timer session');
  }
}

/**
 * Update an existing timer session
 */
export async function updateTimerSession(
  sessionId: string,
  userId: string,
  updates: Partial<TimerSession>
): Promise<void> {
  const db = getDb();

  try {
    const sessionRef = doc(db, TIMER_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Timer session not found');
    }

    const existingSession = sessionDoc.data() as TimerSession;
    if (existingSession.userId !== userId) {
      throw new Error('Access denied');
    }

    await updateDoc(sessionRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to update timer session');
  }
}

/**
 * Complete a timer session
 */
export async function completeTimerSession(
  sessionId: string,
  userId: string,
  actualDuration: number
): Promise<void> {
  const db = getDb();

  try {
    const sessionRef = doc(db, TIMER_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Timer session not found');
    }

    const existingSession = sessionDoc.data() as TimerSession;
    if (existingSession.userId !== userId) {
      throw new Error('Access denied');
    }

    await updateDoc(sessionRef, {
      status: 'completed',
      actualDuration,
      endTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to complete timer session');
  }
}

/**
 * Pause a timer session
 */
export async function pauseTimerSession(sessionId: string, userId: string): Promise<void> {
  await updateTimerSession(sessionId, userId, { status: 'paused' });
}

/**
 * Resume a timer session
 */
export async function resumeTimerSession(sessionId: string, userId: string): Promise<void> {
  await updateTimerSession(sessionId, userId, { status: 'running' });
}

/**
 * Stop (cancel) a timer session
 */
export async function stopTimerSession(
  sessionId: string,
  userId: string,
  actualDuration: number
): Promise<void> {
  await completeTimerSession(sessionId, userId, actualDuration);
}

/**
 * Delete a timer session
 */
export async function deleteTimerSession(sessionId: string, userId: string): Promise<void> {
  const db = getDb();

  try {
    const sessionRef = doc(db, TIMER_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Timer session not found');
    }

    const existingSession = sessionDoc.data() as TimerSession;
    if (existingSession.userId !== userId) {
      throw new Error('Access denied');
    }

    await deleteDoc(sessionRef);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to delete timer session');
  }
}

/**
 * Get timer sessions for a user
 */
export async function getTimerSessions(
  userId: string,
  filter: TimerFilter = 'all',
  sortBy: TimerSortOption = 'startTime',
  limitCount?: number
): Promise<TimerSession[]> {
  const db = getDb();

  try {
    let sessionsQuery = query(collection(db, TIMER_SESSIONS_COLLECTION), where('userId', '==', userId));

    // Apply date filters
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - (todayStart.getDay() * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (filter) {
      case 'today':
        sessionsQuery = query(sessionsQuery, where('startTime', '>=', Timestamp.fromDate(todayStart)));
        break;
      case 'this_week':
        sessionsQuery = query(sessionsQuery, where('startTime', '>=', Timestamp.fromDate(weekStart)));
        break;
      case 'this_month':
        sessionsQuery = query(sessionsQuery, where('startTime', '>=', Timestamp.fromDate(monthStart)));
        break;
      case 'focus':
        sessionsQuery = query(sessionsQuery, where('type', '==', 'focus'));
        break;
      case 'short_break':
        sessionsQuery = query(sessionsQuery, where('type', '==', 'short_break'));
        break;
      case 'long_break':
        sessionsQuery = query(sessionsQuery, where('type', '==', 'long_break'));
        break;
    }

    // Apply sorting
    let orderField: 'startTime' | 'createdAt' | 'duration' | 'type' = 'startTime';
    switch (sortBy) {
      case 'startTime':
        orderField = 'startTime';
        break;
      case 'createdAt':
        orderField = 'createdAt';
        break;
      case 'duration':
        // For duration sorting, we'll sort by startTime and then filter/sort client-side
        orderField = 'startTime';
        break;
      case 'type':
        orderField = 'type';
        break;
    }

    sessionsQuery = query(sessionsQuery, orderBy(orderField, 'desc'));

    if (limitCount) {
      sessionsQuery = query(sessionsQuery, limit(limitCount));
    }

    const querySnapshot = await getDocs(sessionsQuery);
    let sessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TimerSession[];

    // Apply client-side sorting for duration (since Firestore can't order by actualDuration in composite queries)
    if (sortBy === 'duration') {
      sessions.sort((a, b) => b.actualDuration - a.actualDuration);
    }

    return sessions;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to get timer sessions');
  }
}

/**
 * Get active timer session for a user
 */
export async function getActiveTimerSession(userId: string): Promise<TimerSession | null> {
  const db = getDb();

  try {
    const sessionsQuery = query(
      collection(db, TIMER_SESSIONS_COLLECTION),
      where('userId', '==', userId),
      where('status', 'in', ['running', 'paused']),
      orderBy('startTime', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(sessionsQuery);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as TimerSession;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to get active timer session');
  }
}

/**
 * Get timer statistics for a user
 */
export async function getTimerStats(userId: string): Promise<TimerStats> {
  const db = getDb();

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - (todayStart.getDay() * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all sessions for overall stats
    const allSessionsQuery = query(
      collection(db, TIMER_SESSIONS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('startTime', 'desc')
    );

    const querySnapshot = await getDocs(allSessionsQuery);
    const sessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TimerSession[];

    // Calculate statistics
    const totalStudyTime = sessions
      .filter(session => session.type === 'focus')
      .reduce((sum, session) => sum + Math.floor(session.actualDuration / 60), 0);

    const totalBreakTime = sessions
      .filter(session => session.type !== 'focus')
      .reduce((sum, session) => sum + Math.floor(session.actualDuration / 60), 0);

    const totalSessions = sessions.length;

    const completedToday = sessions.filter(session => {
      const sessionDate = session.startTime.toDate();
      return sessionDate >= todayStart;
    }).length;

    const completedThisWeek = sessions.filter(session => {
      const sessionDate = session.startTime.toDate();
      return sessionDate >= weekStart;
    }).length;

    // Calculate current streak (consecutive days with at least one session)
    let currentStreak = 0;
    const sessionDates = new Set(
      sessions.map(session => {
        const date = session.startTime.toDate();
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );

    let checkDate = new Date(todayStart);
    while (sessionDates.has(`${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate average session length (in minutes)
    const focusSessions = sessions.filter(session => session.type === 'focus');
    const averageSessionLength = focusSessions.length > 0
      ? Math.floor(focusSessions.reduce((sum, session) => sum + session.actualDuration, 0) / focusSessions.length / 60)
      : 0;

    // Find most productive hour
    const hourCounts: Record<number, number> = {};
    focusSessions.forEach(session => {
      const hour = session.startTime.toDate().getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostProductiveHour = Object.keys(hourCounts).reduce((a, b) =>
      hourCounts[Number(a)] > hourCounts[Number(b)] ? a : b, '9'
    );

    return {
      totalStudyTime,
      totalSessions,
      completedToday,
      completedThisWeek,
      weeklyGoal: 20, // Default goal
      currentStreak,
      averageSessionLength,
      mostProductiveHour: Number(mostProductiveHour),
      totalBreakTime
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to get timer statistics');
  }
}

/**
 * Get user timer settings
 */
export async function getUserTimerSettings(userId: string): Promise<typeof DEFAULT_TIMER_SETTINGS> {
  const db = getDb();

  try {
    const settingsRef = doc(db, TIMER_SETTINGS_COLLECTION, userId);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      return settingsDoc.data() as typeof DEFAULT_TIMER_SETTINGS;
    }

    // Create default settings for new user
    await setDoc(settingsRef, DEFAULT_TIMER_SETTINGS);
    return DEFAULT_TIMER_SETTINGS;
  } catch (error) {
    // If settings don't exist, return defaults
    return DEFAULT_TIMER_SETTINGS;
  }
}

/**
 * Update user timer settings
 */
export async function updateUserTimerSettings(
  userId: string,
  settings: Partial<typeof DEFAULT_TIMER_SETTINGS>
): Promise<void> {
  const db = getDb();

  try {
    const settingsRef = doc(db, TIMER_SETTINGS_COLLECTION, userId);
    await updateDoc(settingsRef, settings);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to update timer settings');
  }
}