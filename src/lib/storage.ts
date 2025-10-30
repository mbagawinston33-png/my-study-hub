/**
 * Firebase Storage utilities for MyStudyHub
 * Handles file upload, download, and management operations
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
  SubjectFile,
  FileType,
  Subject
} from '@/types/subject';
import {
  generateSafeFilename,
  getStoragePath,
  createSubjectFileData
} from '@/lib/fileUtils';

/**
 * Uploads a file to Firebase Storage and creates Firestore record
 */
export async function uploadFile(
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

    // Create file data
    const fileData = createSubjectFileData(
      file,
      subjectId,
      userId,
      downloadURL,
      storagePath
    );

    // Save to Firestore
    const fileDoc = {
      ...fileData,
      id: fileId,
      uploadedAt: serverTimestamp()
    } as Omit<SubjectFile, 'uploadedAt'> & { uploadedAt: any };

    await setDoc(doc(db, 'subjectFiles', fileId), fileDoc);

    // Get the complete document with timestamp
    const fileDocSnapshot = await getDoc(doc(db, 'subjectFiles', fileId));

    if (!fileDocSnapshot.exists()) {
      throw new Error('Failed to save file metadata');
    }

    const completeFileData = {
      id: fileDocSnapshot.id,
      ...fileDocSnapshot.data()
    } as SubjectFile;

    // Update subject file count
    await updateSubjectFileCount(subjectId);

    return completeFileData;

  } catch (error) {
throw error;
  }
}

/**
 * Deletes a file from both Storage and Firestore
 */
export async function deleteFile(fileId: string, subjectId: string): Promise<void> {
  const storage = getStorageInstance();
  const db = getDb();

  try {
    // Get file data from Firestore
    const fileDoc = await getDoc(doc(db, 'subjectFiles', fileId));
    if (!fileDoc.exists()) {
      throw new Error('File not found in database');
    }

    const fileData = fileDoc.data() as SubjectFile;

    // Delete from Storage
    const storageRef = ref(storage, fileData.storagePath);
    await deleteObject(storageRef);

    // Delete from Firestore
    await deleteDoc(doc(db, 'subjectFiles', fileId));

    // Update subject file count
    await updateSubjectFileCount(subjectId);

    
  } catch (error) {
throw error;
  }
}

/**
 * Gets all files for a subject
 */
export async function getSubjectFiles(subjectId: string): Promise<SubjectFile[]> {
  const db = getDb();

  try {
    const filesQuery = query(
      collection(db, 'subjectFiles'),
      where('subjectId', '==', subjectId),
      orderBy('uploadedAt', 'desc')
    );

    const querySnapshot = await getDocs(filesQuery);
    const files: SubjectFile[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      files.push({
        id: doc.id,
        subjectId: data.subjectId,
        userId: data.userId,
        name: data.name,
        originalName: data.originalName,
        type: data.type,
        size: data.size,
        url: data.url,
        storagePath: data.storagePath,
        description: data.description,
        isVerified: data.isVerified,
        uploadedAt: data.uploadedAt,
      });
    });

    return files;

  } catch (error) {
return [];
  }
}

/**
 * Updates file metadata (description, verification status, etc.)
 */
export async function updateFileMetadata(
  fileId: string,
  updates: Partial<Pick<SubjectFile, 'description' | 'isVerified'>>
): Promise<void> {
  const db = getDb();

  try {
    const fileRef = doc(db, 'subjectFiles', fileId);
    await updateDoc(fileRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    
  } catch (error) {
throw error;
  }
}

/**
 * Updates the file count for a subject
 */
async function updateSubjectFileCount(subjectId: string): Promise<void> {
  const db = getDb();

  try {
    // Count files for this subject
    const filesQuery = query(
      collection(db, 'subjectFiles'),
      where('subjectId', '==', subjectId)
    );

    const querySnapshot = await getDocs(filesQuery);
    const fileCount = querySnapshot.size;

    // Update subject document
    const subjectRef = doc(db, 'subjects', subjectId);
    await updateDoc(subjectRef, {
      fileCount,
      updatedAt: serverTimestamp()
    });

  } catch (error) {
// Don't throw error here as it's not critical
  }
}

/**
 * Gets file metadata from Firebase Storage
 */
export async function getFileMetadata(storagePath: string) {
  const storage = getStorageInstance();
  const storageRef = ref(storage, storagePath);

  try {
    const metadata = await getMetadata(storageRef);
    return metadata;
  } catch (error) {
throw error;
  }
}

/**
 * Refreshes download URLs for files (useful if URLs expire)
 */
export async function refreshFileURL(fileId: string): Promise<string> {
  const storage = getStorageInstance();
  const db = getDb();

  try {
    // Get file data
    const fileDoc = await getDoc(doc(db, 'subjectFiles', fileId));
    if (!fileDoc.exists()) {
      throw new Error('File not found');
    }

    const fileData = fileDoc.data() as SubjectFile;

    // Get new download URL
    const storageRef = ref(storage, fileData.storagePath);
    const newURL = await getDownloadURL(storageRef);

    // Update in Firestore
    await updateDoc(doc(db, 'subjectFiles', fileId), {
      url: newURL,
      updatedAt: serverTimestamp()
    });

    return newURL;

  } catch (error) {
throw error;
  }
}

/**
 * Gets total storage usage for a user
 */
export async function getUserStorageUsage(userId: string): Promise<number> {
  const db = getDb();

  try {
    // Get all files for user
    const filesQuery = query(
      collection(db, 'subjectFiles'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(filesQuery);
    let totalSize = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data() as SubjectFile;
      totalSize += data.size;
    });

    return totalSize;

  } catch (error) {
return 0;
  }
}

/**
 * Deletes all files for a subject (when subject is deleted)
 */
export async function deleteAllSubjectFiles(subjectId: string): Promise<void> {
  const db = getDb();
  const storage = getStorageInstance();

  try {
    // Get all files for subject
    const filesQuery = query(
      collection(db, 'subjectFiles'),
      where('subjectId', '==', subjectId)
    );

    const querySnapshot = await getDocs(filesQuery);

    // Delete each file
    const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
      const fileData = docSnapshot.data() as SubjectFile;

      // Delete from Storage
      try {
        const storageRef = ref(storage, fileData.storagePath);
        await deleteObject(storageRef);
      } catch (error) {
}

      // Delete from Firestore
      return deleteDoc(docSnapshot.ref);
    });

    await Promise.all(deletePromises);

    
  } catch (error) {
throw error;
  }
}

/**
 * Checks if user has permission to access a file
 */
export async function verifyFileAccess(fileId: string, userId: string): Promise<boolean> {
  const db = getDb();

  try {
    const fileDoc = await getDoc(doc(db, 'subjectFiles', fileId));
    if (!fileDoc.exists()) {
      return false;
    }

    const fileData = fileDoc.data() as SubjectFile;
    return fileData.userId === userId;

  } catch (error) {
return false;
  }
}

/**
 * Get all subjects for a user
 */
export async function getUserSubjects(userId: string): Promise<Subject[]> {
  const db = getDb();

  try {
    const subjectsQuery = query(
      collection(db, 'subjects'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(subjectsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subject[];
  } catch (error) {
return [];
  }
}