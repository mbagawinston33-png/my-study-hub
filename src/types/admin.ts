import { Timestamp } from "firebase/firestore";
import { FileType } from "./subject";

export interface AdminFileConfig {
  allowedFileTypes: FileType[];
  maxFileSizeBytes: number;
  maxFileNameLength: number;
  maxFilesPerSubject: number;
}

export interface AdminSettings {
  id: string;
  fileConfig: AdminFileConfig;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalFiles: number;
  totalStorageUsed: number;
  storageUsedByUser: Array<{
    userId: string;
    userEmail: string;
    storageUsed: number;
    fileCount: number;
  }>;
}

export interface AdminConfigFormData extends AdminFileConfig {
  // Form data extends the file config with any additional form-specific fields
}

export const DEFAULT_ADMIN_FILE_CONFIG: AdminFileConfig = {
  allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar'],
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
  maxFileNameLength: 100,
  maxFilesPerSubject: 50,
};