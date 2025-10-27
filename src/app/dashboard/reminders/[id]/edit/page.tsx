"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import ReminderForm from '@/components/reminder/ReminderForm';
import { Reminder, ReminderFormData } from '@/types/reminder';
import { getReminderById, updateReminder, deleteReminder } from '@/lib/reminders';
import { useAuth } from '@/contexts/AuthContext';

export default function EditReminderPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadReminder();
  }, [params.id]);

  const loadReminder = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const reminderData = await getReminderById(user.userId, params.id);
      setReminder(reminderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reminder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: ReminderFormData) => {
    if (!user || !reminder) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateReminder(user.userId, reminder.id, data);
      router.push('/dashboard/reminders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reminder');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !reminder) return;

    if (!confirm('Are you sure you want to delete this reminder? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteReminder(user.userId, reminder.id);
      router.push('/dashboard/reminders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reminder');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/reminders');
  };

  const getInitialFormData = (): Partial<ReminderFormData> => {
    if (!reminder) return {};

    return {
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.dueDate.toDate().toISOString().slice(0, 16),
      priority: reminder.priority,
      subjectId: reminder.subjectId || '',
    };
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-2)' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading reminder...</div>
        </div>
      </div>
    );
  }

  if (error && !reminder) {
    return (
      <div>
        <button
          onClick={handleCancel}
          className="btn ghost"
          style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} />
          Back to Reminders
        </button>

        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--text)' }}>Error</h3>
          <p style={{ margin: '0 0 20px', color: 'var(--text-2)' }}>
            {error}
          </p>
          <button onClick={handleCancel} className="btn">
            Back to Reminders
          </button>
        </div>
      </div>
    );
  }

  if (!reminder) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={handleCancel}
          className="btn ghost"
          style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} />
          Back to Reminders
        </button>

        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'var(--fs-hero)', margin: '0 0 8px', color: 'var(--text)' }}>
              Edit Reminder
            </h1>
            <p className="small" style={{ color: 'var(--text-2)' }}>
              Update your reminder details
            </p>
          </div>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn ghost"
            style={{
              color: 'var(--danger)',
              borderColor: 'color-mix(in srgb, var(--danger), var(--border))',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={16} />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <ReminderForm
          initialData={getInitialFormData()}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSaving}
          submitLabel="Update Reminder"
        />

        {error && (
          <div style={{
            marginTop: '16px',
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
      </div>
    </div>
  );
}