"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TaskFormData } from "@/types/task";
import { createTask } from "@/lib/tasks";
import { getUserSubjects } from "@/lib/storage";
import { uploadTaskFiles, updateTaskAttachedFiles } from "@/lib/taskFiles";
import { Subject } from "@/types/subject";
import TaskForm from "@/components/task/TaskForm";
import { ArrowLeft, Plus } from "lucide-react";

export default function NewTaskPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subjects for the form
  useEffect(() => {
    const loadSubjects = async () => {
      if (!user?.userId) return;

      try {
        const userSubjects = await getUserSubjects(user.userId);
        setSubjects(userSubjects);
      } catch (error) {
        console.error("Error loading subjects:", error);
      } finally {
        setIsPageLoading(false);
      }
    };

    if (!loading && user) {
      loadSubjects();
    } else if (!loading && !user) {
      setIsPageLoading(false);
    }
  }, [user, loading]);

  // Handle task creation
  const handleSubmit = async (data: TaskFormData, files: File[]) => {
    if (!user?.userId) return;

    
    setIsLoading(true);
    setError(null);

    try {
            // First create the task
      const newTask = await createTask(user.userId, data);
      
      // Then upload files if any
      if (files.length > 0) {
        try {
          const uploadedFiles = await uploadTaskFiles(
            files,
            newTask.id,
            user.userId,
            () => {} // Empty progress callback
          );

          // Update the task with the attached files
          if (uploadedFiles.length > 0) {
            await updateTaskAttachedFiles(user.userId, newTask.id, uploadedFiles);
          }
        } catch (fileError) {
                    // Continue with task creation even if file upload fails
        }
      }
      router.push('/dashboard/tasks');
    } catch (error) {
            setError('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push('/dashboard/tasks');
  };

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
        <div style={{ color: 'var(--text-2)' }}>Loading...</div>
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
          <h1 style={{ fontSize: 'var(--fs-hero)', margin: '0 0 4px', color: 'var(--text)' }}>
            Create New Task
          </h1>
          <p className="small" style={{ color: 'var(--text-2)' }}>
            Add a new task to your academic workload
          </p>
        </div>
      </div>

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
          subjects={subjects}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          userId={user?.userId}
        />
      </div>

      {/* Quick Tips */}
      <div className="card" style={{ marginTop: '20px', background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
        <h3 style={{ fontSize: '16px', margin: '0 0 12px', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} />
          Quick Tips
        </h3>
        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.5' }}>
          <li style={{ marginBottom: '6px' }}>Be specific with task titles for better organization</li>
          <li style={{ marginBottom: '6px' }}>Set realistic due dates to avoid overdue tasks</li>
          <li style={{ marginBottom: '6px' }}>Use priority levels to focus on important tasks first</li>
          <li style={{ marginBottom: '6px' }}>Link tasks to subjects for better academic organization</li>
          <li>Use descriptions to add context and requirements</li>
        </ul>
      </div>
    </div>
  );
}