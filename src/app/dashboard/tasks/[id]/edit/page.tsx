"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Task, TaskFormData } from "@/types/task";
import { getTaskById, updateTask } from "@/lib/tasks";
import { getUserSubjects } from "@/lib/storage";
import { uploadTaskFiles, updateTaskAttachedFiles } from "@/lib/taskFiles";
import { Subject } from "@/types/subject";
import TaskForm from "@/components/task/TaskForm";
import { ArrowLeft, Edit } from "lucide-react";

export default function EditTaskPage() {
  const { user } = useAuth();
  const { setUpcomingTasks } = useNotifications();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Load task and subjects
  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId || !taskId) return;

      try {
        const [taskData, userSubjects] = await Promise.all([
          getTaskById(user.userId, taskId),
          getUserSubjects(user.userId)
        ]);

        setTask(taskData);
        setSubjects(userSubjects);
      } catch (error: any) {
if (error.message === 'Task not found' || error.message === 'Access denied') {
          setNotFound(true);
        } else {
          setError('Failed to load task. Please try again.');
        }
      } finally {
        setIsPageLoading(false);
      }
    };

    loadData();
  }, [user, taskId]);

  // Handle task update
  const handleSubmit = async (data: TaskFormData, files: File[]) => {
    if (!user?.userId || !task) return;

    
    setIsLoading(true);
    setError(null);

    try {
      // Update task details
      await updateTask(user.userId, taskId, data);

      // Handle file uploads if any
      if (files.length > 0) {
        try {
          const uploadedFiles = await uploadTaskFiles(
            files,
            taskId,
            user.userId,
            () => {} // Empty progress callback
          );

          // Add new files to existing task files
          if (uploadedFiles.length > 0) {
            const existingFiles = task.attachedFiles || [];
            await updateTaskAttachedFiles(user.userId, taskId, [...uploadedFiles, ...existingFiles]);
          }
        } catch (fileError) {
                    // Continue with task update even if file upload fails
        }
      }

      // Sync with global notification context (update task in upcoming tasks)
      const updatedTask = { ...task, ...data };
      if (!['completed', 'cancelled'].includes(updatedTask.status)) {
        setUpcomingTasks(prev => {
          const updated = prev.map(t => t.id === taskId ? updatedTask : t);
          // Remove completed/cancelled tasks and sort by due date
          return updated
            .filter(t => !['completed', 'cancelled'].includes(t.status))
            .sort((a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime())
            .slice(0, 10); // Limit to 10 for performance
        });
      } else {
        // If task is completed/cancelled, remove from upcoming tasks
        setUpcomingTasks(prev => prev.filter(t => t.id !== taskId));
      }

            router.push('/dashboard/tasks');
    } catch (error) {
            setError('Failed to update task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push('/dashboard/tasks');
  };

  // Show loading state
  if (isPageLoading) {
    return (
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
        <div className="animate-spin" style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--border)',
          borderTop: '2px solid var(--brand)',
          borderRadius: '50%',
          margin: '0 auto 16px'
        }} />
        <div style={{ color: 'var(--text-2)' }}>Loading task...</div>
      </div>
    );
  }

  // Show not found state
  if (notFound) {
    return (
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🔍</div>
        <h2 style={{ margin: '0 0 8px', color: 'var(--text)' }}>Task Not Found</h2>
        <p className="small" style={{ color: 'var(--text-2)', marginBottom: '20px' }}>
          The task you're looking for doesn't exist or you don't have permission to edit it.
        </p>
        <button onClick={handleCancel} className="btn">
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="row" style={{ alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={handleCancel}
          className="btn ghost"
          style={{ padding: '6px' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 'var(--fs-hero)', margin: '0 0 4px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit size={20} />
            Edit Task
          </h1>
          <p className="small" style={{ color: 'var(--text-2)' }}>
            Update task details and settings
          </p>
        </div>
      </div>

      {/* Task Info Card */}
      {task && (
        <div className="card" style={{
          background: 'var(--info-100)',
          border: '1px solid var(--info-200)',
          marginBottom: '20px',
          padding: '16px'
        }}>
          <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: task.status === 'completed' ? 'var(--ok)' :
                         task.status === 'overdue' ? 'var(--danger)' : 'var(--text-2)'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px' }}>
                {task.title}
              </div>
              <div className="small" style={{ color: 'var(--text-2)' }}>
                Created on {task.createdAt.toDate().toLocaleDateString()} •
                Status: <span style={{
                  color: task.status === 'completed' ? 'var(--ok)' :
                         task.status === 'overdue' ? 'var(--danger)' : 'var(--text-2)'
                }}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="card" style={{
          background: 'var(--danger-100)',
          border: '1px solid var(--danger-200)',
          color: 'var(--danger)',
          padding: '16px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Task Form */}
      <div className="card">
        <TaskForm
          task={task || undefined}
          subjects={subjects}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          taskId={taskId}
          userId={user?.userId}
        />
      </div>

      {/* Editing Tips */}
      <div className="card" style={{ marginTop: '20px', background: 'var(--warn-50)', border: '1px solid var(--warn-200)' }}>
        <h3 style={{ fontSize: '16px', margin: '0 0 12px', color: 'var(--warn)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Edit size={16} />
          Editing Tips
        </h3>
        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.5' }}>
          <li style={{ marginBottom: '6px' }}>Changing the due date will reset the task status to "pending"</li>
          <li style={{ marginBottom: '6px' }}>You can update priority levels to better reflect task importance</li>
          <li style={{ marginBottom: '6px' }}>Link or unlink subjects as your task requirements change</li>
          <li>Task descriptions can be expanded to provide more context</li>
        </ul>
      </div>
    </div>
  );
}