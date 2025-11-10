"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastProps } from '@/components/ui/Toast';

interface ToastItem extends Omit<ToastProps, 'onClose'> {
  id: string;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'onClose'>) => void;
  showSuccessToast: (title: string, message?: string) => void;
  showInfoToast: (title: string, message?: string) => void;
  showWarningToast: (title: string, message?: string) => void;
  showErrorToast: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastItem = {
      ...toast,
      id
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration if provided
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 4000);
    }
  }, [removeToast]);

  const showSuccessToast = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const showInfoToast = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  const showWarningToast = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);

  const showErrorToast = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message, duration: 6000 }); // Error messages stay longer
  }, [showToast]);

  const value: ToastContextType = {
    showToast,
    showSuccessToast,
    showInfoToast,
    showWarningToast,
    showErrorToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <Toast
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}