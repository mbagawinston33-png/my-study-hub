"use client";

import React, { useState } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { TimerSettingsFormData } from '@/types/timer';
import Modal from '@/components/ui/Modal';
import { Clock, Coffee, Zap, Bell } from 'lucide-react';

interface TimerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimerSettingsModal({ isOpen, onClose }: TimerSettingsModalProps) {
  const { settings, updateSettings, loading } = useTimer();
  const [formData, setFormData] = useState<TimerSettingsFormData>({
    focusDuration: Math.floor(settings.focusDuration / 60),
    shortBreakDuration: Math.floor(settings.shortBreakDuration / 60),
    longBreakDuration: Math.floor(settings.longBreakDuration / 60),
    longBreakInterval: settings.longBreakInterval,
    autoStartBreaks: settings.autoStartBreaks,
    autoStartPomodoros: settings.autoStartPomodoros,
    soundEnabled: settings.soundEnabled,
    desktopNotifications: settings.desktopNotifications,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.focusDuration < 1 || formData.focusDuration > 120) {
      newErrors.focusDuration = 'Focus duration must be between 1 and 120 minutes';
    }

    if (formData.shortBreakDuration < 1 || formData.shortBreakDuration > 30) {
      newErrors.shortBreakDuration = 'Short break must be between 1 and 30 minutes';
    }

    if (formData.longBreakDuration < 1 || formData.longBreakDuration > 60) {
      newErrors.longBreakDuration = 'Long break must be between 1 and 60 minutes';
    }

    if (formData.longBreakInterval < 2 || formData.longBreakInterval > 10) {
      newErrors.longBreakInterval = 'Long break interval must be between 2 and 10 sessions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TimerSettingsFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: keyof TimerSettingsFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate field on blur
    const newErrors: Record<string, string> = {};

    switch (field) {
      case 'focusDuration':
        if (formData.focusDuration < 1 || formData.focusDuration > 120) {
          newErrors.focusDuration = 'Must be between 1 and 120 minutes';
        }
        break;
      case 'shortBreakDuration':
        if (formData.shortBreakDuration < 1 || formData.shortBreakDuration > 30) {
          newErrors.shortBreakDuration = 'Must be between 1 and 30 minutes';
        }
        break;
      case 'longBreakDuration':
        if (formData.longBreakDuration < 1 || formData.longBreakDuration > 60) {
          newErrors.longBreakDuration = 'Must be between 1 and 60 minutes';
        }
        break;
      case 'longBreakInterval':
        if (formData.longBreakInterval < 2 || formData.longBreakInterval > 10) {
          newErrors.longBreakInterval = 'Must be between 2 and 10 sessions';
        }
        break;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updateSettings({
        focusDuration: formData.focusDuration * 60,
        shortBreakDuration: formData.shortBreakDuration * 60,
        longBreakDuration: formData.longBreakDuration * 60,
        longBreakInterval: formData.longBreakInterval,
        autoStartBreaks: formData.autoStartBreaks,
        autoStartPomodoros: formData.autoStartPomodoros,
        soundEnabled: formData.soundEnabled,
        desktopNotifications: formData.desktopNotifications,
      });

      onClose();
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      // Reset form data
      setFormData({
        focusDuration: Math.floor(settings.focusDuration / 60),
        shortBreakDuration: Math.floor(settings.shortBreakDuration / 60),
        longBreakDuration: Math.floor(settings.longBreakDuration / 60),
        longBreakInterval: settings.longBreakInterval,
        autoStartBreaks: settings.autoStartBreaks,
        autoStartPomodoros: settings.autoStartPomodoros,
        soundEnabled: settings.soundEnabled,
        desktopNotifications: settings.desktopNotifications,
      });
      setErrors({});
      setTouched({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Timer Settings"
      size="medium"
      showCloseButton={true}
      closeOnBackdropClick={!loading}
      closeOnEscape={!loading}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Duration Settings */}
        <div>
          <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>Session Durations</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text)'
              }}>
                <Clock size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Focus Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.focusDuration}
                onChange={(e) => handleInputChange('focusDuration', parseInt(e.target.value) || 1)}
                onBlur={() => handleBlur('focusDuration')}
                className={errors.focusDuration && touched.focusDuration ? 'error' : ''}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.focusDuration && touched.focusDuration ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--bg)',
                  color: 'var(--text)'
                }}
              />
              {errors.focusDuration && touched.focusDuration && (
                <div style={{
                  color: 'var(--danger)',
                  fontSize: '12px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>⚠️</span>
                  {errors.focusDuration}
                </div>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text)'
              }}>
                <Coffee size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Short Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.shortBreakDuration}
                onChange={(e) => handleInputChange('shortBreakDuration', parseInt(e.target.value) || 1)}
                onBlur={() => handleBlur('shortBreakDuration')}
                className={errors.shortBreakDuration && touched.shortBreakDuration ? 'error' : ''}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.shortBreakDuration && touched.shortBreakDuration ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--bg)',
                  color: 'var(--text)'
                }}
              />
              {errors.shortBreakDuration && touched.shortBreakDuration && (
                <div style={{
                  color: 'var(--danger)',
                  fontSize: '12px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>⚠️</span>
                  {errors.shortBreakDuration}
                </div>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text)'
              }}>
                <Zap size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Long Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.longBreakDuration}
                onChange={(e) => handleInputChange('longBreakDuration', parseInt(e.target.value) || 1)}
                onBlur={() => handleBlur('longBreakDuration')}
                className={errors.longBreakDuration && touched.longBreakDuration ? 'error' : ''}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.longBreakDuration && touched.longBreakDuration ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--bg)',
                  color: 'var(--text)'
                }}
              />
              {errors.longBreakDuration && touched.longBreakDuration && (
                <div style={{
                  color: 'var(--danger)',
                  fontSize: '12px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>⚠️</span>
                  {errors.longBreakDuration}
                </div>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text)'
              }}>
                Long Break Interval (sessions)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={formData.longBreakInterval}
                onChange={(e) => handleInputChange('longBreakInterval', parseInt(e.target.value) || 4)}
                onBlur={() => handleBlur('longBreakInterval')}
                className={errors.longBreakInterval && touched.longBreakInterval ? 'error' : ''}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.longBreakInterval && touched.longBreakInterval ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--bg)',
                  color: 'var(--text)'
                }}
              />
              {errors.longBreakInterval && touched.longBreakInterval && (
                <div style={{
                  color: 'var(--danger)',
                  fontSize: '12px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>⚠️</span>
                  {errors.longBreakInterval}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Behavior Settings */}
        <div>
          <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>Behavior</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}>
              <input
                type="checkbox"
                checked={formData.autoStartBreaks}
                onChange={(e) => handleInputChange('autoStartBreaks', e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                Auto-start breaks after focus sessions
              </span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}>
              <input
                type="checkbox"
                checked={formData.autoStartPomodoros}
                onChange={(e) => handleInputChange('autoStartPomodoros', e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                Auto-start focus sessions after breaks
              </span>
            </label>
          </div>
        </div>

        {/* Notification Settings */}
        <div>
          <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>
            <Bell size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Notifications
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}>
              <input
                type="checkbox"
                checked={formData.soundEnabled}
                onChange={(e) => handleInputChange('soundEnabled', e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                Play sound when session completes
              </span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}>
              <input
                type="checkbox"
                checked={formData.desktopNotifications}
                onChange={(e) => handleInputChange('desktopNotifications', e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                Show desktop notifications
              </span>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          paddingTop: '8px'
        }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="btn ghost"
            style={{ minWidth: '80px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn"
            style={{ minWidth: '100px' }}
          >
            {loading ? (
              <div className="animate-spin" style={{
                width: '14px',
                height: '14px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                margin: '0 auto'
              }} />
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}