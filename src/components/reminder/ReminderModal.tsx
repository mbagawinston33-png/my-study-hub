"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ReminderForm from './ReminderForm';
import { ReminderFormData } from '@/types/reminder';
import { createReminder } from '@/lib/reminders';
import { useAuth } from '@/contexts/AuthContext';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReminderModal({
  isOpen,
  onClose,
  onSuccess
}: ReminderModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ReminderFormData) => {
    if (!user) {
      setError('You must be logged in to create a reminder');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createReminder(user.userId, data);
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Set Reminder"
      size="medium"
    >
      <div style={{ padding: '0' }}>
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--brand-100)',
          color: 'var(--brand-700)',
          fontSize: '14px'
        }}>
          <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
            <Plus size={16} />
            <span>Quick reminder creation</span>
          </div>
        </div>

        <ReminderForm
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isLoading={isLoading}
          submitLabel="Create Reminder"
        />

        {error && (
          <div style={{
            marginTop: '12px',
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
    </Modal>
  );
}