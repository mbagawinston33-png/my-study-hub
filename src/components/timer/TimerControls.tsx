"use client";

import React from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { TimerSessionType } from '@/types/timer';
import { Play, Pause, Square, SkipForward, Settings } from 'lucide-react';

export default function TimerControls() {
  const {
    isRunning,
    timeRemaining,
    currentSession,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    skipToNext,
    loading,
    sessionType,
    settings
  } = useTimer();

  const handleStartFocus = async () => {
    await startTimer('focus');
  };

  const handleStartShortBreak = async () => {
    await startTimer('short_break');
  };

  const handleStartLongBreak = async () => {
    await startTimer('long_break');
  };

  const handlePauseResume = async () => {
    if (isRunning) {
      await pauseTimer();
    } else {
      await resumeTimer();
    }
  };

  const handleStop = async () => {
    await stopTimer();
  };

  const handleSkip = async () => {
    await skipToNext();
  };

  // If no session is active, show start buttons
  if (!currentSession || timeRemaining === 0) {
    return (
      <div className="card">
        <h3 style={{ marginBottom: '16px', color: 'var(--text)' }}>Start a Session</h3>

        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <button
            onClick={handleStartFocus}
            disabled={loading}
            className="btn"
            style={{
              background: 'var(--brand)',
              justifyContent: 'center',
              padding: '12px 20px'
            }}
          >
            {loading ? (
              <div className="animate-spin" style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%'
              }} />
            ) : (
              <>
                <Play size={16} style={{ marginRight: '8px' }} />
                Start Focus Session ({Math.floor(settings.focusDuration / 60)} min)
              </>
            )}
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleStartShortBreak}
              disabled={loading}
              className="btn ghost"
              style={{
                color: 'var(--ok)',
                borderColor: 'var(--ok)',
                justifyContent: 'center',
                flex: 1
              }}
            >
              {loading ? (
                <div className="animate-spin" style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid var(--ok)',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%'
                }} />
              ) : (
                <>
                  <Play size={14} style={{ marginRight: '6px' }} />
                  Short Break
                </>
              )}
            </button>

            <button
              onClick={handleStartLongBreak}
              disabled={loading}
              className="btn ghost"
              style={{
                color: '#8B5CF6',
                borderColor: '#8B5CF6',
                justifyContent: 'center',
                flex: 1
              }}
            >
              {loading ? (
                <div className="animate-spin" style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid #8B5CF6',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%'
                }} />
              ) : (
                <>
                  <Play size={14} style={{ marginRight: '6px' }} />
                  Long Break
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If session is active, show control buttons
  return (
    <div className="card">
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <button
          onClick={handlePauseResume}
          disabled={loading}
          className="btn"
          style={{
            background: sessionType === 'focus' ? 'var(--brand)' :
                       sessionType === 'short_break' ? 'var(--ok)' : '#8B5CF6',
            justifyContent: 'center',
            minWidth: '100px'
          }}
        >
          {loading ? (
            <div className="animate-spin" style={{
              width: '16px',
              height: '16px',
              border: '2px solid white',
              borderTop: '2px solid transparent',
              borderRadius: '50%'
            }} />
          ) : isRunning ? (
            <>
              <Pause size={16} style={{ marginRight: '8px' }} />
              Pause
            </>
          ) : (
            <>
              <Play size={16} style={{ marginRight: '8px' }} />
              Resume
            </>
          )}
        </button>

        <button
          onClick={handleSkip}
          disabled={loading}
          className="btn ghost"
          style={{
            color: 'var(--text-2)',
            justifyContent: 'center',
            minWidth: '100px'
          }}
        >
          {loading ? (
            <div className="animate-spin" style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--text-2)',
              borderTop: '2px solid transparent',
              borderRadius: '50%'
            }} />
          ) : (
            <>
              <SkipForward size={16} style={{ marginRight: '8px' }} />
              Skip
            </>
          )}
        </button>

        <button
          onClick={handleStop}
          disabled={loading}
          className="btn ghost"
          style={{
            color: 'var(--danger)',
            borderColor: 'var(--danger)',
            justifyContent: 'center',
            minWidth: '100px'
          }}
        >
          {loading ? (
            <div className="animate-spin" style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--danger)',
              borderTop: '2px solid transparent',
              borderRadius: '50%'
            }} />
          ) : (
            <>
              <Square size={16} style={{ marginRight: '8px' }} />
              Stop
            </>
          )}
        </button>
      </div>

      {currentSession && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--bg-2)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--text-2)'
        }}>
          Session started at {currentSession.startTime.toDate().toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}