"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { ToastProvider } from './ToastContext';
import {
  TimerSession,
  TimerState,
  TimerStats,
  TimerSessionType,
  TimerStatus,
  DEFAULT_TIMER_SETTINGS,
  getNextSessionType,
  getSessionConfig
} from '@/types/timer';
import {
  createTimerSession,
  updateTimerSession,
  completeTimerSession,
  pauseTimerSession,
  resumeTimerSession,
  stopTimerSession,
  getActiveTimerSession,
  getTimerStats,
  getUserTimerSettings,
  updateUserTimerSettings
} from '@/lib/timers';

interface TimerContextType extends TimerState {
  // Timer control functions
  startTimer: (sessionType?: TimerSessionType, duration?: number, taskId?: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  skipToNext: () => Promise<void>;

  // Settings functions
  updateSettings: (settings: Partial<typeof DEFAULT_TIMER_SETTINGS>) => Promise<void>;

  // Data refresh functions
  refreshStats: () => Promise<void>;
  refreshActiveSession: () => Promise<void>;

  // Utility functions
  isSessionActive: () => boolean;
  getCurrentSessionConfig: () => ReturnType<typeof getSessionConfig>;
  formatTimeRemaining: () => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}

interface TimerProviderProps {
  children: React.ReactNode;
}

export function TimerProvider({ children }: TimerProviderProps) {
  return (
    <ToastProvider>
      <TimerProviderInner>{children}</TimerProviderInner>
    </ToastProvider>
  );
}

function TimerProviderInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showSuccessToast, showInfoToast } = useToast();
  const [timerState, setTimerState] = useState<TimerState>({
    currentSession: null,
    timeRemaining: 0,
    isRunning: false,
    sessionType: 'focus',
    sessionCount: 0,
    settings: DEFAULT_TIMER_SETTINGS,
    stats: null,
    loading: true,
    error: null,
  });

  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Initialize timer data
  const initializeTimer = useCallback(async () => {
    if (!user) return;

    try {
      setTimerState(prev => ({ ...prev, loading: true, error: null }));

      const [activeSession, settings, stats] = await Promise.all([
        getActiveTimerSession(user.userId),
        getUserTimerSettings(user.userId),
        getTimerStats(user.userId)
      ]);

      let timeRemaining = 0;
      let isRunning = false;
      let sessionType = 'focus' as TimerSessionType;
      let sessionCount = 0;

      if (activeSession && activeSession.status === 'running') {
        const now = new Date();
        const startTime = activeSession.startTime.toDate();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        timeRemaining = Math.max(0, activeSession.duration - elapsed);
        isRunning = timeRemaining > 0;
        sessionType = activeSession.type;
        sessionCount = activeSession.sessionNumber;
      }

      setTimerState({
        currentSession: activeSession,
        timeRemaining,
        isRunning,
        sessionType,
        sessionCount,
        settings,
        stats,
        loading: false,
        error: null,
      });
    } catch (error) {
      setTimerState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize timer'
      }));
    }
  }, [user]);

  // Timer countdown effect
  useEffect(() => {
    if (timerState.isRunning && timerState.timeRemaining > 0) {
      const id = setInterval(async () => {
        setTimerState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;

          // Check if session should end
          if (newTimeRemaining <= 0) {
            // Session completed
            if (prev.currentSession) {
              completeTimerSession(
                prev.currentSession.id,
                prev.currentSession.userId,
                prev.currentSession.duration
              ).catch(console.error);
            }

            return {
              ...prev,
              timeRemaining: 0,
              isRunning: false,
              currentSession: prev.currentSession ? {
                ...prev.currentSession,
                status: 'completed' as TimerStatus
              } : null
            };
          }

          return {
            ...prev,
            timeRemaining: newTimeRemaining
          };
        });
      }, 1000);

      setIntervalId(id);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timerState.isRunning, timerState.timeRemaining, timerState.currentSession]);

  // Initialize on user change
  useEffect(() => {
    if (user) {
      initializeTimer();
    }
  }, [user, initializeTimer]);

  // Start timer
  const startTimer = useCallback(async (
    sessionType: TimerSessionType = 'focus',
    duration?: number,
    taskId?: string
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setTimerState(prev => ({ ...prev, loading: true, error: null }));

      // If there's an active session, complete it first
      if (timerState.currentSession && timerState.currentSession.status === 'running') {
        await stopTimer();
      }

      const sessionDuration = duration || (
        sessionType === 'focus'
          ? timerState.settings.focusDuration
          : sessionType === 'short_break'
          ? timerState.settings.shortBreakDuration
          : timerState.settings.longBreakDuration
      );

      const sessionCount = sessionType === 'focus' ? timerState.sessionCount + 1 : timerState.sessionCount;

      const newSession = await createTimerSession(user.userId, {
        type: sessionType,
        duration: sessionDuration,
        taskId,
        sessionNumber: sessionCount,
        completedSessions: timerState.stats?.completedToday || 0
      });

      setTimerState(prev => ({
        ...prev,
        currentSession: newSession,
        timeRemaining: sessionDuration,
        isRunning: true,
        sessionType,
        sessionCount,
        loading: false,
        error: null
      }));

      // Request notification permission if enabled
      if (timerState.settings.desktopNotifications && 'Notification' in window) {
        await Notification.requestPermission();
      }

      // Play start sound if enabled
      if (timerState.settings.soundEnabled) {
        playNotificationSound();
      }
    } catch (error) {
      setTimerState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to start timer'
      }));
    }
  }, [user, timerState.currentSession, timerState.sessionCount, timerState.settings, timerState.stats]);

  // Pause timer
  const pauseTimer = useCallback(async () => {
    if (!timerState.currentSession || !user) return;

    try {
      await pauseTimerSession(timerState.currentSession.id, user.userId);

      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          status: 'paused' as TimerStatus
        } : null
      }));
    } catch (error) {
      setTimerState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to pause timer'
      }));
    }
  }, [timerState.currentSession, user]);

  // Resume timer
  const resumeTimer = useCallback(async () => {
    if (!timerState.currentSession || !user) return;

    try {
      await resumeTimerSession(timerState.currentSession.id, user.userId);

      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          status: 'running' as TimerStatus
        } : null
      }));
    } catch (error) {
      setTimerState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to resume timer'
      }));
    }
  }, [timerState.currentSession, user]);

  // Stop timer
  const stopTimer = useCallback(async () => {
    if (!timerState.currentSession || !user) return;

    try {
      const actualDuration = timerState.currentSession.duration - timerState.timeRemaining;
      await stopTimerSession(timerState.currentSession.id, user.userId, actualDuration);

      await refreshStats();

      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        timeRemaining: 0,
        currentSession: null
      }));
    } catch (error) {
      setTimerState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to stop timer'
      }));
    }
  }, [timerState.currentSession, user]);

  // Skip to next session
  const skipToNext = useCallback(async () => {
    if (!timerState.currentSession || !user) return;

    try {
      // Complete current session
      const actualDuration = timerState.currentSession.duration - timerState.timeRemaining;
      await completeTimerSession(timerState.currentSession.id, user.userId, actualDuration);

      // Determine next session type
      const nextType = getNextSessionType(
        timerState.sessionType,
        timerState.sessionCount,
        timerState.settings.longBreakInterval
      );

      // Start next session if auto-start is enabled
      if ((timerState.sessionType === 'focus' && timerState.settings.autoStartBreaks) ||
          (timerState.sessionType !== 'focus' && timerState.settings.autoStartPomodoros)) {
        await startTimer(nextType);
      } else {
        // Just clear current session
        setTimerState(prev => ({
          ...prev,
          isRunning: false,
          timeRemaining: 0,
          currentSession: null
        }));
      }

      await refreshStats();
    } catch (error) {
      setTimerState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to skip to next session'
      }));
    }
  }, [timerState.currentSession, timerState.sessionType, timerState.sessionCount, timerState.settings, user, startTimer]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<typeof DEFAULT_TIMER_SETTINGS>) => {
    if (!user) return;

    try {
      await updateUserTimerSettings(user.userId, newSettings);

      setTimerState(prev => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings }
      }));
    } catch (error) {
      setTimerState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update settings'
      }));
    }
  }, [user]);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (!user) return;

    try {
      const stats = await getTimerStats(user.userId);
      setTimerState(prev => ({ ...prev, stats }));
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  }, [user]);

  // Refresh active session
  const refreshActiveSession = useCallback(async () => {
    if (!user) return;

    try {
      const activeSession = await getActiveTimerSession(user.userId);

      if (activeSession && activeSession.status === 'running') {
        const now = new Date();
        const startTime = activeSession.startTime.toDate();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const timeRemaining = Math.max(0, activeSession.duration - elapsed);

        setTimerState(prev => ({
          ...prev,
          currentSession: activeSession,
          timeRemaining,
          isRunning: timeRemaining > 0,
          sessionType: activeSession.type,
          sessionCount: activeSession.sessionNumber
        }));
      }
    } catch (error) {
      console.error('Failed to refresh active session:', error);
    }
  }, [user]);

  // Utility functions
  const isSessionActive = useCallback(() => {
    return timerState.isRunning && timerState.timeRemaining > 0;
  }, [timerState.isRunning, timerState.timeRemaining]);

  const getCurrentSessionConfig = useCallback(() => {
    return getSessionConfig(timerState.sessionType);
  }, [timerState.sessionType]);

  const formatTimeRemaining = useCallback(() => {
    const mins = Math.floor(timerState.timeRemaining / 60);
    const secs = timerState.timeRemaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timerState.timeRemaining]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarl7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.play().catch(() => {
        // Ignore audio play errors
      });
    } catch (error) {
      // Ignore audio errors
    }
  }, []);

  // Session completion effect
  useEffect(() => {
    if (timerState.currentSession &&
        timerState.currentSession.status === 'completed' &&
        !timerState.isRunning) {
      const config = getCurrentSessionConfig();

      // Show desktop notification
      if (timerState.settings.desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Session Completed!', {
          body: `Your ${config.label} session is complete.`,
          icon: '/favicon.ico'
        });
      }

      // Show toast notification
      showSuccessToast(
        `${config.label} Session Complete!`,
        `Great job! You've completed your ${config.label} session.`
      );

      // Play completion sound
      if (timerState.settings.soundEnabled) {
        playNotificationSound();
      }
    }
  }, [timerState.currentSession?.status, timerState.isRunning, timerState.settings, getCurrentSessionConfig, playNotificationSound, showSuccessToast]);

  const value: TimerContextType = {
    ...timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    skipToNext,
    updateSettings,
    refreshStats,
    refreshActiveSession,
    isSessionActive,
    getCurrentSessionConfig,
    formatTimeRemaining,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}