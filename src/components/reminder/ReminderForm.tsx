"use client";

import { useState } from 'react';
import { ReminderFormData } from '@/types/reminder';

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
  });

  const [error, setError] = useState<string | null>(null);

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