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
      console.error('Error toggling reminder:', error);
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
      console.error('Error deleting reminder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="badge warn">High</span>;
      case 'medium':
        return <span className="badge ok">Medium</span>;
      case 'low':
        return <span className="badge">Low</span>;
      default:
        return <span className="badge">Low</span>;
    }
  };

  const formatDueDate = (date: any) => {
    const dueDate = date.toDate();
    const now = new Date();
    const isOverdue = dueDate < now && !reminder.isCompleted;
    const isToday = dueDate.toDateString() === now.toDateString();
    const isTomorrow = dueDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

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
    } else {
      dateText = dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }

    return { dateText, timeText, isOverdue };
  };

  const { dateText, timeText, isOverdue } = formatDueDate(reminder.dueDate);

  const cardStyle = {
    padding: compact ? '12px' : '16px',
    borderRadius: '12px',
    border: `1px solid ${reminder.isCompleted ? 'var(--border)' : isOverdue ? 'var(--danger)' : 'var(--border)'}`,
    background: reminder.isCompleted ? 'var(--bg-secondary)' : isOverdue ? 'var(--danger-50)' : 'var(--bg)',
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
            {getPriorityBadge(reminder.priority)}
            {isOverdue && !reminder.isCompleted && (
              <span className="badge warn" style={{ fontSize: '11px' }}>
                Overdue
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