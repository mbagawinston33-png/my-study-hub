"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ReminderModal from "@/components/reminder/ReminderModal";
import ReminderCard from "@/components/reminder/ReminderCard";
import { Reminder } from "@/types/reminder";
import { getUpcomingReminders } from "@/lib/reminders";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    loadUpcomingReminders();
  }, [user]);

  const loadUpcomingReminders = async () => {
    if (!user) return;

    setIsLoadingReminders(true);
    try {
      const reminders = await getUpcomingReminders(user.userId);
      setUpcomingReminders(reminders.slice(0, 3)); // Show only 3 upcoming reminders
    } catch (error) {
      console.error("Error loading upcoming reminders:", error);
    } finally {
      setIsLoadingReminders(false);
    }
  };

  const handleReminderUpdate = (updatedReminder: Reminder) => {
    setUpcomingReminders(prev =>
      prev.map(r => r.id === updatedReminder.id ? updatedReminder : r)
    );
  };

  const handleReminderDelete = (reminderId: string) => {
    setUpcomingReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  return (
    <div>
      {/* Welcome Section */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: 'var(--fs-hero)', margin: '0 0 8px', color: 'var(--text)' }}>
          Welcome back, {user?.displayName || "Student"}!
        </h1>
        <p className="small" style={{ fontSize: '16px', color: 'var(--text-2)' }}>
          Here's what's happening with your studies today.
        </p>
      </div>

      {/* Dashboard Widgets */}
      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(12, 1fr)', marginBottom: '28px' }}>
        <div className="card" style={{ gridColumn: 'span 3', background: 'var(--brand-100)' }}>
          <div className="small">Total Tasks</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--brand-700)' }}>24</h3>
          <div className="small">5 due this week</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="small">Active Subjects</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--text)' }}>6</h3>
          <div className="small">3 assignments pending</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="small">Study Materials</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--text)' }}>48</h3>
          <div className="small">12 uploaded this month</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="small">Completion Rate</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--ok)' }}>87%</h3>
          <div className="small">+5% from last month</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(12, 1fr)' }}>

        {/* Recent Activity */}
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="row">
            <h3 style={{ fontSize: 'var(--fs-h2)', margin: '0 0 14px', color: 'var(--text)' }}>Recent Activity</h3>
            <span className="right badge warn">3 new</span>
          </div>
          <div className="hr"></div>

          {/* Activity Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="row" style={{ padding: '10px', borderRadius: '12px', background: 'var(--brand-100)' }}>
              <div className="row" style={{ flex: 1, gap: '12px' }}>
                <div className="row" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--brand)', color: 'white', justifyContent: 'center', fontWeight: '700' }}>
                  T
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ color: 'var(--text)' }}>Math Assignment Completed</b>
                  <div className="small">Calculus Problem Set #5 • 2 hours ago</div>
                </div>
              </div>
              <span className="badge ok">Done</span>
            </div>

            {upcomingReminders.length > 0 && (
              <div className="row" style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div className="row" style={{ flex: 1, gap: '12px' }}>
                  <div className="row" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--warn)', color: 'white', justifyContent: 'center', fontWeight: '700' }}>
                    R
                  </div>
                  <div style={{ flex: 1 }}>
                    <b style={{ color: 'var(--text)' }}>Latest Reminder</b>
                    <div className="small">{upcomingReminders[0].title} • Due {upcomingReminders[0].dueDate.toDate().toLocaleDateString()}</div>
                  </div>
                </div>
                <span className="badge warn">
                  {upcomingReminders[0].priority}
                </span>
              </div>
            )}

            <div className="row" style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div className="row" style={{ flex: 1, gap: '12px' }}>
                <div className="row" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent)', color: 'white', justifyContent: 'center', fontWeight: '700' }}>
                  F
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ color: 'var(--text)' }}>New File Uploaded</b>
                  <div className="small">Chemistry Notes.pdf • 5 hours ago</div>
                </div>
              </div>
              <span className="badge brand">New</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Progress */}
        <div className="card" style={{ gridColumn: 'span 4' }}>
          <h3 style={{ fontSize: 'var(--fs-h2)', margin: '0 0 14px', color: 'var(--text)' }}>Quick Actions</h3>
          <div className="hr"></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="/dashboard/tasks/new" className="btn" style={{ justifyContent: 'center' }}>
              Create Task
            </a>
            <a href="/dashboard/subjects/new" className="btn subtle" style={{ justifyContent: 'center' }}>
              Add Subject
            </a>
            <button
              onClick={() => setIsReminderModalOpen(true)}
              className="btn ghost"
              style={{ justifyContent: 'center' }}
            >
              Set Reminder
            </button>
          </div>

          <div className="hr" style={{ margin: '20px 0' }}></div>

          <h4 style={{ fontSize: 'var(--fs-h3)', margin: '0 0 10px', color: 'var(--text)' }}>Weekly Progress</h4>
          <div style={{ height: '10px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{ display: 'block', height: '100%', width: '72%', background: 'var(--brand)', borderRadius: '999px' }}></div>
          </div>
          <div className="small">18 of 25 tasks completed</div>
        </div>

        {/* Upcoming Reminders */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="row">
            <h3 style={{ fontSize: 'var(--fs-h2)', margin: '0 0 14px', color: 'var(--text)' }}>Upcoming Reminders</h3>
            <span className="right badge brand">
              {upcomingReminders.length > 0 ? `${upcomingReminders.length} Active` : 'None'}
            </span>
          </div>
          <div className="hr"></div>

          {isLoadingReminders ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-2)' }}>
              Loading reminders...
            </div>
          ) : upcomingReminders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingReminders.slice(0, 3).map((reminder) => (
                <div key={reminder.id} className="row" style={{ gap: '10px' }}>
                  <span className={`badge ${
                    reminder.priority === 'high' ? 'warn' :
                    reminder.priority === 'medium' ? 'ok' : ''
                  }`}>
                    {reminder.priority}
                  </span>
                  <div style={{ flex: 1 }}>
                    <b style={{ color: 'var(--text)' }}>{reminder.title}</b>
                    <div className="small">
                      Due {reminder.dueDate.toDate().toLocaleDateString()} • {reminder.dueDate.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-2)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.3 }}>📅</div>
              <div style={{ fontSize: '14px' }}>No upcoming reminders</div>
              <button
                onClick={() => setIsReminderModalOpen(true)}
                className="btn ghost"
                style={{ fontSize: '12px', marginTop: '8px' }}
              >
                Create your first reminder
              </button>
            </div>
          )}
        </div>

        {/* Subject Overview */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="row">
            <h3 style={{ fontSize: 'var(--fs-h2)', margin: '0 0 14px', color: 'var(--text)' }}>Subject Overview</h3>
            <span className="right badge ok">6 Active</span>
          </div>
          <div className="hr"></div>

          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="row" style={{ gap: '8px' }}>
              <span className="badge brand">Math</span>
              <div className="small">8 tasks</div>
            </div>
            <div className="row" style={{ gap: '8px' }}>
              <span className="badge brand">Physics</span>
              <div className="small">5 tasks</div>
            </div>
            <div className="row" style={{ gap: '8px' }}>
              <span className="badge brand">Chemistry</span>
              <div className="small">6 tasks</div>
            </div>
            <div className="row" style={{ gap: '8px' }}>
              <span className="badge brand">Biology</span>
              <div className="small">5 tasks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onSuccess={loadUpcomingReminders}
      />
    </div>
  );
}