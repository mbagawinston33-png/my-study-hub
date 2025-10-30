"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Task, TaskWithSubject, TaskFilter, TaskStats } from "@/types/task";
import {
  getUserTasks,
  getTasksByFilter,
  toggleTaskCompletion,
  deleteTask,
  updateOverdueTasks,
  getTaskStats
} from "@/lib/tasks";
import { getUserSubjects } from "@/lib/storage";
import { Subject } from "@/types/subject";
import TaskCard from "@/components/task/TaskCard";
import {
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Calendar,
  BarChart3,
  RefreshCw,
  SortAsc
} from "lucide-react";

const FILTER_OPTIONS: { value: TaskFilter; label: string; icon: React.ReactNode }[] = [
  {
    value: 'all',
    label: 'All Tasks',
    icon: <Calendar size={16} />
  },
  {
    value: 'pending',
    label: 'Pending',
    icon: <Circle size={16} />
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: <CheckCircle2 size={16} />
  },
  {
    value: 'overdue',
    label: 'Overdue',
    icon: <AlertTriangle size={16} />
  }
];

export default function TasksPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<TaskWithSubject[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    dueThisWeek: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Load tasks and data
  const loadTasks = async () => {
    if (!user?.userId) return;

    try {
      setIsLoading(true);

      // Update overdue tasks first
      await updateOverdueTasks(user.userId);

      const [userTasks, userSubjects, taskStats] = await Promise.all([
        getTasksByFilter(user.userId, selectedFilter),
        getUserSubjects(user.userId),
        getTaskStats(user.userId)
      ]);

      // Attach subject information to tasks
      const tasksWithSubjects = userTasks.map(task => ({
        ...task,
        subject: task.subjectId ? userSubjects.find(s => s.id === task.subjectId) : undefined
      }));

      setTasks(tasksWithSubjects);
      setSubjects(userSubjects);
      setStats(taskStats);
    } catch (error) {
} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user, selectedFilter]);

  // Handle URL parameters for highlighting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const highlightId = urlParams.get('highlight');
      if (highlightId) {
        setHighlightedTaskId(highlightId);
        // Clear the URL parameter after processing
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  // Handle task completion toggle
  const handleToggleComplete = async (taskId: string) => {
    if (!user?.userId) return;

    try {
      const updatedTask = await toggleTaskCompletion(user.userId, taskId);
      setTasks(prev =>
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
      const newStats = await getTaskStats(user.userId);
      setStats(newStats);
    } catch (error) {
}
  };

  // Handle task deletion
  const handleDelete = async (taskId: string) => {
    if (!user?.userId) return;

    try {
      await deleteTask(user.userId, taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));

      // Update stats
      const newStats = await getTaskStats(user.userId);
      setStats(newStats);
    } catch (error) {
}
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTasks();
    setIsRefreshing(false);
  };

  // Filter tasks based on search and subject
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSubject = !selectedSubject || task.subjectId === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  // Get filter stats
  const getFilterCount = (filter: TaskFilter) => {
    switch (filter) {
      case 'all': return stats.total;
      case 'pending': return stats.pending;
      case 'completed': return stats.completed;
      case 'overdue': return stats.overdue;
      default: return 0;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-hero)', margin: '0 0 4px', color: 'var(--text)' }}>
            Tasks
          </h1>
          <p className="small" style={{ color: 'var(--text-2)' }}>
            Manage your academic tasks and assignments
          </p>
        </div>
        <div className="row" style={{ gap: '8px' }}>
          <button
            onClick={handleRefresh}
            className="btn ghost"
            disabled={isRefreshing}
            style={{ padding: '8px 16px' }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <a href="/dashboard/tasks/new" className="btn" style={{ padding: '8px 16px' }}>
            <Plus size={16} />
            New Task
          </a>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(12, 1fr)', marginBottom: '24px' }}>
        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} style={{ color: 'var(--brand)' }} />
            <div className="small">Total Tasks</div>
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--text)' }}>
            {stats.total}
          </h3>
          <div className="small" style={{ color: 'var(--text-2)' }}>
            Active tasks
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
            <Circle size={16} style={{ color: 'var(--text-2)' }} />
            <div className="small">Pending</div>
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--text-2)' }}>
            {stats.pending}
          </h3>
          <div className="small" style={{ color: 'var(--text-2)' }}>
            To be completed
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--ok)' }} />
            <div className="small">Completed</div>
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--ok)' }}>
            {stats.completed}
          </h3>
          <div className="small" style={{ color: 'var(--text-2)' }}>
            Done
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 3' }}>
          <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
            <div className="small">Overdue</div>
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: 'var(--fs-h2)', color: 'var(--danger)' }}>
            {stats.overdue}
          </h3>
          <div className="small" style={{ color: 'var(--text-2)' }}>
            Needs attention
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr auto auto' }}>
          {/* Search */}
          <div className="row" style={{ gap: '8px' }}>
            <Search size={16} style={{ color: 'var(--text-2)' }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                flex: 1,
                fontSize: '14px',
                color: 'var(--text)'
              }}
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '14px',
              color: 'var(--text)',
              background: 'var(--bg)',
              minWidth: '150px'
            }}
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name} {subject.code && `(${subject.code})`}
              </option>
            ))}
          </select>

          {/* Sort */}
          <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
            <SortAsc size={16} style={{ color: 'var(--text-2)' }} />
            <select
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: 'var(--text)',
                background: 'transparent'
              }}
              defaultValue="dueDate"
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="createdAt">Sort by Created</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="row" style={{ gap: '4px', marginTop: '16px', flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(filter => {
            const count = getFilterCount(filter.value);
            return (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className={`btn ${selectedFilter === filter.value ? '' : 'ghost'}`}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  background: selectedFilter === filter.value ? 'var(--brand-100)' : 'transparent',
                  color: selectedFilter === filter.value ? 'var(--brand)' : 'var(--text-2)',
                  border: selectedFilter === filter.value ? '1px solid var(--brand-200)' : '1px solid var(--border)'
                }}
              >
                <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                  {filter.icon}
                  <span>{filter.label}</span>
                  {count > 0 && (
                    <span className="badge" style={{
                      background: selectedFilter === filter.value ? 'var(--brand)' : 'var(--text-3)',
                      color: 'white',
                      fontSize: '11px',
                      padding: '1px 5px',
                      borderRadius: '10px'
                    }}>
                      {count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-2)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div>Loading tasks...</div>
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
              highlighted={task.id === highlightedTaskId}
            />
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-2)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📋</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: 'var(--text)' }}>
              {searchTerm || selectedSubject ? 'No matching tasks' : 'No tasks yet'}
            </h3>
            <p className="small" style={{ marginBottom: '20px' }}>
              {searchTerm || selectedSubject
                ? 'Try adjusting your filters or search terms'
                : 'Create your first task to get started with organizing your academic work'
              }
            </p>
            {!searchTerm && !selectedSubject && (
              <a href="/dashboard/tasks/new" className="btn">
                <Plus size={16} />
                Create Your First Task
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}