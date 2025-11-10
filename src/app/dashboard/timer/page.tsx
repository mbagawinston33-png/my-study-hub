"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import TimerDisplay from '@/components/timer/TimerDisplay';
import TimerControls from '@/components/timer/TimerControls';
import TimerStatsDisplay from '@/components/timer/TimerStats';
import TimerSettingsModal from '@/components/timer/TimerSettings';
import { Clock, BarChart3, Settings } from 'lucide-react';

export default function TimerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'timer' | 'stats'>('timer');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        color: 'var(--text-2)'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              <Clock size={32} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
              Study Timer
            </h1>
            <p className="text-gray-600 mt-2">
              Stay focused with the Pomodoro Technique and track your study progress.
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="btn ghost"
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              color: 'var(--text-2)'
            }}
          >
            <Settings size={18} style={{ marginRight: '6px' }} />
            Settings
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setActiveTab('timer')}
          className="btn ghost"
          style={{
            borderRadius: '8px 8px 0 0',
            borderBottom: activeTab === 'timer' ? '2px solid var(--brand)' : '2px solid transparent',
            marginBottom: activeTab === 'timer' ? '-1px' : '0',
            background: activeTab === 'timer' ? 'var(--bg)' : 'transparent',
            color: activeTab === 'timer' ? 'var(--brand)' : 'var(--text-2)'
          }}
        >
          <Clock size={16} style={{ marginRight: '8px' }} />
          Timer
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className="btn ghost"
          style={{
            borderRadius: '8px 8px 0 0',
            borderBottom: activeTab === 'stats' ? '2px solid var(--brand)' : '2px solid transparent',
            marginBottom: activeTab === 'stats' ? '-1px' : '0',
            background: activeTab === 'stats' ? 'var(--bg)' : 'transparent',
            color: activeTab === 'stats' ? 'var(--brand)' : 'var(--text-2)'
          }}
        >
          <BarChart3 size={16} style={{ marginRight: '8px' }} />
          Statistics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'timer' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* Timer Display - Takes more space */}
          <div style={{
            gridColumn: 'span 2',
            minHeight: '300px'
          }}>
            <TimerDisplay />
          </div>

          {/* Timer Controls - Takes less space */}
          <div>
            <TimerControls />
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div>
          <TimerStatsDisplay />
        </div>
      )}

      {/* Quick Tips */}
      <div className="card" style={{
        background: 'var(--brand-50)',
        borderColor: 'var(--brand-200)',
        marginTop: '24px'
      }}>
        <h4 style={{
          color: 'var(--brand-700)',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Settings size={16} />
          Pomodoro Technique Tips
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          fontSize: '14px',
          color: 'var(--brand-600)',
          lineHeight: '1.5'
        }}>
          <div>
            <strong style={{ color: 'var(--brand-700)' }}>🎯 Focus Sessions:</strong>
            <div style={{ marginTop: '4px' }}>
              Work in focused 25-minute intervals. Take breaks between sessions to maintain productivity.
            </div>
          </div>
          <div>
            <strong style={{ color: 'var(--brand-700)' }}>☕ Short Breaks:</strong>
            <div style={{ marginTop: '4px' }}>
              Take 5-minute breaks after each focus session. Stretch, hydrate, or rest your eyes.
            </div>
          </div>
          <div>
            <strong style={{ color: 'var(--brand-700)' }}>🌿 Long Breaks:</strong>
            <div style={{ marginTop: '4px' }}>
              After 4 focus sessions, take a 15-30 minute break to recharge and prevent burnout.
            </div>
          </div>
          <div>
            <strong style={{ color: 'var(--brand-700)' }}>📱 Minimize Distractions:</strong>
            <div style={{ marginTop: '4px' }}>
              Turn off notifications and close unnecessary tabs during focus sessions.
            </div>
          </div>
        </div>
      </div>

      <TimerSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}