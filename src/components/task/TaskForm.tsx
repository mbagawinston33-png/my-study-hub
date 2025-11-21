"use client";

import { useState, useEffect } from "react";
import { Task, TaskFormData, TaskPriority, TaskFile } from "@/types/task";
import { Subject } from "@/types/subject";
import { TASK_PRIORITY_CONFIG } from "@/types/task";
import {
  Calendar,
  Clock,
  AlertCircle,
  Tag,
  BookOpen,
  FileText,
  X,
  Paperclip
} from "lucide-react";
import TaskFileUpload from "@/components/task/TaskFileUpload";

interface TaskFormProps {
  task?: Task;
  subjects: Subject[];
  onSubmit: (data: TaskFormData, files: File[], existingFiles: TaskFile[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  taskId?: string;
  userId?: string;
}

export default function TaskForm({
  task,
  subjects,
  onSubmit,
  onCancel,
  isLoading = false,
  taskId,
  userId
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    dueDate: task ? (() => {
      const date = task.dueDate.toDate();
      // FIX: Use local time formatting for datetime-local input instead of UTC conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    })() : '',
    priority: task?.priority || 'medium',
    subjectId: task?.subjectId || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentTaskFiles, setCurrentTaskFiles] = useState<TaskFile[]>(task?.attachedFiles || []);

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length < 1) {
      newErrors.title = 'Task title must be at least 1 character';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Task title must be less than 100 characters';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const dueDate = new Date(formData.dueDate);
      const now = new Date();
      if (dueDate < now && !task) { // Allow past dates for existing tasks
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    // Clear error for this field if user is typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle file deletion from task
  const handleFileDelete = (fileId: string) => {
    setCurrentTaskFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      title: true,
      description: true,
      dueDate: true,
      priority: true,
      subjectId: true
    });

    if (validateForm()) {
            try {
        await onSubmit(formData, selectedFiles, currentTaskFiles);
              } catch (error) {
              }
    } else {
          }
  };

  // Get minimum date for datetime input (current date)
  const getMinDateTime = () => {
    const now = new Date();
    // Use local time formatting for consistency with the fix above
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title */}
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
          Task Title *
        </label>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-2)'
            }}
          >
            <FileText size={16} />
          </div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
            placeholder="Enter task title..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: `1px solid ${errors.title && touched.title ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--text)',
              background: 'var(--bg)',
              outline: errors.title && touched.title ? '2px solid var(--danger)' : 'none'
            }}
            disabled={isLoading}
          />
        </div>
        {errors.title && touched.title && (
          <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} />
            {errors.title}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
          placeholder="Add task details (optional)..."
          rows={4}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${errors.description && touched.description ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: '8px',
            fontSize: '14px',
            color: 'var(--text)',
            background: 'var(--bg)',
            resize: 'vertical',
            outline: errors.description && touched.description ? '2px solid var(--danger)' : 'none'
          }}
          disabled={isLoading}
        />
        {errors.description && touched.description && (
          <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} />
            {errors.description}
          </div>
        )}
        {formData.description && (
          <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-2)' }}>
            {formData.description.length}/500 characters
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
        {/* Due Date */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
            Due Date & Time *
          </label>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-2)',
                zIndex: 1
              }}
            >
              <Calendar size={16} />
            </div>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, dueDate: true }))}
              min={task ? undefined : getMinDateTime()}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: `1px solid ${errors.dueDate && touched.dueDate ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--text)',
                background: 'var(--bg)',
                outline: errors.dueDate && touched.dueDate ? '2px solid var(--danger)' : 'none'
              }}
              disabled={isLoading}
            />
          </div>
          {errors.dueDate && touched.dueDate && (
            <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} />
              {errors.dueDate}
            </div>
          )}
        </div>

        {/* Priority */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
            Priority
          </label>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-2)',
                zIndex: 1
              }}
            >
              <Tag size={16} />
            </div>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as TaskPriority)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--text)',
                background: 'var(--bg)',
                appearance: 'none',
                cursor: 'pointer'
              }}
              disabled={isLoading}
            >
              {Object.entries(TASK_PRIORITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subject */}
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
          Subject (Optional)
        </label>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-2)',
              zIndex: 1
            }}
          >
            <BookOpen size={16} />
          </div>
          <select
            value={formData.subjectId}
            onChange={(e) => handleInputChange('subjectId', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--text)',
              background: 'var(--bg)',
              appearance: 'none',
              cursor: 'pointer'
            }}
            disabled={isLoading}
          >
            <option value="">No subject selected</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name} {subject.code && `(${subject.code})`}
              </option>
            ))}
          </select>
        </div>
        {subjects.length === 0 && (
          <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-2)' }}>
            No subjects available. <a href="/dashboard/subjects/new" style={{ color: 'var(--brand)' }}>Create a subject</a> to link tasks to it.
          </div>
        )}
      </div>

      {/* File Attachments */}
      <div>
        <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Paperclip size={16} />
          Attachments (Optional)
        </label>

        <TaskFileUpload
          taskId={taskId || ''}
          userId={userId || ''}
          existingFiles={currentTaskFiles}
          onFilesChange={(files) => {
                        setSelectedFiles(files);
          }}
          onFileDelete={handleFileDelete}
          disabled={isLoading}
        />
      </div>

      {/* Priority Preview */}
      <div style={{
        padding: '12px 16px',
        background: TASK_PRIORITY_CONFIG[formData.priority].bg,
        border: `1px solid ${TASK_PRIORITY_CONFIG[formData.priority].color}20`,
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: TASK_PRIORITY_CONFIG[formData.priority].color
            }}
          />
          <span style={{ color: TASK_PRIORITY_CONFIG[formData.priority].color, fontWeight: '500' }}>
            {TASK_PRIORITY_CONFIG[formData.priority].label} Priority
          </span>
        </div>
      </div>

      {/* Form Actions */}
      <div className="row" style={{ gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn ghost"
          disabled={isLoading}
          style={{ padding: '10px 20px' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn"
          disabled={isLoading}
          style={{ padding: '10px 20px', minWidth: '100px' }}
        >
          {isLoading ? (
            <div className="row" style={{ gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%' }} />
              Saving...
            </div>
          ) : (
            task ? 'Update Task' : 'Create Task'
          )}
        </button>
      </div>
    </form>
  );
}