import { Timestamp } from "firebase/firestore";

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: Timestamp;
  priority: 'low' | 'medium' | 'high';
  subjectId?: string;
  isCompleted: boolean;
  createdAt: Timestamp;
}

export interface ReminderFormData {
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  subjectId?: string;
}

export const REMINDER_PRIORITIES = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
} as const;

export type ReminderPriority = keyof typeof REMINDER_PRIORITIES;