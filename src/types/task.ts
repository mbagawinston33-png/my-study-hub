/**
 * Task data types for MyStudyHub
 */

import { Timestamp } from 'firebase/firestore';
import { FileType } from './subject';

// Task priority levels
export type TaskPriority = 'low' | 'medium' | 'high';

// Task status types
export type TaskStatus = 'pending' | 'completed' | 'overdue';

// Main task interface
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: Timestamp;
  priority: TaskPriority;
  status: TaskStatus;
  subjectId?: string; // Optional link to a subject
  attachedFiles: TaskFile[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Task file interface
export interface TaskFile {
  id: string;
  taskId: string;
  userId: string;
  name: string;
  originalName: string;
  type: FileType;
  size: number;
  url: string;
  storagePath: string;
  description?: string;
  uploadedAt: Timestamp;
}

// Form data for task creation/editing
export interface TaskFormData {
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  subjectId?: string;
}

// Validation interfaces
export interface TaskValidationError {
  field: keyof TaskFormData;
  message: string;
}

export interface TaskValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Task management states
export type TaskManagementState = 'idle' | 'loading' | 'success' | 'error';

// Task filter options for listing
export type TaskFilter = 'all' | 'pending' | 'completed' | 'overdue';

// Task sort options
export type TaskSortOption = 'dueDate' | 'priority' | 'createdAt' | 'title';

// Task statistics interface
export interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  dueThisWeek: number;
}

// Priority configuration
export const TASK_PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: '#6B7280',
    bg: '#F3F4F6',
    value: 1
  },
  medium: {
    label: 'Medium',
    color: '#F59E0B',
    bg: '#FEF3C7',
    value: 2
  },
  high: {
    label: 'High',
    color: '#EF4444',
    bg: '#FEE2E2',
    value: 3
  }
} as const;

// Status configuration
export const TASK_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#6B7280',
    bg: '#F3F4F6',
    icon: '⏳'
  },
  completed: {
    label: 'Completed',
    color: '#10B981',
    bg: '#D1FAE5',
    icon: '✅'
  },
  overdue: {
    label: 'Overdue',
    color: '#EF4444',
    bg: '#FEE2E2',
    icon: '⚠️'
  }
} as const;

// Form validation rules
export interface TaskValidationRules {
  titleMinLength: number;
  titleMaxLength: number;
  descriptionMaxLength: number;
  allowFutureDatesOnly: boolean;
  allowPastDueDates: boolean;
}

export const DEFAULT_TASK_VALIDATION_RULES: TaskValidationRules = {
  titleMinLength: 1,
  titleMaxLength: 100,
  descriptionMaxLength: 500,
  allowFutureDatesOnly: true,
  allowPastDueDates: true
};

// Task creation state
export interface TaskCreationState {
  isCreating: boolean;
  error?: string;
  progress: number;
}

// Task update state
export interface TaskUpdateState {
  isUpdating: boolean;
  error?: string;
  field?: string;
}

// File upload state for tasks
export interface TaskFileUploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
  files: TaskFile[];
}

// Task with subject information (for display)
export interface TaskWithSubject extends Task {
  subject?: {
    id: string;
    name: string;
    code?: string;
    color: string;
  };
}

// Extended validation rules for task files
export interface TaskFileValidationRules {
  maxSizeBytes: number;
  allowedTypes: FileType[];
  maxFilesPerTask: number;
}

export const DEFAULT_TASK_FILE_VALIDATION_RULES: TaskFileValidationRules = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
    'jpg', 'jpeg', 'png', 'gif', 'txt', 'md', 'zip', 'rar'
  ],
  maxFilesPerTask: 10
};

// Helper function to check if a task is overdue
export const isTaskOverdue = (task: Task): boolean => {
  if (task.status === 'completed') return false;
  const now = new Date();
  const dueDate = task.dueDate.toDate();
  return dueDate < now;
};

// Helper function to get task status based on due date and completion
export const getTaskStatus = (task: Task): TaskStatus => {
  if (task.status === 'completed') return 'completed';
  if (isTaskOverdue(task)) return 'overdue';
  return 'pending';
};

// Helper function to sort tasks by priority
export const sortTasksByPriority = (tasks: Task[]): Task[] => {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return [...tasks].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
};

// Helper function to sort tasks by due date
export const sortTasksByDueDate = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime());
};