"use client";

import { useState } from 'react';
import { Check, X, Edit, Clock, AlertCircle } from 'lucide-react';
import { Reminder } from '@/types/reminder';
import { toggleReminderCompletion, deleteReminder } from '@/lib/reminders';
import { useAuth } from '@/contexts/AuthContext';

interface ReminderCardProps {
  reminder: Reminder;
  onUpdate?: (reminder: Reminder) => void;
  onDelete?: (reminderId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function ReminderCard({
  reminder,
  onUpdate,
  onDelete,
  showActions = true,
  compact = false
}: ReminderCardProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleComplete = async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      const updatedReminder = await toggleReminderCompletion(user.userId, reminder.id);
      onUpdate?.(updatedReminder);
    } catch (error) {
} finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || isLoading) return;

    if (!confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteReminder(user.userId, reminder.id);
      onDelete?.(reminder.id);
    } catch (error) {
} finally {
      setIsLoading(false);
    }
  };

  
  const formatDueDate = (date: any) => {
    const dueDate = date.toDate();
    const now = new Date();
    const isOverdue = dueDate < now && !reminder.isCompleted;
    const isToday = dueDate.toDateString() === now.toDateString();
    const isTomorrow = dueDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    const isThisWeek = !isToday && !isTomorrow && (dueDate.getTime() - now.getTime()) <= 7 * 24 * 60 * 60 * 1000;

    let dateText = '';
    let timeText = dueDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) {
      dateText = 'Today';
    } else if (isTomorrow) {
      dateText = 'Tomorrow';
    } else if (isThisWeek) {
      dateText = dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      dateText = dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }

    return { dateText, timeText, isOverdue, isToday, isTomorrow };
  };

  const getUrgencyIndicator = () => {
    const dueDate = reminder.dueDate.toDate();
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (reminder.isCompleted) return null;
    if (hoursUntilDue < 0) return { color: 'var(--danger)', text: 'Overdue' };
    if (hoursUntilDue < 24) return { color: 'var(--warn)', text: 'Due Today' };
    if (hoursUntilDue < 48) return { color: '#f59e0b', text: 'Due Tomorrow' };
    if (hoursUntilDue < 168) return { color: 'var(--ok)', text: 'This Week' };
    return null;
  };

  const getSmartCategory = () => {
    const text = `${reminder.title} ${reminder.description || ''}`.toLowerCase();

    if (text.includes('homework') || text.includes('assignment') || text.includes('hw')) {
      return { icon: '📚', text: 'Homework', color: '#3b82f6' };
    }
    if (text.includes('exam') || text.includes('test') || text.includes('quiz')) {
      return { icon: '📝', text: 'Exam', color: '#ef4444' };
    }
    if (text.includes('project') || text.includes('presentation')) {
      return { icon: '🚀', text: 'Project', color: '#8b5cf6' };
    }
    if (text.includes('meeting') || text.includes('class') || text.includes('lecture')) {
      return { icon: '👥', text: 'Meeting', color: '#10b981' };
    }
    if (text.includes('study') || text.includes('review') || text.includes('reading')) {
      return { icon: '📖', text: 'Study', color: '#f59e0b' };
    }
    if (text.includes('deadline') || text.includes('submit')) {
      return { icon: '⏰', text: 'Deadline', color: '#ef4444' };
    }

    return null;
  };

  const { dateText, timeText, isOverdue } = formatDueDate(reminder.dueDate);
  const urgencyIndicator = getUrgencyIndicator();
  const smartCategory = getSmartCategory();

  const cardStyle = {
    padding: compact ? '12px' : '16px',
    borderRadius: '12px',
    border: `1px solid ${reminder.isCompleted ? 'var(--border)' : urgencyIndicator ? urgencyIndicator.color : 'var(--border)'}`,
    background: reminder.isCompleted ? 'var(--bg-secondary)' : urgencyIndicator && urgencyIndicator.color === 'var(--danger)' ? 'var(--danger-50)' : 'var(--bg)',
    opacity: reminder.isCompleted ? 0.7 : 1,
    transition: 'all 0.2s ease'
  };

  return (
    <div style={cardStyle}>
      <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
        {/* Completion Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={isLoading}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '6px',
            border: `2px solid ${reminder.isCompleted ? 'var(--ok)' : 'var(--border)'}`,
            background: reminder.isCompleted ? 'var(--ok)' : 'transparent',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            marginTop: '2px'
          }}
        >
          {reminder.isCompleted && <Check size={12} />}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <h4 style={{
              margin: 0,
              fontSize: compact ? '14px' : '16px',
              fontWeight: '500',
              color: reminder.isCompleted ? 'var(--text-2)' : 'var(--text)',
              textDecoration: reminder.isCompleted ? 'line-through' : 'none'
            }}>
              {reminder.title}
            </h4>
                        {urgencyIndicator && (
              <span
                className="badge"
                style={{
                  fontSize: '11px',
                  background: urgencyIndicator.color === 'var(--danger)' ? 'var(--danger-100)' :
                             urgencyIndicator.color === 'var(--warn)' ? 'var(--warn-100)' :
                             urgencyIndicator.color === '#f59e0b' ? 'color-mix(in srgb, #f59e0b, #fff 80%)' :
                             'var(--ok-100)',
                  color: urgencyIndicator.color,
                  border: `1px solid ${urgencyIndicator.color}20`
                }}
              >
                {urgencyIndicator.text}
              </span>
            )}
            {smartCategory && (
              <span
                className="badge"
                style={{
                  fontSize: '11px',
                  background: `${smartCategory.color}15`,
                  color: smartCategory.color,
                  border: `1px solid ${smartCategory.color}30`,
                  marginRight: '4px'
                }}
              >
                {smartCategory.icon} {smartCategory.text}
              </span>
            )}
          </div>

          {reminder.description && (
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '13px',
              color: 'var(--text-2)',
              lineHeight: '1.4'
            }}>
              {reminder.description}
            </p>
          )}

          <div className="row" style={{ gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--text-2)' }}>
            <Clock size={12} />
            <span>{dateText} • {timeText}</span>
          </div>
        </div>

        {/* Actions */}
        {showActions && !compact && (
          <div className="row" style={{ gap: '4px', flexShrink: 0 }}>
            <button
              onClick={() => window.location.href = `/dashboard/reminders/${reminder.id}/edit`}
              className="btn ghost"
              style={{
                padding: '6px',
                borderRadius: '6px',
                fontSize: '12px',
                minWidth: 'auto'
              }}
              title="Edit reminder"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="btn ghost"
              style={{
                padding: '6px',
                borderRadius: '6px',
                fontSize: '12px',
                minWidth: 'auto',
                color: 'var(--danger)',
                borderColor: 'color-mix(in srgb, var(--danger), var(--border))'
              }}
              title="Delete reminder"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}