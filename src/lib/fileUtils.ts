/**
 * File utility functions for MyStudyHub
 * Handles file validation, processing, and formatting
 */

import {
  FileType,
  FILE_TYPE_CONFIG,
  FileValidationRules,
  FileValidationError,
  SubjectFile,
  DEFAULT_FILE_VALIDATION_RULES
} from '@/types/subject';
import { TaskFile } from '@/types/task';
import { AdminFileConfig } from '@/types/admin';
import { Timestamp } from 'firebase/firestore';

/**
 * Extracts file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

/**
 * Determines file type based on MIME type and extension
 */
export function getFileType(file: File): FileType {
  const extension = getFileExtension(file.name);

  // Check if extension matches our supported types
  if (extension in FILE_TYPE_CONFIG) {
    return extension as FileType;
  }

  // Check MIME type as fallback
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (type !== 'other' && (config.mime as readonly string[]).includes(file.type)) {
      return type as FileType;
    }
  }
  return 'other';
}

/**
 * Converts admin file configuration to validation rules
 */
export function createValidationRulesFromAdminConfig(adminConfig: AdminFileConfig): FileValidationRules {
  return {
    allowedTypes: adminConfig.allowedFileTypes,
    maxSizeBytes: adminConfig.maxFileSizeBytes,
    maxFilesPerSubject: adminConfig.maxFilesPerSubject,
    maxFileNameLength: adminConfig.maxFileNameLength
  };
}

/**
 * Validates a single file against rules
 */
export function validateFile(
  file: File,
  rules: FileValidationRules,
  currentFileCount: number = 0
): FileValidationError | null {
  // Check file size
  if (file.size > rules.maxSizeBytes) {
    return {
      file,
      message: `File size exceeds limit of ${formatFileSize(rules.maxSizeBytes)}`,
      type: 'size'
    };
  }

  // Check file type
  const fileType = getFileType(file);
  if (!rules.allowedTypes.includes(fileType)) {
    return {
      file,
      message: `File type not allowed. Allowed types: ${rules.allowedTypes.join(', ').toUpperCase()}`,
      type: 'type'
    };
  }

  // Check file count
  if (currentFileCount >= rules.maxFilesPerSubject) {
    return {
      file,
      message: `Maximum file count (${rules.maxFilesPerSubject}) reached for this subject`,
      type: 'count'
    };
  }

  // Check file name
  if (!file.name || file.name.trim() === '') {
    return {
      file,
      message: 'File name cannot be empty',
      type: 'name'
    };
  }

  // Check file name length using dynamic limit
  if (file.name.length > rules.maxFileNameLength) {
    return {
      file,
      message: `File name is too long (maximum ${rules.maxFileNameLength} characters)`,
      type: 'name'
    };
  }

  // Check for invalid characters in filename
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(file.name)) {
    return {
      file,
      message: 'File name contains invalid characters',
      type: 'name'
    };
  }

  return null;
}

/**
 * Validates multiple files
 */
export function validateFiles(
  files: File[],
  rules: FileValidationRules,
  currentFileCount: number = 0
): { valid: File[]; errors: FileValidationError[] } {
  const valid: File[] = [];
  const errors: FileValidationError[] = [];

  files.forEach(file => {
    const error = validateFile(file, rules, currentFileCount + valid.length);
    if (error) {
      errors.push(error);
    } else {
      valid.push(file);
    }
  });

  return { valid, errors };
}

/**
 * Generates a safe filename for storage
 */
export function generateSafeFilename(originalName: string, subjectId: string, maxFileNameLength: number = 100): string {
  const timestamp = Date.now();
  const extension = getFileExtension(originalName);

  // Remove extension and clean the base name
  let baseName = originalName.replace(`.${extension}`, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_');

  // Calculate max base name length (subjectId + timestamp + underscores + extension)
  const prefixLength = subjectId.length + timestamp.toString().length + 2; // 2 underscores
  const suffixLength = extension.length + 1; // dot + extension
  const maxBaseLength = maxFileNameLength - prefixLength - suffixLength;

  // Limit base name length, ensuring it's at least 10 characters
  const targetLength = Math.max(10, Math.min(maxBaseLength, baseName.length));
  baseName = baseName.substring(0, targetLength);

  return `${subjectId}_${timestamp}_${baseName}.${extension}`;
}

/**
 * Gets storage path for a file
 */
export function getStoragePath(subjectId: string, fileId: string, filename: string): string {
  return `subjects/${subjectId}/files/${fileId}/${filename}`;
}

/**
 * Gets thumbnail path for image files
 */
export function getThumbnailPath(subjectId: string, fileId: string): string {
  return `subjects/${subjectId}/thumbnails/${fileId}`;
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Formats file upload date
 */
export function formatDate(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'Just now' : `${diffMins} min ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

/**
 * Converts File object to SubjectFile data
 */
export function createSubjectFileData(
  file: File,
  subjectId: string,
  userId: string,
  url: string,
  storagePath: string
): Omit<SubjectFile, 'id' | 'uploadedAt'> {
  return {
    subjectId,
    userId,
    name: file.name,
    originalName: file.name,
    type: getFileType(file),
    size: file.size,
    url,
    storagePath,
    isVerified: false
  };
}

/**
 * Downloads a file from URL
 */
export function downloadFile(file: SubjectFile): void {
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.originalName;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Checks if a file type is previewable in browser
 */
export function isPreviewable(type: FileType): boolean {
  const previewableTypes: FileType[] = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'md'];
  return previewableTypes.includes(type);
}

/**
 * Gets file category for grouping
 */
export function getFileCategory(type: FileType): string {
  const config = FILE_TYPE_CONFIG[type];
  return config ? config.category : 'other';
}

/**
 * Sorts files by different criteria
 */
export function sortFiles(
  files: SubjectFile[],
  sortBy: 'name' | 'date' | 'size' | 'type' = 'date',
  direction: 'asc' | 'desc' = 'desc'
): SubjectFile[] {
  return [...files].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = a.uploadedAt.toMillis() - b.uploadedAt.toMillis();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filters files by type or search term
 */
export function filterFiles(
  files: SubjectFile[],
  searchTerm: string = '',
  fileType?: FileType
): SubjectFile[] {
  return files.filter(file => {
    const matchesSearch = searchTerm === '' ||
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !fileType || file.type === fileType;

    return matchesSearch && matchesType;
  });
}

/**
 * Creates file metadata for task files
 */
export function createTaskFileData(
  taskId: string,
  userId: string,
  originalName: string,
  safeName: string,
  size: number,
  url: string,
  storagePath: string,
  description?: string
): Omit<TaskFile, 'id'> {
  return {
    taskId,
    userId,
    name: safeName,
    originalName,
    type: getFileExtension(originalName) as FileType,
    size,
    url,
    storagePath,
    description: description || '',
    uploadedAt: Timestamp.now()
  };
}

/**
 * Gets storage path for task files
 */
export function getTaskStoragePath(userId: string, taskId: string, filename: string): string {
  return `tasks/${userId}/${taskId}/${filename}`;
}

/**
 * Generates a safe filename for task files
 */
export function generateTaskSafeFilename(originalName: string): string {
  const timestamp = Date.now();
  const extension = getFileExtension(originalName);
  const baseName = originalName.replace(`.${extension}`, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50); // Limit length

  return `${timestamp}_${baseName}.${extension}`;
}