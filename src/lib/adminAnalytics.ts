import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  sum,
  orderBy,
  limit
} from "firebase/firestore";
import { getDb } from "./firebase";
import { AdminDashboardStats } from "@/types/admin";

/**
 * Get the total number of registered students
 */
export async function getTotalStudentCount(): Promise<number> {
  try {
    const db = getDb();
    const studentsQuery = query(
      collection(db, "users"),
      where("role", "==", "student")
    );
    const snapshot = await getDocs(studentsQuery);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting student count:", error);
    throw error;
  }
}

/**
 * Get the total number of files uploaded across all students
 */
export async function getTotalFileCount(): Promise<number> {
  try {
    const db = getDb();
    const filesSnapshot = await getDocs(collection(db, "subjectFiles"));
    return filesSnapshot.size;
  } catch (error) {
    console.error("Error getting total file count:", error);
    throw error;
  }
}

/**
 * Get the total storage used by all files
 */
export async function getTotalStorageUsed(): Promise<number> {
  try {
    const db = getDb();
    const filesSnapshot = await getDocs(collection(db, "subjectFiles"));
    let totalSize = 0;

    filesSnapshot.forEach((doc) => {
      const data = doc.data();
      totalSize += data.size || 0;
    });

    return totalSize;
  } catch (error) {
    console.error("Error getting total storage used:", error);
    throw error;
  }
}

/**
 * Get storage usage breakdown by user
 */
export async function getStorageUsageByUser(): Promise<Array<{
  userId: string;
  userEmail: string;
  storageUsed: number;
  fileCount: number;
}>> {
  try {
    const db = getDb();
    // Get all subject files
    const filesSnapshot = await getDocs(collection(db, "subjectFiles"));
    const userStorageMap = new Map<string, { storageUsed: number; fileCount: number }>();

    // Aggregate storage by user
    filesSnapshot.forEach((doc) => {
      const data = doc.data();
      const userId = data.userId;
      const fileSize = data.size || 0;

      if (!userStorageMap.has(userId)) {
        userStorageMap.set(userId, { storageUsed: 0, fileCount: 0 });
      }

      const current = userStorageMap.get(userId)!;
      current.storageUsed += fileSize;
      current.fileCount += 1;
    });

    // Get user emails for the storage data
    const storageData = await Promise.all(
      Array.from(userStorageMap.entries()).map(async ([userId, storage]) => {
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          const userEmail = userDoc.exists() ? userDoc.data().email : "Unknown User";

          return {
            userId,
            userEmail,
            storageUsed: storage.storageUsed,
            fileCount: storage.fileCount,
          };
        } catch (error) {
          console.error(`Error getting user data for ${userId}:`, error);
          return {
            userId,
            userEmail: "Unknown User",
            storageUsed: storage.storageUsed,
            fileCount: storage.fileCount,
          };
        }
      })
    );

    // Sort by storage used (descending)
    storageData.sort((a, b) => b.storageUsed - a.storageUsed);

    return storageData;
  } catch (error) {
    console.error("Error getting storage usage by user:", error);
    throw error;
  }
}

/**
 * Get comprehensive admin dashboard statistics
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const [totalStudents, totalFiles, totalStorageUsed, storageUsedByUser] = await Promise.all([
      getTotalStudentCount(),
      getTotalFileCount(),
      getTotalStorageUsed(),
      getStorageUsageByUser(),
    ]);

    return {
      totalStudents,
      totalFiles,
      totalStorageUsed,
      storageUsedByUser,
    };
  } catch (error) {
    console.error("Error getting admin dashboard stats:", error);
    throw error;
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get file type distribution statistics
 */
export async function getFileTypeDistribution(): Promise<Array<{ type: string; count: number; size: number }>> {
  try {
    const db = getDb();
    const filesSnapshot = await getDocs(collection(db, "subjectFiles"));
    const typeMap = new Map<string, { count: number; size: number }>();

    filesSnapshot.forEach((doc) => {
      const data = doc.data();
      const fileType = data.type || "unknown";
      const fileSize = data.size || 0;

      if (!typeMap.has(fileType)) {
        typeMap.set(fileType, { count: 0, size: 0 });
      }

      const current = typeMap.get(fileType)!;
      current.count += 1;
      current.size += fileSize;
    });

    const distribution = Array.from(typeMap.entries()).map(([type, stats]) => ({
      type,
      count: stats.count,
      size: stats.size,
    }));

    // Sort by count (descending)
    distribution.sort((a, b) => b.count - a.count);

    return distribution;
  } catch (error) {
    console.error("Error getting file type distribution:", error);
    throw error;
  }
}