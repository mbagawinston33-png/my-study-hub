/**
 * Firebase Configuration for MyStudyHub
 * Optimized for Vercel serverless environment
 */

import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { Firestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB5k_IIZKRdFghs2THwmvk_G2ECIOWFuFg',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'my-study-hub-346c2.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'my-study-hub-346c2',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'my-study-hub-346c2.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '670327121037',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:670327121037:web:0f394a039d6f1a091f2ec4',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-VGZS2J5785',
};

// Singleton pattern to prevent multiple Firebase instances
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any = null; // Firebase app type is not exported, so we use any
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

/**
 * Initialize Firebase services with singleton pattern
 * This prevents multiple app initializations in serverless environment
 */
function initializeFirebase() {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === 'app/duplicate-app') {
        // If app already exists (can happen in hot reload), get existing instance
        app = initializeApp(firebaseConfig, 'my-study-hub-standalone');
        console.log('Firebase standalone instance created');
      } else {
        console.error('Firebase initialization error:', error);
        throw error;
      }
    }
  }

  if (!auth) {
    auth = getAuth(app);
  }

  if (!db) {
    // Enhanced Firestore initialization for serverless compatibility
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true, // Force long polling instead of WebChannel
    });

    console.log('Firestore initialized with serverless optimizations');
  }

  if (!storage) {
    storage = getStorage(app);
  }

  return { app, auth, db, storage };
}

// Initialize Firebase immediately
const firebaseServices = initializeFirebase();

// Export getters that ensure non-null values
export function getApp() {
  if (!app) throw new Error('Firebase app not initialized');
  return app;
}

export function getAuthInstance() {
  if (!auth) throw new Error('Firebase auth not initialized');
  return auth;
}

export function getDb() {
  if (!db) throw new Error('Firestore not initialized');
  return db;
}

export function getStorageInstance() {
  if (!storage) throw new Error('Firebase storage not initialized');
  return storage;
}

// Legacy exports (use getters above for new code)
export { app, auth, db, storage };
export default firebaseServices;