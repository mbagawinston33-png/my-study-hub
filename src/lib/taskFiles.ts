/**
 * Task File Management utilities for MyStudyHub
 * Handles file upload, download, and management operations for tasks
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import {
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit
} from 'firebase/firestore';

import { getStorageInstance, getDb } from '@/lib/firebase';
import {
  TaskFile,
  Task
} from '@/types/task';
import { FileType } from '@/types/subject';
import {
  generateTaskSafeFilename,
  getTaskStoragePath,
  createTaskFileData,
  getFileExtension
} from '@/lib/fileUtils';

const TASK_FILES_COLLECTION = 'taskFiles';
const TASK_FILES_STORAGE_PATH = 'taskFiles';

/**
 * Uploads a file to Firebase Storage and creates Firestore record for a task
 * This follows the same pattern as subject files but uses taskId instead of subjectId
 */
export async function uploadTaskFile(
  file: File,
  taskId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<TaskFile> {
  const storage = getStorageInstance();
  const db = getDb();

  // Generate unique file ID and safe filename
  const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const safeFilename = generateTaskSafeFilename(file.name);
  const storagePath = getTaskStoragePath(userId, taskId, safeFilename);

  // Create storage reference
  const storageRef = ref(storage, storagePath);

  try {
    // Upload file with metadata
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedBy: userId,
        taskId,
        uploadedAt: new Date().toISOString()
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Create file data using SubjectFile structure but with taskId
    const fileData = {
      id: fileId,
      taskId, // Use taskId instead of subjectId
      userId,
      name: safeFilename,
      originalName: file.name,
      type: getFileExtension(file.name) as FileType,
      size: file.size,
      url: downloadURL,
      storagePath,
      uploadedAt: serverTimestamp()
    } as Omit<TaskFile, 'uploadedAt'> & { uploadedAt: any };

    // Save to Firestore in the same collection as subject files
    await setDoc(doc(db, 'subjectFiles', fileId), fileData);

    // Get the complete document with timestamp
    const fileDocSnapshot = await getDoc(doc(db, 'subjectFiles', fileId));

    if (!fileDocSnapshot.exists()) {
      throw new Error('Failed to save file metadata');
    }

    const completeFileData = {
      id: fileDocSnapshot.id,
      ...fileDocSnapshot.data()
    } as TaskFile;

    return completeFileData;

  } catch (error) {
throw error;
  }
}

/**
 * Get all files for a specific task
 */
export async function getTaskFiles(taskId: string, userId: string): Promise<TaskFile[]> {
  const db = getDb();

  try {
    const q = query(
      collection(db, 'subjectFiles'), // Use same collection as subject files
      where('taskId', '==', taskId),
      where('userId', '==', userId),
      orderBy('uploadedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TaskFile[];
  } catch (error) {
throw new Error('Failed to fetch task files');
  }
}

/**
 * Get a single task file by ID
 */
export async function getTaskFileById(userId: string, fileId: string): Promise<TaskFile> {
  const db = getDb();

  try {
    const docRef = doc(db, TASK_FILES_COLLECTION, fileId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('File not found');
    }

    const file = { id: docSnap.id, ...docSnap.data() } as TaskFile;

    // Verify user ownership
    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    return file;
  } catch (error) {
throw error instanceof Error ? error : new Error('Failed to fetch task file');
  }
}

/**
 * Delete a task file (both from Storage and Firestore)
 */
export async function deleteTaskFile(userId: string, fileId: string): Promise<void> {
  const storage = getStorageInstance();
  const db = getDb();

  try {
    // First get the file metadata to get storage path
    const file = await getTaskFileById(userId, fileId);

    // Delete from Storage
    const storageRef = ref(storage, file.storagePath);
    await deleteObject(storageRef);

    // Delete from Firestore
    const docRef = doc(db, TASK_FILES_COLLECTION, fileId);
    await deleteDoc(docRef);
  } catch (error) {
throw error instanceof Error ? error : new Error('Failed to delete file');
  }
}

/**
 * Update task with file attachments
 */
export async function updateTaskFiles(userId: string, taskId: string, fileIds: string[]): Promise<void> {
  const db = getDb();

  try {
    const taskRef = doc(db, 'tasks', taskId);

    // First verify ownership
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }

    const task = taskDoc.data() as Task;
    if (task.userId !== userId) {
      throw new Error('Access denied');
    }

    // Get files to attach
    const files: TaskFile[] = [];
    for (const fileId of fileIds) {
      const file = await getTaskFileById(userId, fileId);
      files.push(file);
    }

    // Update task with attached files
    await updateDoc(taskRef, {
      attachedFiles: files,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
throw error instanceof Error ? error : new Error('Failed to update task files');
  }
}

/**
 * Get total file count and size for a task
 */
export async function getTaskFileStats(taskId: string, userId: string): Promise<{
  count: number;
  totalSize: number;
}> {
  try {
    const files = await getTaskFiles(taskId, userId);
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
 * Delete all files for a task (used when deleting a task)
 */
export async function deleteAllTaskFiles(taskId: string, userId: string): Promise<void> {
  try {
    const files = await getTaskFiles(taskId, userId);

    // Delete all files in parallel
    await Promise.all(
      files.map(file => deleteTaskFile(userId, file.id))
    );
  } catch (error) {
throw new Error('Failed to delete task files');
  }
}

/**
 * Update task with attached files
 */
export async function updateTaskAttachedFiles(
  userId: string,
  taskId: string,
  attachedFiles: TaskFile[]
): Promise<void> {
  const db = getDb();

  
  try {
    const taskRef = doc(db, 'tasks', taskId);

    // First verify ownership
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }

    const task = taskDoc.data() as Task;
    if (task.userId !== userId) {
      throw new Error('Access denied');
    }

    
    // Update task with attached files
    await updateDoc(taskRef, {
      attachedFiles,
      updatedAt: serverTimestamp()
    });

      } catch (error) {
throw error instanceof Error ? error : new Error('Failed to update task files');
  }
}

/**
 * Batch upload multiple files for a task
 */
export async function uploadTaskFiles(
  files: File[],
  taskId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<TaskFile[]> {
  const uploadedFiles: TaskFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const uploadedFile = await uploadTaskFile(
        file,
        taskId,
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
    }
  }

  return uploadedFiles;
}

/**
 * Validate file before upload
 */
export function validateTaskFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
    'jpg', 'jpeg', 'png', 'gif', 'txt', 'md', 'zip', 'rar'
  ];

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: 'File size must be less than 10MB'
    };
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File type .${fileExtension} is not allowed`
    };
  }

  return { isValid: true };
}