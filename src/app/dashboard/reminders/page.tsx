"use client";

import { useState, useEffect } from 'react';
import { Plus, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import ReminderModal from '@/components/reminder/ReminderModal';
import ReminderCard from '@/components/reminder/ReminderCard';
import { Reminder } from '@/types/reminder';
import { getUserReminders, getUpcomingReminders } from '@/lib/reminders';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

type FilterType = 'all' | 'pending' | 'completed' | 'overdue';
type SortType = 'dueDate' | 'created';

export default function RemindersPage() {
  const { user } = useAuth();
  const { setUpcomingReminders } = useNotifications();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('dueDate');
  const [highlightedReminderId, setHighlightedReminderId] = useState<string | null>(null);

  useEffect(() => {
    loadReminders();
  }, []);

  // Handle URL parameters for highlighting
  useEffect(() => {
    if (typeof window !== 'undefined' && reminders.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const highlightId = urlParams.get('highlight');

      if (highlightId) {
        setHighlightedReminderId(highlightId);
        // Clear the URL parameter after processing
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [reminders.length]); // Dependency on reminders length to ensure reminders are loaded

  useEffect(() => {
    applyFiltersAndSort();
  }, [reminders, filter, sort]);

  const loadReminders = async () => {
    if (!user) return;

    console.log('🔄 Loading reminders for user:', user.userId);
    setIsLoading(true);
    try {
      // Load all reminders for the page display
      const userReminders = await getUserReminders(user.userId);
      console.log('📥 Retrieved all reminders from Firestore:', userReminders.length);
      setReminders(userReminders);

      // Load only upcoming reminders for global notification context (same as dashboard)
      const upcomingReminders = await getUpcomingReminders(user.userId);
      console.log('📤 Updating global upcoming reminders:', upcomingReminders.length);
      setUpcomingReminders(upcomingReminders);
    } catch (error) {
      console.error('❌ Error loading reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...reminders];
    const now = new Date();

    // Apply filters
    switch (filter) {
      case 'pending':
        filtered = filtered.filter(r => !r.isCompleted);
        break;
      case 'completed':
        filtered = filtered.filter(r => r.isCompleted);
        break;
      case 'overdue':
        filtered = filtered.filter(r => !r.isCompleted && r.dueDate.toDate() < now);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'dueDate':
          return a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime();
        case 'created':
          return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
        default:
          return 0;
      }
    });

    setFilteredReminders(filtered);
  };

  const handleReminderUpdate = (updatedReminder: Reminder) => {
    setReminders(prev => prev.map(r => r.id === updatedReminder.id ? updatedReminder : r));

    // Update global notification context
    setUpcomingReminders(prev => {
      const updated = prev.map(r => r.id === updatedReminder.id ? updatedReminder : r);
      // Keep only upcoming reminders (not completed) and sort by due date
      return updated
        .filter(r => !r.isCompleted)
        .sort((a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime());
    });
  };

  const handleReminderDelete = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));

    // Update global notification context
    setUpcomingReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const getStats = () => {
    const now = new Date();
    const pending = reminders.filter(r => !r.isCompleted).length;
    const completed = reminders.filter(r => r.isCompleted).length;
    const overdue = reminders.filter(r => !r.isCompleted && r.dueDate.toDate() < now).length;

    return { pending, completed, overdue };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-2)' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading reminders...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: 'var(--fs-hero)', margin: '0 0 8px', color: 'var(--text)' }}>
              Reminders
            </h1>
            <p className="small" style={{ color: 'var(--text-2)' }}>
              Manage your study reminders and deadlines
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            New Reminder
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(12, 1fr)' }}>
          <div className="card" style={{ gridColumn: 'span 3' }}>
            <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
              <Clock size={16} color="var(--brand)" />
              <div>
                <div className="small">Pending</div>
                <div style={{ fontSize: 'var(--fs-h3)', color: 'var(--text)', fontWeight: '600' }}>
                  {stats.pending}
                </div>
              </div>
            </div>
          </div>
          <div className="card" style={{ gridColumn: 'span 3' }}>
            <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
              <CheckCircle size={16} color="var(--ok)" />
              <div>
                <div className="small">Completed</div>
                <div style={{ fontSize: 'var(--fs-h3)', color: 'var(--text)', fontWeight: '600' }}>
                  {stats.completed}
                </div>
              </div>
            </div>
          </div>
          <div className="card" style={{ gridColumn: 'span 3' }}>
            <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
              <AlertCircle size={16} color="var(--warn)" />
              <div>
                <div className="small">Overdue</div>
                <div style={{ fontSize: 'var(--fs-h3)', color: 'var(--text)', fontWeight: '600' }}>
                  {stats.overdue}
                </div>
              </div>
            </div>
          </div>
          <div className="card" style={{ gridColumn: 'span 3' }}>
            <div className="small">Total Reminders</div>
            <div style={{ fontSize: 'var(--fs-h3)', color: 'var(--text)', fontWeight: '600' }}>
              {reminders.length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row" style={{ gap: '8px' }}>
            <Filter size={16} />
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'btn' : 'btn ghost'}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              All ({reminders.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={filter === 'pending' ? 'btn' : 'btn ghost'}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={filter === 'completed' ? 'btn' : 'btn ghost'}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              Completed ({stats.completed})
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={filter === 'overdue' ? 'btn' : 'btn ghost'}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              Overdue ({stats.overdue})
            </button>
          </div>

          <div className="row" style={{ gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '12px',
                background: 'var(--bg)',
                color: 'var(--text)'
              }}
            >
              <option value="dueDate">Due Date</option>
                            <option value="created">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📅</div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--text)' }}>No reminders found</h3>
          <p style={{ margin: '0 0 20px', color: 'var(--text-2)' }}>
            {filter === 'all'
              ? 'Create your first reminder to get started with staying organized.'
              : `No ${filter} reminders found.`
            }
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              Create Reminder
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onUpdate={handleReminderUpdate}
              onDelete={handleReminderDelete}
              highlighted={reminder.id === highlightedReminderId}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadReminders}
      />
    </div>
  );
}