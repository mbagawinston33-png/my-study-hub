'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, logoutUser } from '@/lib/auth';
import type { User, AuthState, UserRole } from '@/types/user';

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isStudent: () => boolean;
  isTeacher: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userProfile = await getUserProfile(firebaseUser.uid);

          if (userProfile) {
            setAuthState({
              user: userProfile,
              loading: false,
              error: null
            });
          } else {
            // User exists in Firebase Auth but not in Firestore
            setAuthState({
              user: null,
              loading: false,
              error: 'User profile not found. Please contact admin.'
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setAuthState({
            user: null,
            loading: false,
            error: 'Failed to load user profile. Please try again.'
          });
        }
      } else {
        // User is not authenticated
        setAuthState({
          user: null,
          loading: false,
          error: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Login function (called after successful authentication)
  const login = (user: User) => {
    setAuthState({
      user,
      loading: false,
      error: null
    });
  };

  // Logout function
  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await logoutUser();
      setAuthState({
        user: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to logout. Please try again.'
      }));
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!authState.user) return;

    try {
      const userProfile = await getUserProfile(authState.user.userId);
      if (userProfile) {
        setAuthState(prev => ({ ...prev, user: userProfile }));
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  // Role checking utilities
  const hasRole = (role: UserRole): boolean => {
    return authState.user?.role === role;
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isStudent = (): boolean => {
    return hasRole('student');
  };

  const isTeacher = (): boolean => {
    return hasRole('teacher');
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshUser,
    hasRole,
    isAdmin,
    isStudent,
    isTeacher
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}