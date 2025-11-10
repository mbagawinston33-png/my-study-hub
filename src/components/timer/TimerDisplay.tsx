"use client";

import React from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { getSessionConfig } from '@/types/timer';

export default function TimerDisplay() {
  const {
    timeRemaining,
    isRunning,
    sessionType,
    sessionCount,
    settings,
    formatTimeRemaining,
    getCurrentSessionConfig,
    loading
  } = useTimer();

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', color: 'var(--text-2)' }}>Loading...</div>
      </div>
    );
  }

  const sessionConfig = getCurrentSessionConfig();
  const progress = settings.focusDuration > 0
    ? ((settings.focusDuration - timeRemaining) / settings.focusDuration) * 100
    : 0;

  return (
    <div className="card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Session Type Badge */}
      <div style={{ marginBottom: '16px' }}>
        <span
          className="badge"
          style={{
            background: sessionConfig.bg,
            color: sessionConfig.color,
            borderColor: colorMix(sessionConfig.color, 'var(--border)')
          }}
        >
          <span style={{ marginRight: '6px' }}>{sessionConfig.icon}</span>
          {sessionConfig.label}
        </span>
      </div>

      {/* Timer Display */}
      <div style={{
        fontSize: 'clamp(48px, 8vw, 72px)',
        fontWeight: '600',
        color: sessionConfig.color,
        fontFamily: 'var(--font-geist-mono)',
        marginBottom: '8px',
        lineHeight: '1'
      }}>
        {formatTimeRemaining()}
      </div>

      {/* Session Info */}
      <div style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '20px' }}>
        {isRunning ? (
          <span style={{ color: sessionConfig.color }}>
            ● Session in progress
          </span>
        ) : timeRemaining > 0 ? (
          <span>Session paused</span>
        ) : (
          <span>Session completed</span>
        )}
        {sessionType === 'focus' && (
          <span style={{ marginLeft: '8px' }}>
            • Session {sessionCount}
          </span>
        )}
      </div>

      {/* Progress Ring */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '200px',
        height: '200px',
        zIndex: -1,
        opacity: 0.1
      }}>
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="var(--border)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke={sessionConfig.color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
      </div>
    </div>
  );
}

// Helper function to mix colors (matching existing pattern)
function colorMix(color1: string, color2: string): string {
  // This is a simplified color mixing function
  // In a real implementation, you'd want proper color space conversion
  return color1 + '33'; // Add transparency
}