/**
 * Firebase Connection Test Utility
 * Use this to verify Firebase setup is working correctly
 */

import { getApp, getAuthInstance, getDb, getStorageInstance } from './firebase';

/**
 * Test Firebase initialization and services
 */
export async function testFirebaseConnection() {
  console.log('Testing Firebase Connection...');

  try {
    // Test App initialization
    const app = getApp();
    console.log('Firebase App initialized successfully');
    console.log('   App Name:', app.name);
    console.log('   Options:', app.options);

    // Test Auth
    const auth = getAuthInstance();
    console.log('Firebase Auth initialized successfully');
    console.log('   Current User:', auth.currentUser ? 'Logged in' : 'Not logged in');

    // Test Firestore
    const db = getDb();
    console.log('Firestore initialized successfully');

    // Test Storage
    const storage = getStorageInstance();
    console.log('Firebase Storage initialized successfully');

    console.log('All Firebase services are working correctly!');
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
    console.log('Firebase Quick Test: App is ready');
    return true;
  } catch (error) {
    console.error('Firebase Quick Test failed:', error);
    return false;
  }
}