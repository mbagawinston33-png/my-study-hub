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
  fileCount?: number; // Optional field to track attached files
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
  selectedFiles?: File[]; // Files to be uploaded during subject creation
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

// ===== FILE MANAGEMENT TYPES =====

export type FileType =
  | 'pdf'
  | 'doc' | 'docx'
  | 'ppt' | 'pptx'
  | 'xls' | 'xlsx'
  | 'jpg' | 'jpeg' | 'png' | 'gif'
  | 'txt' | 'md'
  | 'zip' | 'rar'
  | 'mp4' | 'mp3' | 'wav'
  | 'other';

export interface SubjectFile {
  id: string;
  subjectId: string;
  userId: string;
  name: string;
  originalName: string;
  type: FileType;
  size: number;
  url: string;
  storagePath: string;
  description?: string;
  isVerified: boolean;
  uploadedAt: Timestamp;
}

export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
  files: SubjectFile[];
}

export interface FileValidationRules {
  maxSizeBytes: number;
  allowedTypes: FileType[];
  maxFilesPerSubject: number;
  maxFileNameLength: number;
}

export interface FileValidationError {
  file: File;
  message: string;
  type: 'size' | 'type' | 'count' | 'name' | 'general';
}

// File type configuration with MIME types and icons
export const FILE_TYPE_CONFIG = {
  // Documents
  pdf: {
    mime: ['application/pdf'],
    icon: 'PDF',
    color: '#DC2626',
    category: 'document' as const
  },
  doc: {
    mime: ['application/msword'],
    icon: 'DOC',
    color: '#2563EB',
    category: 'document' as const
  },
  docx: {
    mime: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    icon: 'DOCX',
    color: '#2563EB',
    category: 'document' as const
  },
  ppt: {
    mime: ['application/vnd.ms-powerpoint'],
    icon: 'PPT',
    color: '#EA580C',
    category: 'document' as const
  },
  pptx: {
    mime: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    icon: 'PPTX',
    color: '#EA580C',
    category: 'document' as const
  },
  xls: {
    mime: ['application/vnd.ms-excel'],
    icon: 'XLS',
    color: '#16A34A',
    category: 'document' as const
  },
  xlsx: {
    mime: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    icon: 'XLSX',
    color: '#16A34A',
    category: 'document' as const
  },

  // Images
  jpg: {
    mime: ['image/jpeg'],
    icon: 'JPG',
    color: '#9333EA',
    category: 'image' as const
  },
  jpeg: {
    mime: ['image/jpeg'],
    icon: 'JPG',
    color: '#9333EA',
    category: 'image' as const
  },
  png: {
    mime: ['image/png'],
    icon: 'PNG',
    color: '#9333EA',
    category: 'image' as const
  },
  gif: {
    mime: ['image/gif'],
    icon: 'GIF',
    color: '#9333EA',
    category: 'image' as const
  },

  // Text
  txt: {
    mime: ['text/plain'],
    icon: 'TXT',
    color: '#6B7280',
    category: 'text' as const
  },
  md: {
    mime: ['text/markdown'],
    icon: 'MD',
    color: '#6B7280',
    category: 'text' as const
  },

  // Archives
  zip: {
    mime: ['application/zip', 'application/x-zip-compressed'],
    icon: 'ZIP',
    color: '#A855F7',
    category: 'archive' as const
  },
  rar: {
    mime: ['application/x-rar-compressed'],
    icon: 'RAR',
    color: '#A855F7',
    category: 'archive' as const
  },

  // Media
  mp4: {
    mime: ['video/mp4'],
    icon: 'MP4',
    color: '#DC2626',
    category: 'media' as const
  },
  mp3: {
    mime: ['audio/mpeg', 'audio/mp3'],
    icon: 'MP3',
    color: '#7C3AED',
    category: 'media' as const
  },
  wav: {
    mime: ['audio/wav', 'audio/wave'],
    icon: 'WAV',
    color: '#7C3AED',
    category: 'media' as const
  },

  other: {
    mime: [],
    icon: 'FILE',
    color: '#6B7280',
    category: 'other' as const
  }
} as const;

// Default validation rules
export const DEFAULT_FILE_VALIDATION_RULES: FileValidationRules = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: Object.keys(FILE_TYPE_CONFIG) as FileType[],
  maxFilesPerSubject: 50,
  maxFileNameLength: 255
};

// Update Subject interface to include file count
export interface SubjectWithFileCount extends Subject {
  fileCount?: number;
}