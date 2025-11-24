/**
 * Subject File Management utilities for MyStudyHub
 * Handles file upload, download, and management operations for subjects during creation
 * Based on taskFiles.ts patterns but adapted for subjects
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';

import { getStorageInstance, getDb } from '@/lib/firebase';
import { SubjectFile } from '@/types/subject';
import { FileType, FileValidationRules } from '@/types/subject';
import {
  generateSafeFilename,
  getStoragePath,
  getFileExtension
} from '@/lib/fileUtils';

const SUBJECT_FILES_COLLECTION = 'subjectFiles';

/**
 * Uploads a file to Firebase Storage and creates Firestore record for a subject
 * This follows the same pattern as task files but uses subjectId instead of taskId
 */
export async function uploadSubjectFile(
  file: File,
  subjectId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<SubjectFile> {
  const storage = getStorageInstance();
  const db = getDb();

  // Generate unique file ID and safe filename
  const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const safeFilename = generateSafeFilename(file.name, subjectId);
  const storagePath = getStoragePath(subjectId, fileId, safeFilename);

  // Create storage reference
  const storageRef = ref(storage, storagePath);

  try {
    // Upload file with metadata
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedBy: userId,
        subjectId,
        uploadedAt: new Date().toISOString()
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Create file data using SubjectFile structure
    const fileData = {
      id: fileId,
      subjectId,
      userId,
      name: safeFilename,
      originalName: file.name,
      type: getFileExtension(file.name) as FileType,
      size: file.size,
      url: downloadURL,
      storagePath,
      isVerified: false,
      uploadedAt: serverTimestamp()
    } as Omit<SubjectFile, 'uploadedAt'> & { uploadedAt: any };

    // Save to Firestore
    await setDoc(doc(db, SUBJECT_FILES_COLLECTION, fileId), fileData);

    // Get the complete document with timestamp
    const fileDocSnapshot = await getDoc(doc(db, SUBJECT_FILES_COLLECTION, fileId));

    if (!fileDocSnapshot.exists()) {
      throw new Error('Failed to save file metadata');
    }

    const completeFileData = {
      id: fileDocSnapshot.id,
      ...fileDocSnapshot.data()
    } as SubjectFile;

    return completeFileData;

  } catch (error) {
    throw error;
  }
}

/**
 * Batch upload multiple files for a subject during creation
 */
export async function uploadSubjectFiles(
  files: File[],
  subjectId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<SubjectFile[]> {
  const uploadedFiles: SubjectFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const uploadedFile = await uploadSubjectFile(
        file,
        subjectId,
        userId,
        (fileProgress) => {
          // Calculate overall progress
          const overallProgress = ((i * 100) + fileProgress) / files.length;
          onProgress?.(overallProgress);
        }
      );

      uploadedFiles.push(uploadedFile);
    } catch (error) {
      // Continue with other files even if one fails
      console.error(`Failed to upload file ${file.name}:`, error);
    }
  }

  return uploadedFiles;
}

/**
 * Get all files for a specific subject
 */
export async function getSubjectFiles(subjectId: string, userId: string): Promise<SubjectFile[]> {
  const db = getDb();

  try {
    const q = query(
      collection(db, SUBJECT_FILES_COLLECTION),
      where('subjectId', '==', subjectId),
      where('userId', '==', userId),
      orderBy('uploadedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SubjectFile[];
  } catch (error) {
    throw new Error('Failed to fetch subject files');
  }
}

/**
 * Delete a subject file (both from Storage and Firestore)
 */
export async function deleteSubjectFile(userId: string, fileId: string): Promise<void> {
  const storage = getStorageInstance();
  const db = getDb();

  try {
    // First try to get the file metadata to get storage path
    let storagePath: string | null = null;

    try {
      const file = await getSubjectFileById(userId, fileId);
      storagePath = file.storagePath;
    } catch (getFileError) {
      // File might not exist in Firestore, but we should still try to clean up
      console.warn('File not found in Firestore, proceeding with cleanup:', fileId);
    }

    // Delete from Storage if we have a storage path
    if (storagePath) {
      try {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
      } catch (storageError) {
        // Storage file might not exist, but that's okay
        console.warn('Storage file not found, continuing with Firestore cleanup:', storagePath);
      }
    }

    // Delete from Firestore (this will succeed even if file doesn't exist)
    const docRef = doc(db, SUBJECT_FILES_COLLECTION, fileId);
    await deleteDoc(docRef);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to delete file');
  }
}

/**
 * Get a single subject file by ID
 */
export async function getSubjectFileById(userId: string, fileId: string): Promise<SubjectFile> {
  const db = getDb();

  try {
    const docRef = doc(db, SUBJECT_FILES_COLLECTION, fileId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('File not found');
    }

    const file = { id: docSnap.id, ...docSnap.data() } as SubjectFile;

    // Verify user ownership
    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    return file;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch subject file');
  }
}

/**
 * Update subject with file count
 */
export async function updateSubjectFileCount(subjectId: string): Promise<void> {
  const db = getDb();

  try {
    // Get all files for the subject
    const filesQuery = query(
      collection(db, SUBJECT_FILES_COLLECTION),
      where('subjectId', '==', subjectId)
    );

    const querySnapshot = await getDocs(filesQuery);
    const fileCount = querySnapshot.size;

    // Update the subject with the file count
    const subjectRef = doc(db, 'subjects', subjectId);
    await updateDoc(subjectRef, {
      fileCount,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    // Don't throw error here as this is not critical for subject creation
    console.warn('Failed to update subject file count:', error);
  }
}

/**
 * Get total file count and size for a subject
 */
export async function getSubjectFileStats(subjectId: string, userId: string): Promise<{
  count: number;
  totalSize: number;
}> {
  try {
    const files = await getSubjectFiles(subjectId, userId);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      count: files.length,
      totalSize
    };
  } catch (error) {
    return {
      count: 0,
      totalSize: 0
    };
  }
}

/**
 * Validate file before upload (reuses task validation logic)
 */
export function validateSubjectFile(file: File, validationRules?: FileValidationRules): {
  isValid: boolean;
  error?: string;
} {
  // Use provided validation rules or fallback to defaults
  const rules = validationRules || {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
      'jpg', 'jpeg', 'png', 'gif', 'txt', 'md', 'zip', 'rar', 'other'
    ],
    maxFilesPerSubject: 50,
    maxFileNameLength: 255
  };

  // Check file size
  if (file.size > rules.maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${(rules.maxSizeBytes / (1024 * 1024)).toFixed(1)}MB`
    };
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !rules.allowedTypes.includes(fileExtension as FileType)) {
    return {
      isValid: false,
      error: `File type .${fileExtension} is not allowed`
    };
  }

  // Check file name length using dynamic limit
  if (file.name.length > rules.maxFileNameLength) {
    return {
      isValid: false,
      error: `File name is too long (maximum ${rules.maxFileNameLength} characters)`
    };
  }

  return { isValid: true };
}