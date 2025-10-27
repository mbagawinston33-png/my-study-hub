"use client";

import { useState, useEffect } from 'react';
import { ReminderFormData, ReminderPriority, REMINDER_PRIORITIES } from '@/types/reminder';
import { Subject } from '@/types/subject';
import { getUserSubjects } from '@/lib/storage';

interface ReminderFormProps {
  initialData?: Partial<ReminderFormData>;
  onSubmit: (data: ReminderFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function ReminderForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Create Reminder"
}: ReminderFormProps) {
  const [formData, setFormData] = useState<ReminderFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    dueDate: initialData?.dueDate || '',
    priority: initialData?.priority || 'medium',
    subjectId: initialData?.subjectId || '',
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const userSubjects = await getUserSubjects();
        setSubjects(userSubjects.filter(subject => subject.isActive));
      } catch (err) {
        console.error('Error loading subjects:', err);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    loadSubjects();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.dueDate) {
      setError('Due date is required');
      return;
    }

    const dueDate = new Date(formData.dueDate);
    if (dueDate <= new Date()) {
      setError('Due date must be in the future');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof ReminderFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPriorityBadgeClass = (priority: ReminderPriority) => {
    switch (priority) {
      case 'high':
        return 'badge warn';
      case 'medium':
        return 'badge ok';
      case 'low':
        return 'badge';
      default:
        return 'badge';
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--danger-100)',
          color: 'var(--danger)',
          fontSize: '14px',
          border: '1px solid var(--danger-200)'
        }}>
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text)'
        }}>
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., Physics Lab Report"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '14px',
            background: 'var(--bg)',
            color: 'var(--text)'
          }}
          disabled={isLoading}
        />
      </div>

      {/* Description */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text)'
        }}>
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Add any additional details..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '14px',
            background: 'var(--bg)',
            color: 'var(--text)',
            resize: 'vertical'
          }}
          disabled={isLoading}
        />
      </div>

      {/* Due Date */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text)'
        }}>
          Due Date *
        </label>
        <input
          type="datetime-local"
          value={formData.dueDate}
          onChange={(e) => handleInputChange('dueDate', e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '14px',
            background: 'var(--bg)',
            color: 'var(--text)'
          }}
          disabled={isLoading}
        />
      </div>

      {/* Priority */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text)'
        }}>
          Priority
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(Object.keys(REMINDER_PRIORITIES) as ReminderPriority[]).map((priority) => (
            <button
              key={priority}
              type="button"
              onClick={() => handleInputChange('priority', priority)}
              className={formData.priority === priority ? getPriorityBadgeClass(priority) : 'btn ghost'}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: formData.priority === priority ? '1px solid var(--brand)' : '1px solid var(--border)',
                background: formData.priority === priority ? 'var(--brand)' : 'var(--bg)',
                color: formData.priority === priority ? 'white' : 'var(--text)',
                cursor: 'pointer'
              }}
              disabled={isLoading}
            >
              {REMINDER_PRIORITIES[priority]}
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text)'
        }}>
          Subject (Optional)
        </label>
        {isLoadingSubjects ? (
          <div style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '14px',
            color: 'var(--text-2)'
          }}>
            Loading subjects...
          </div>
        ) : (
          <select
            value={formData.subjectId}
            onChange={(e) => handleInputChange('subjectId', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '14px',
              background: 'var(--bg)',
              color: 'var(--text)'
            }}
            disabled={isLoading}
          >
            <option value="">No subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} {subject.code && `(${subject.code})`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Actions */}
      <div className="row" style={{ gap: '8px', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn ghost"
            disabled={isLoading}
            style={{ minWidth: '80px' }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn"
          disabled={isLoading}
          style={{ minWidth: '120px' }}
        >
          {isLoading ? 'Creating...' : submitLabel}
        </button>
      </div>
    </form>
  );
}