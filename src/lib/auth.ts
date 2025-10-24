/**
 * Firebase Authentication utilities for MyStudyHub
 * Handles user registration, login, and user management
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

import { getAuthInstance, getDb } from './firebase';
import type {
  RegistrationFormData,
  LoginFormData,
  UserProfile,
  CreateUserData,
  RegistrationResponse,
  LoginResponse,
  User,
  AuthError
} from '@/types/user';
import { AUTH_ERROR_CODES } from '@/types/user';

/**
 * Register new user with email/password and create user profile
 */
export async function registerUser(formData: RegistrationFormData): Promise<RegistrationResponse> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return {
        success: false,
        error: {
          code: 'invalid-email',
          message: 'Please enter a valid email address.',
          field: 'email'
        }
      };
    }

    // Validate password strength
    if (formData.password.length < 6) {
      return {
        success: false,
        error: {
          code: 'weak-password',
          message: 'Password must be at least 6 characters long.',
          field: 'password'
        }
      };
    }

    // Create Firebase Auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      getAuthInstance(),
      formData.email,
      formData.password
    );

    // Create user profile in Firestore
    const userData: CreateUserData = {
      userId: userCredential.user.uid,
      email: formData.email,
      displayName: formData.fullName,
      role: formData.role,
      accountStatus: 'active',
      lastLogin: null,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    // Since we're defaulting all users to students with no additional fields,
    // no role-specific fields are needed for now

    // Save to Firestore
    await setDoc(doc(getDb(), 'users', userCredential.user.uid), userData);

    // Convert to User type for response
    const user: User = {
      userId: userCredential.user.uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      accountStatus: userData.accountStatus
    };

    return {
      success: true,
      user
    };

  } catch (error: unknown) {
    console.error('Registration error:', error);

    // Special handling for permission errors
    if ((error as any).message?.includes('Missing or insufficient permissions')) {
      return {
        success: false,
        error: {
          code: 'permission-denied',
          message: 'Firebase permissions error. Please check Firestore security rules in Firebase Console.',
          field: undefined
        }
      };
    }

    return {
      success: false,
      error: mapFirebaseError(error)
    };
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(formData: LoginFormData): Promise<LoginResponse> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return {
        success: false,
        error: {
          code: 'invalid-email',
          message: 'Please enter a valid email address.',
          field: 'email'
        }
      };
    }

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      getAuthInstance(),
      formData.email,
      formData.password
    );

    // Create a basic user object from Firebase Auth user
    const firebaseUser = userCredential.user;
    const user: User = {
      userId: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      role: 'student', // Default role, will be updated from Firestore when available
      accountStatus: 'active'
    };

    // Try to get user profile from Firestore, but don't fail if it doesn't exist
    try {
      const userDoc = await getDoc(doc(getDb(), 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        user.role = userData.role;
        user.displayName = userData.displayName;

        // Update last login
        await updateDoc(doc(getDb(), 'users', firebaseUser.uid), {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (firestoreError) {
      console.warn('Firestore access failed, using basic auth user:', firestoreError);
      // Continue with basic user object
    }

    return {
      success: true,
      user
    };

  } catch (error: unknown) {
    console.error('Login error:', error);

    return {
      success: false,
      error: mapFirebaseError(error)
    };
  }
}

/**
 * Logout current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(getAuthInstance());
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(getDb(), 'users', uid));

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data() as UserProfile;

    return {
      userId: userData.userId,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      accountStatus: userData.accountStatus,
      photoURL: userData.photoURL,
      ...(userData.studentId && { studentId: userData.studentId }),
      ...(userData.programme && { programme: userData.programme }),
      ...(userData.semester && { semester: userData.semester }),
      ...(userData.phoneNumber && { phoneNumber: userData.phoneNumber }),
      ...(userData.emergencyContact && { emergencyContact: userData.emergencyContact }),
      ...(userData.profilePhotoURL && { profilePhotoURL: userData.profilePhotoURL }),
      ...(userData.trainingStatus && { trainingStatus: userData.trainingStatus }),
      ...(userData.adminPermissions && { adminPermissions: userData.adminPermissions }),
      ...(userData.subjects && { subjects: userData.subjects }),
      ...(userData.department && { department: userData.department })
    };

  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Check if current user is authenticated
 */
export function getCurrentUser(): FirebaseUser | null {
  return getAuthInstance().currentUser;
}

/**
 * Wait for auth state to be ready
 */
export function waitForAuthReady(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = getAuthInstance().onAuthStateChanged((user: FirebaseUser | null) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Update user profile
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<boolean> {
  try {
    const userRef = doc(getDb(), 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

/**
 * Map Firebase errors to user-friendly messages
 */
function mapFirebaseError(error: unknown): AuthError {
  const errorCode = (error as { code?: string }).code || 'unknown-error';

  switch (errorCode) {
    case AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE:
      return {
        code: errorCode,
        message: 'This email address is already registered.',
        field: 'email'
      };

    case AUTH_ERROR_CODES.WEAK_PASSWORD:
      return {
        code: errorCode,
        message: 'Password is too weak. Please choose a stronger password.',
        field: 'password'
      };

    case AUTH_ERROR_CODES.INVALID_EMAIL:
      return {
        code: errorCode,
        message: 'Please enter a valid email address.',
        field: 'email'
      };

    case AUTH_ERROR_CODES.USER_NOT_FOUND:
      return {
        code: errorCode,
        message: 'No account found with this email address.',
        field: 'email'
      };

    case AUTH_ERROR_CODES.WRONG_PASSWORD:
      return {
        code: errorCode,
        message: 'Incorrect password. Please try again.',
        field: 'password'
      };

    case AUTH_ERROR_CODES.TOO_MANY_REQUESTS:
      return {
        code: errorCode,
        message: 'Too many failed attempts. Please try again later.'
      };

    case AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED:
      return {
        code: errorCode,
        message: 'Network error. Please check your internet connection and try again.'
      };

    default:
      return {
        code: errorCode,
        message: (error as { message?: string }).message || 'An unexpected error occurred. Please try again.'
      };
  }
}