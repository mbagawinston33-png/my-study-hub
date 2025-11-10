/**
 * Timer data types for MyStudyHub Pomodoro Study Timer
 */

import { Timestamp } from 'firebase/firestore';

// Timer session types
export type TimerSessionType = 'focus' | 'short_break' | 'long_break';

// Timer status types
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

// Main timer session interface
export interface TimerSession {
  id: string;
  userId: string;
  taskId?: string; // Optional link to a task
  type: TimerSessionType;
  duration: number; // Target duration in seconds
  actualDuration: number; // Actual completed duration in seconds
  startTime: Timestamp;
  endTime?: Timestamp;
  status: TimerStatus;
  sessionNumber: number; // Pomodoro session counter
  completedSessions: number; // Total completed sessions today
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Timer settings interface
export interface TimerSettings {
  focusDuration: number; // Focus duration in seconds (default: 25 * 60)
  shortBreakDuration: number; // Short break duration in seconds (default: 5 * 60)
  longBreakDuration: number; // Long break duration in seconds (default: 15 * 60)
  longBreakInterval: number; // Long break after X sessions (default: 4)
  autoStartBreaks: boolean; // Auto-start break after focus session
  autoStartPomodoros: boolean; // Auto-start focus session after break
  soundEnabled: boolean; // Play sound notifications
  desktopNotifications: boolean; // Browser desktop notifications
}

// Timer statistics interface
export interface TimerStats {
  totalStudyTime: number; // Total study time in minutes
  totalSessions: number; // Total completed sessions
  completedToday: number; // Sessions completed today
  completedThisWeek: number; // Sessions completed this week
  weeklyGoal: number; // Weekly goal in sessions
  currentStreak: number; // Current consecutive days with sessions
  averageSessionLength: number; // Average session length in minutes
  mostProductiveHour: number; // Hour (0-23) when user completes most sessions
  totalBreakTime: number; // Total break time in minutes
}

// Form data for timer settings
export interface TimerSettingsFormData {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

// Timer state for context
export interface TimerState {
  currentSession: TimerSession | null;
  timeRemaining: number; // Seconds remaining in current session
  isRunning: boolean;
  sessionType: TimerSessionType;
  sessionCount: number; // Current session count in cycle
  settings: TimerSettings;
  stats: TimerStats | null;
  loading: boolean;
  error: string | null;
}

// Timer validation interfaces
export interface TimerValidationError {
  field: keyof TimerSettingsFormData;
  message: string;
}

export interface TimerValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Timer management states
export type TimerManagementState = 'idle' | 'loading' | 'success' | 'error';

// Timer filter options for listing
export type TimerFilter = 'all' | 'today' | 'this_week' | 'this_month' | 'focus' | 'short_break' | 'long_break';

// Timer sort options
export type TimerSortOption = 'startTime' | 'duration' | 'createdAt' | 'type';

// Timer session configuration
export const TIMER_SESSION_CONFIG = {
  focus: {
    label: 'Focus Time',
    color: '#3B82F6', // Blue
    bg: '#DBEAFE',
    icon: '🎯',
    defaultDuration: 25 * 60 // 25 minutes
  },
  short_break: {
    label: 'Short Break',
    color: '#10B981', // Green
    bg: '#D1FAE5',
    icon: '☕',
    defaultDuration: 5 * 60 // 5 minutes
  },
  long_break: {
    label: 'Long Break',
    color: '#8B5CF6', // Purple
    bg: '#EDE9FE',
    icon: '🌿',
    defaultDuration: 15 * 60 // 15 minutes
  }
} as const;

// Default timer settings
export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  focusDuration: 25 * 60, // 25 minutes
  shortBreakDuration: 5 * 60, // 5 minutes
  longBreakDuration: 15 * 60, // 15 minutes
  longBreakInterval: 4, // Every 4 sessions
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  desktopNotifications: true
};

// Timer validation rules
export interface TimerValidationRules {
  minFocusDuration: number;
  maxFocusDuration: number;
  minBreakDuration: number;
  maxBreakDuration: number;
  minLongBreakInterval: number;
  maxLongBreakInterval: number;
}

export const DEFAULT_TIMER_VALIDATION_RULES: TimerValidationRules = {
  minFocusDuration: 1 * 60, // 1 minute
  maxFocusDuration: 120 * 60, // 2 hours
  minBreakDuration: 1 * 60, // 1 minute
  maxBreakDuration: 30 * 60, // 30 minutes
  minLongBreakInterval: 2,
  maxLongBreakInterval: 10
};

// Helper function to format time remaining
export const formatTimeRemaining = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to get session configuration
export const getSessionConfig = (type: TimerSessionType) => {
  return TIMER_SESSION_CONFIG[type];
};

// Helper function to check if session is a break
export const isBreakSession = (type: TimerSessionType): boolean => {
  return type === 'short_break' || type === 'long_break';
};

// Helper function to determine next session type
export const getNextSessionType = (
  currentType: TimerSessionType,
  sessionCount: number,
  longBreakInterval: number
): TimerSessionType => {
  if (currentType === 'focus') {
    // After focus, determine break type
    return (sessionCount + 1) % longBreakInterval === 0 ? 'long_break' : 'short_break';
  } else {
    // After break, always return to focus
    return 'focus';
  }
};

// Helper function to check if timer session is overdue
export const isSessionOverdue = (session: TimerSession): boolean => {
  if (session.status === 'completed' || session.status === 'paused') return false;
  const now = new Date();
  const endTime = session.endTime || new Date(session.startTime.toDate().getTime() + session.duration * 1000);
  return endTime < now;
};

// Helper function to get session status based on time
export const getSessionStatus = (session: TimerSession): TimerStatus => {
  if (session.status === 'completed' || session.status === 'paused') return session.status;
  if (isSessionOverdue(session)) return 'completed';
  return session.status;
};