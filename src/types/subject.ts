/**
 * Subject data types for MyStudyHub
 */

import { Timestamp } from 'firebase/firestore';

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  description?: string;
  color: string;
  teacher?: string;
  room?: string;
  schedule?: SubjectSchedule[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SubjectSchedule {
  dayOfWeek: string; // 'Monday', 'Tuesday', etc.
  startTime: string; // '09:00', '14:30', etc.
  endTime: string;
  room?: string;
  type?: 'lecture' | 'lab' | 'tutorial' | 'seminar';
}

export interface CreateSubjectFormData {
  name: string;
  code?: string;
  description?: string;
  color: string;
  teacher?: string;
  room?: string;
}

export interface UpdateSubjectFormData extends Partial<CreateSubjectFormData> {
  isActive?: boolean;
}

export interface SubjectValidationError {
  field: keyof CreateSubjectFormData;
  message: string;
}

// Validation states
export interface SubjectValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Subject management states
export type SubjectStatus = 'idle' | 'loading' | 'success' | 'error';

// Color palette for subjects
export const SUBJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
] as const;

// Days of week for schedule
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;

// Time slots for schedule
export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00'
] as const;