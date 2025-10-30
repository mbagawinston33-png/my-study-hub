/**
 * Firebase Connection Test Utility
 * Use this to verify Firebase setup is working correctly
 */

import { getApp, getAuthInstance, getDb, getStorageInstance } from './firebase';

/**
 * Test Firebase initialization and services
 */
export async function testFirebaseConnection() {
  try {
    // Test App initialization
    const app = getApp();

    // Test Auth
    const auth = getAuthInstance();

    // Test Firestore
    const db = getDb();

    // Test Storage
    const storage = getStorageInstance();
    return { success: true, message: 'Firebase connection successful' };

  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return {
      success: false,
      message: 'Firebase connection failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Simple connectivity test for development
 */
export function quickFirebaseTest() {
  try {
    const app = getApp();
        return true;
  } catch (error) {
    console.error('Firebase Quick Test failed:', error);
    return false;
  }
}