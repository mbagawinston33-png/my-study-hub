"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ReminderModal from "@/components/reminder/ReminderModal";
import ReminderCard from "@/components/reminder/ReminderCard";
import TaskCard from "@/components/task/TaskCard";
import Calendar from "@/components/calendar/Calendar";
import TimerWidget from "@/components/timer/TimerWidget";
import { Reminder } from "@/types/reminder";
import { Task, TaskWithSubject, TaskStats } from "@/types/task";
import { getUpcomingReminders } from "@/lib/reminders";
import { getTaskStats, getUpcomingTasks, updateOverdueTasks, toggleTaskCompletion } from "@/lib/tasks";
import { getUserSubjects, getUserStorageUsage } from "@/lib/storage";
import { Subject, SubjectWithFileCount } from "@/types/subject";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<TaskWithSubject[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    dueThisWeek: 0
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentFileCount, setRecentFileCount] = useState(0);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
}
  };

  useEffect(() => {
    if (user) {
      loadUpcomingReminders();
      loadUpcomingTasks();
      loadTaskStats();
      loadUserData();
    }
  }, [user]);

  const loadUpcomingReminders = async () => {
    if (!user) return;

    setIsLoadingReminders(true);
    try {
      const reminders = await getUpcomingReminders(user.userId);
      setUpcomingReminders(reminders.slice(0, 3)); // Show only 3 upcoming reminders
    } catch (error) {
} finally {
      setIsLoadingReminders(false);
    }
  };

  const loadUpcomingTasks = async () => {
    if (!user) return;

    setIsLoadingTasks(true);
    try {
      // Update overdue tasks first
      await updateOverdueTasks(user.userId);

      const [tasks, userSubjects] = await Promise.all([
        getUpcomingTasks(user.userId, 5), // Show only 5 upcoming tasks
        getUserSubjects(user.userId)
      ]);

      // Attach subject information to tasks
      const tasksWithSubjects = tasks.map(task => ({
        ...task,
        subject: task.subjectId ? userSubjects.find(s => s.id === task.subjectId) : undefined
      }));

      setUpcomingTasks(tasksWithSubjects);
    } catch (error) {
} finally {
      setIsLoadingTasks(false);
    }
  };

  const loadTaskStats = async () => {
    if (!user) return;

    try {
      const stats = await getTaskStats(user.userId);
      setTaskStats(stats);
    } catch (error) {
}
  };

  const loadUserData = async () => {
    if (!user) return;

    setIsLoadingData(true);
    try {
      const [userSubjects, storageUsage] = await Promise.all([
        getUserSubjects(user.userId),
        getUserStorageUsage(user.userId)
      ]);

      setSubjects(userSubjects);
      setRecentFileCount(storageUsage > 0 ? 1 : 0); // Simplified - just show if any files exist
    } catch (error) {
} finally {
      setIsLoadingData(false);
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

  const handleTaskToggleComplete = async (taskId: string) => {
    if (!user?.userId) return;

    try {
      const updatedTask = await toggleTaskCompletion(user.userId, taskId);
      setUpcomingTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                status: updatedTask.status
              }
            : task
        )
      );

      // Update stats
      loadTaskStats();
    } catch (error) {
}
  };

  const handleTaskClick = (taskId: string) => {
    router.push(`/dashboard/tasks?highlight=${taskId}`);
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
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--brand-700)' }}>
            {taskStats.total}
          </h3>
          <div className="small">{taskStats.dueThisWeek} due this week</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="small">Pending Tasks</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--text-2)' }}>
            {taskStats.pending}
          </h3>
          <div className="small">{taskStats.overdue} overdue</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="small">Active Subjects</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--text)' }}>
            {subjects.length}
          </h3>
          <div className="small">{subjects.filter(s => s.isActive).length} active</div>
        </div>
        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="small">Completed Tasks</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--ok)' }}>
            {taskStats.completed}
          </h3>
          <div className="small">
            {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}% completion rate
          </div>
        </div>
      </div>

      {/* Timer Widget */}
      <div style={{ marginBottom: '28px' }}>
        <TimerWidget />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(12, 1fr)' }}>

        {/* Calendar */}
        <div style={{ gridColumn: 'span 8' }}>
          <Calendar userId={user?.userId || ''} />
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

          <h4 style={{ fontSize: 'var(--fs-h3)', margin: '0 0 10px', color: 'var(--text)' }}>Your Progress</h4>
          <div style={{ height: '10px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{ display: 'block', height: '100%', width: `${Math.min(100, (subjects.length / 5) * 100)}%`, background: 'var(--brand)', borderRadius: '999px' }}></div>
          </div>
          <div className="small">
            {subjects.length === 0 ? 'No subjects yet' : `${subjects.length} subject${subjects.length !== 1 ? 's' : ''} added`}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="row">
            <h3 style={{ fontSize: 'var(--fs-h2)', margin: '0 0 14px', color: 'var(--text)' }}>Upcoming Tasks</h3>
            <span className="right badge brand">
              {upcomingTasks.length > 0 ? `${upcomingTasks.length} Active` : 'None'}
            </span>
          </div>
          <div className="hr"></div>

          {isLoadingTasks ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-2)' }}>
              Loading tasks...
            </div>
          ) : upcomingTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task.id)}
                  style={{ cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <TaskCard
                    task={task}
                    onToggleComplete={handleTaskToggleComplete}
                    compact={true}
                    showActions={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-2)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.3 }}>📋</div>
              <div style={{ fontSize: '14px' }}>No upcoming tasks</div>
              <a
                href="/dashboard/tasks/new"
                className="btn ghost"
                style={{ fontSize: '12px', marginTop: '8px' }}
              >
                Create your first task
              </a>
            </div>
          )}
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
            <span className="right badge ok">{subjects.length} Active</span>
          </div>
          <div className="hr"></div>

          {isLoadingData ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-2)' }}>
              Loading subjects...
            </div>
          ) : subjects.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {subjects.slice(0, 4).map((subject) => (
                <div key={subject.id} className="row" style={{ gap: '8px' }}>
                  <span
                    className="badge"
                    style={{
                      background: `${subject.color}15`,
                      color: subject.color,
                      border: `1px solid ${subject.color}30`
                    }}
                  >
                    {subject.code || subject.name}
                  </span>
                  <div className="small">
                    Active
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-2)' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>📚</div>
              <div>No subjects yet</div>
              <div className="small">Add your first subject to get started</div>
            </div>
          )}
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