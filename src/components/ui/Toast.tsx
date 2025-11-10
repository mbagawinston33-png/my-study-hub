"use client";

import React from 'react';
import { CheckCircle, Clock, Coffee, Zap } from 'lucide-react';

export interface ToastProps {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ type, title, message, duration = 4000, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#D1FAE5',
          color: '#10B981',
          borderColor: '#10B98133',
          icon: CheckCircle
        };
      case 'info':
        return {
          bg: '#DBEAFE',
          color: '#3B82F6',
          borderColor: '#3B82F633',
          icon: Clock
        };
      case 'warning':
        return {
          bg: '#FEF3C7',
          color: '#F59E0B',
          borderColor: '#F59E0B33',
          icon: Coffee
        };
      case 'error':
        return {
          bg: '#FEE2E2',
          color: '#EF4444',
          borderColor: '#EF444433',
          icon: Zap
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        minWidth: '300px',
        maxWidth: '400px',
        background: config.bg,
        border: `1px solid ${config.borderColor}`,
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
        padding: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        animation: 'slideInRight 0.3s ease-out',
        transition: 'all 0.3s ease'
      }}
    >
      <div
        style={{
          color: config.color,
          flexShrink: 0,
          marginTop: '2px'
        }}
      >
        <Icon size={20} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: config.color,
            marginBottom: message ? '4px' : '0'
          }}
        >
          {title}
        </div>
        {message && (
          <div
            style={{
              fontSize: '13px',
              color: '#374151',
              lineHeight: '1.4'
            }}
          >
            {message}
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#6B7280',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#F3F4F6';
          e.currentTarget.style.color = '#374151';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.color = '#6B7280';
        }}
      >
        ×
      </button>
    </div>
  );
}