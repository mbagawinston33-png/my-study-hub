"use client";

import React from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { TimerStats } from '@/types/timer';
import { Clock, TrendingUp, Target, Flame, Calendar } from 'lucide-react';

export default function TimerStatsDisplay() {
  const { stats, loading } = useTimer();

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', color: 'var(--text-2)' }}>
          Loading statistics...
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', color: 'var(--text-2)' }}>
          No statistics available yet. Start your first session!
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '20px', color: 'var(--text)' }}>
        <TrendingUp size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Study Statistics
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Total Study Time */}
        <div style={{
          textAlign: 'center',
          padding: '16px',
          background: 'var(--bg-2)',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '600',
            color: 'var(--brand)',
            marginBottom: '4px'
          }}>
            {Math.floor(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}m
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
            Total Study Time
          </div>
        </div>

        {/* Total Sessions */}
        <div style={{
          textAlign: 'center',
          padding: '16px',
          background: 'var(--bg-2)',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '600',
            color: 'var(--ok)',
            marginBottom: '4px'
          }}>
            {stats.totalSessions}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
            Total Sessions
          </div>
        </div>

        {/* This Week */}
        <div style={{
          textAlign: 'center',
          padding: '16px',
          background: 'var(--bg-2)',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#8B5CF6',
            marginBottom: '4px'
          }}>
            {stats.completedThisWeek}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
            This Week
          </div>
        </div>

        {/* Current Streak */}
        {stats.currentStreak > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '16px',
            background: 'var(--bg-2)',
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#F59E0B',
              marginBottom: '4px'
            }}>
              <Flame size={20} style={{ verticalAlign: 'middle' }} /> {stats.currentStreak}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
              Day Streak
            </div>
          </div>
        )}
      </div>

      {/* Detailed Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {/* Average Session Length */}
        <div style={{
          padding: '12px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3B82F6',
            flexShrink: 0
          }}>
            <Clock size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text)',
              marginBottom: '2px'
            }}>
              Avg Session
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
              {stats.averageSessionLength} minutes
            </div>
          </div>
        </div>

        {/* Most Productive Hour */}
        <div style={{
          padding: '12px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#FDE047',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#CA8A04',
            flexShrink: 0
          }}>
            <Target size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text)',
              marginBottom: '2px'
            }}>
              Peak Time
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
              {stats.mostProductiveHour}:00
            </div>
          </div>
        </div>

        {/* Today's Progress */}
        <div style={{
          padding: '12px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#D1FAE5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10B981',
            flexShrink: 0
          }}>
            <Calendar size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text)',
              marginBottom: '2px'
            }}>
              Today
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
              {stats.completedToday} session{stats.completedToday !== 1 ? 's' : ''} completed
            </div>
          </div>
        </div>

        {/* Weekly Goal Progress */}
        <div style={{
          padding: '12px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#EDE9FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8B5CF6',
            flexShrink: 0
          }}>
            <TrendingUp size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text)',
              marginBottom: '2px'
            }}>
              Weekly Goal
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
              {stats.completedThisWeek}/{stats.weeklyGoal} sessions
            </div>
            {/* Progress bar */}
            <div style={{
              height: '4px',
              background: 'var(--bg-2)',
              borderRadius: '2px',
              marginTop: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min((stats.completedThisWeek / stats.weeklyGoal) * 100, 100)}%`,
                background: '#8B5CF6',
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Break Statistics */}
      {stats.totalBreakTime > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--bg-2)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--text-2)',
          textAlign: 'center'
        }}>
          Total break time: {Math.floor(stats.totalBreakTime / 60)}h {stats.totalBreakTime % 60}m
          {' • '}
          Focus-to-break ratio: {stats.totalStudyTime > 0
            ? (stats.totalStudyTime / stats.totalBreakTime).toFixed(1)
            : 'N/A'
          }:1
        </div>
      )}
    </div>
  );
}