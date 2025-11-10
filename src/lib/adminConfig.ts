import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  limit,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { getDb } from "./firebase";
import { AdminSettings, AdminFileConfig, DEFAULT_ADMIN_FILE_CONFIG } from "@/types/admin";
import { FileType, FileValidationRules } from "@/types/subject";

const ADMIN_SETTINGS_COLLECTION = "adminSettings";
const DEFAULT_SETTINGS_ID = "global";

/**
 * Get current admin settings from Firestore
 */
export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    const db = getDb();
    const settingsDoc = await getDoc(doc(db, ADMIN_SETTINGS_COLLECTION, DEFAULT_SETTINGS_ID));

    if (settingsDoc.exists()) {
      return {
        id: settingsDoc.id,
        ...settingsDoc.data(),
      } as AdminSettings;
    } else {
      // If no settings exist, create default settings
      const defaultSettings: AdminSettings = {
        id: DEFAULT_SETTINGS_ID,
        fileConfig: DEFAULT_ADMIN_FILE_CONFIG,
        updatedBy: "system",
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(doc(db, ADMIN_SETTINGS_COLLECTION, DEFAULT_SETTINGS_ID), defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error getting admin settings:", error);
    throw error;
  }
}

/**
 * Update admin settings
 */
export async function updateAdminSettings(
  fileConfig: AdminFileConfig,
  updatedBy: string
): Promise<void> {
  try {
    const db = getDb();
    const settingsRef = doc(db, ADMIN_SETTINGS_COLLECTION, DEFAULT_SETTINGS_ID);

    await updateDoc(settingsRef, {
      fileConfig,
      updatedBy,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    throw error;
  }
}

/**
 * Get file validation rules for use throughout the application
 */
export async function getFileValidationRules(): Promise<AdminFileConfig> {
  try {
    const settings = await getAdminSettings();
    return settings.fileConfig;
  } catch (error) {
    console.error("Error getting file validation rules, using defaults:", error);
    return DEFAULT_ADMIN_FILE_CONFIG;
  }
}

/**
 * Subscribe to real-time updates of admin settings
 */
export function subscribeToAdminSettings(
  callback: (settings: AdminSettings | null) => void
): () => void {
  const db = getDb();
  const settingsRef = doc(db, ADMIN_SETTINGS_COLLECTION, DEFAULT_SETTINGS_ID);

  return onSnapshot(settingsRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const settings = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as AdminSettings;
      callback(settings);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error listening to admin settings:", error);
    callback(null);
  });
}

/**
 * Validate file configuration settings
 */
export function validateFileConfig(config: AdminFileConfig): string[] {
  const errors: string[] = [];

  // Validate file types
  if (!config.allowedFileTypes || config.allowedFileTypes.length === 0) {
    errors.push("At least one file type must be allowed");
  }

  const validFileTypes: FileType[] = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar', 'mp4', 'mp3', 'wav', 'xlsx', 'pptx'];
  const invalidTypes = config.allowedFileTypes.filter(type => !validFileTypes.includes(type));
  if (invalidTypes.length > 0) {
    errors.push(`Invalid file types: ${invalidTypes.join(', ')}`);
  }

  // Validate file size (must be between 1MB and 100MB)
  const minSize = 1024 * 1024; // 1MB
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (config.maxFileSizeBytes < minSize || config.maxFileSizeBytes > maxSize) {
    errors.push("File size must be between 1MB and 100MB");
  }

  // Validate file name length (must be between 10 and 255 characters)
  if (config.maxFileNameLength < 10 || config.maxFileNameLength > 255) {
    errors.push("File name length must be between 10 and 255 characters");
  }

  // Validate files per subject (must be between 1 and 500)
  if (config.maxFilesPerSubject < 1 || config.maxFilesPerSubject > 500) {
    errors.push("Maximum files per subject must be between 1 and 500");
  }

  return errors;
}

/**
 * Convert file size from bytes to MB and vice versa
 */
export const fileSizeUtils = {
  bytesToMB: (bytes: number): number => {
    return Math.round(bytes / (1024 * 1024) * 100) / 100;
  },

  mbToBytes: (mb: number): number => {
    return Math.round(mb * 1024 * 1024);
  },
};

/**
 * Get formatted file validation rules for display
 */
export function getFormattedFileRules(config: AdminFileConfig): {
  allowedTypes: string;
  maxSize: string;
  maxNameLength: string;
  maxFilesPerSubject: string;
} {
  return {
    allowedTypes: config.allowedFileTypes.map(type => type.toUpperCase()).join(', '),
    maxSize: `${fileSizeUtils.bytesToMB(config.maxFileSizeBytes)} MB`,
    maxNameLength: `${config.maxFileNameLength} characters`,
    maxFilesPerSubject: `${config.maxFilesPerSubject} files`,
  };
}

/**
 * Convert admin file configuration to FileValidationRules format
 * This bridges the gap between admin configuration and file upload validation
 */
export function createValidationRulesFromAdminConfig(adminConfig: AdminFileConfig): FileValidationRules {
  return {
    maxSizeBytes: adminConfig.maxFileSizeBytes,
    allowedTypes: adminConfig.allowedFileTypes,
    maxFilesPerSubject: adminConfig.maxFilesPerSubject,
    maxFileNameLength: adminConfig.maxFileNameLength
  };
}