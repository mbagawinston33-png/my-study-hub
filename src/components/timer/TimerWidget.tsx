"use client";

import React, { useState } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import TimerSettingsModal from './TimerSettings';
import { Clock, Play, Settings } from 'lucide-react';

export default function TimerWidget() {
  const {
    timeRemaining,
    isRunning,
    sessionType,
    currentSession,
    formatTimeRemaining,
    getCurrentSessionConfig,
    isSessionActive,
    startTimer,
    loading,
    stats,
    settings
  } = useTimer();

  const [showSettings, setShowSettings] = useState(false);

  const handleQuickStart = async () => {
    await startTimer('focus');
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Clock size={20} style={{ color: 'var(--text-2)' }} />
          <span style={{ color: 'var(--text-2)' }}>Loading timer...</span>
        </div>
      </div>
    );
  }

  const sessionConfig = getCurrentSessionConfig();

  return (
    <>
      <div className="card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px'
        }}>
          <h3 style={{ margin: 0, color: 'var(--text)' }}>
            <Clock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Study Timer
          </h3>
          <button
            onClick={() => setShowSettings(true)}
            className="btn ghost"
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              color: 'var(--text-2)'
            }}
          >
            <Settings size={14} />
          </button>
        </div>

        {isSessionActive() ? (
          // Active session display
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <span
                className="badge"
                style={{
                  background: sessionConfig.bg,
                  color: sessionConfig.color,
                  borderColor: colorMix(sessionConfig.color, 'var(--border)'),
                  fontSize: '11px'
                }}
              >
                {sessionConfig.icon} {sessionConfig.label}
              </span>
              <span style={{
                fontSize: '12px',
                color: 'var(--text-2)'
              }}>
                {isRunning ? '● Running' : '⏸ Paused'}
              </span>
            </div>

            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              color: sessionConfig.color,
              fontFamily: 'var(--font-geist-mono)',
              marginBottom: '8px'
            }}>
              {formatTimeRemaining()}
            </div>

            <div style={{
              fontSize: '11px',
              color: 'var(--text-2)',
              lineHeight: '1.4'
            }}>
              {sessionType === 'focus' && currentSession && (
                <>Focus Session {currentSession.sessionNumber}</>
              )}
              {currentSession && (
                <> • Started {currentSession.startTime.toDate().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</>
              )}
            </div>
          </div>
        ) : (
          // Inactive session display
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: 'var(--text)',
                  marginBottom: '4px'
                }}>
                  Ready to focus?
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-2)'
                }}>
                  {stats && stats.completedToday > 0
                    ? `${stats.completedToday} session${stats.completedToday !== 1 ? 's' : ''} completed today`
                    : 'Start your first session'}
                </div>
              </div>

              <div style={{
                fontSize: '24px',
                fontWeight: '600',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-geist-mono)'
              }}>
                {Math.floor(settings.focusDuration / 60).toString().padStart(2, '0')}:{(settings.focusDuration % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <button
              onClick={handleQuickStart}
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'center',
                fontSize: '14px',
                padding: '10px'
              }}
            >
              <Play size={16} style={{ marginRight: '8px' }} />
              Start Focus Session
            </button>
          </div>
        )}

        {/* Quick Stats */}
        {stats && (
          <div style={{
            marginTop: '12px',
            padding: '8px 0',
            borderTop: '1px solid var(--border)',
            fontSize: '11px',
            color: 'var(--text-2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              {Math.floor(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}m this week
            </span>
            {stats.currentStreak > 0 && (
              <span>
                🔥 {stats.currentStreak} day streak
              </span>
            )}
          </div>
        )}
      </div>

      <TimerSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

// Helper function to mix colors (matching existing pattern)
function colorMix(color1: string, color2: string): string {
  // This is a simplified color mixing function
  // In a real implementation, you'd want proper color space conversion
  return color1 + '33'; // Add transparency
}