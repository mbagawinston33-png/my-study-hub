"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Task, TaskWithSubject, TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/types/task";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Tag,
  BookOpen,
  Download,
  ExternalLink
} from "lucide-react";

interface TaskCardProps {
  task: Task | TaskWithSubject;
  onToggleComplete?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  showActions?: boolean;
  compact?: boolean;
  highlighted?: boolean;
}

export default function TaskCard({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
  showActions = true,
  compact = false,
  highlighted = false
}: TaskCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isOverdue = task.dueDate.toDate() < new Date() && task.status !== 'completed';
  const statusConfig = TASK_STATUS_CONFIG[task.status];
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];

  // Scroll to highlighted task
  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlighted]);

  
  const handleToggleComplete = async () => {
    if (onToggleComplete && !isLoading) {
      setIsLoading(true);
      try {
        await onToggleComplete(task.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task.id);
    } else {
      router.push(`/dashboard/tasks/${task.id}/edit`);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const handleDownloadFile = (file: any) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.originalName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDueDate = () => {
    const dueDate = task.dueDate.toDate();
    const now = new Date();
    const isToday = dueDate.toDateString() === now.toDateString();
    const isTomorrow = dueDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

    if (isToday) {
      return `Today at ${dueDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${dueDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`;
    } else {
      return dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const cardStyle = compact ? {
    padding: '12px 16px',
    fontSize: '14px'
  } : {
    padding: '16px'
  };

  return (
    <div
      ref={cardRef}
      className={`card ${task.status === 'completed' ? 'opacity-75' : ''} ${isOverdue ? 'border-red-200' : ''} ${highlighted ? 'highlighted-task' : ''}`}
      style={{
        ...cardStyle,
        ...(highlighted && {
          border: '2px solid var(--brand)',
          backgroundColor: 'var(--brand-50)',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)'
        })
      }}
    >
      <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
        {/* Status Icon */}
        <button
          onClick={handleToggleComplete}
          disabled={isLoading}
          className="btn ghost"
          style={{
            padding: '4px',
            borderRadius: '50%',
            color: task.status === 'completed' ? 'var(--ok)' : isOverdue ? 'var(--danger)' : 'var(--text-2)',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          title={task.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}
        >
          {task.status === 'completed' ? (
            <CheckCircle2 size={20} />
          ) : isOverdue ? (
            <AlertTriangle size={20} />
          ) : (
            <Circle size={20} />
          )}
        </button>

        {/* Task Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title and Priority */}
          <div className="row" style={{ gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <h4
              style={{
                margin: 0,
                fontSize: compact ? '14px' : '16px',
                fontWeight: '600',
                color: task.status === 'completed' ? 'var(--text-2)' : 'var(--text)',
                textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {task.title}
            </h4>

            <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
              {/* Files Badge */}
              {task.attachedFiles && task.attachedFiles.length > 0 && (
                <span
                  className="badge"
                  style={{
                    background: 'var(--brand-100)',
                    color: 'var(--brand)',
                    border: `1px solid var(--brand-200)`,
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {task.attachedFiles.length}
                </span>
              )}

              {/* Priority Badge */}
              <span
                className="badge"
                style={{
                  background: priorityConfig.bg,
                  color: priorityConfig.color,
                  border: `1px solid ${priorityConfig.color}20`,
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}
              >
                {priorityConfig.label}
              </span>
            </div>
          </div>

          {/* Description */}
          {task.description && !compact && (
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: 'var(--text-2)',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {task.description}
            </p>
          )}

          {/* Metadata */}
          <div className="row" style={{ gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Due Date */}
            <div className="row" style={{ gap: '4px', color: isOverdue ? 'var(--danger)' : 'var(--text-2)', fontSize: '12px' }}>
              <Calendar size={14} />
              <span>{formatDueDate()}</span>
            </div>

            {/* Subject */}
            {(task as TaskWithSubject).subject && !compact && (
              <div className="row" style={{ gap: '4px', color: 'var(--text-2)', fontSize: '12px' }}>
                <BookOpen size={14} />
                <span>{(task as TaskWithSubject).subject?.name}</span>
              </div>
            )}

            {/* Files */}
            {task.attachedFiles && task.attachedFiles.length > 0 && !compact && (
              <div
                className="row"
                style={{
                  gap: '4px',
                  color: 'var(--text-2)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => setShowFiles(!showFiles)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FileText size={14} />
                <span>{task.attachedFiles.length} file{task.attachedFiles.length !== 1 ? 's' : ''}</span>
                <ExternalLink size={12} style={{ marginLeft: '2px' }} />
              </div>
            )}

            {/* Files Badge for Compact Mode */}
            {task.attachedFiles && task.attachedFiles.length > 0 && compact && (
              <span
                className="badge"
                style={{
                  background: 'var(--brand-100)',
                  color: 'var(--brand)',
                  border: `1px solid var(--brand-200)`,
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}
              >
                {task.attachedFiles.length}
              </span>
            )}

            {/* Status Badge */}
            {!compact && (
              <span
                className="badge"
                style={{
                  background: statusConfig.bg,
                  color: statusConfig.color,
                  border: `1px solid ${statusConfig.color}20`,
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}
              >
                {statusConfig.icon} {statusConfig.label}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && !compact && (
          <div className="row" style={{ gap: '4px', alignItems: 'center' }}>
            <button
              onClick={handleEdit}
              className="btn ghost"
              style={{ padding: '6px', borderRadius: '6px' }}
              title="Edit task"
            >
              <Edit size={16} style={{ color: 'var(--text-2)' }} />
            </button>
            <button
              onClick={handleDelete}
              className="btn ghost"
              style={{ padding: '6px', borderRadius: '6px' }}
              title="Delete task"
            >
              <Trash2 size={16} style={{ color: 'var(--danger)' }} />
            </button>
          </div>
        )}
      </div>

      {/* Overdue Indicator */}
      {isOverdue && !compact && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'var(--danger-100)',
            border: '1px solid var(--danger-200)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <AlertTriangle size={14} />
          <span>This task is overdue</span>
        </div>
      )}

      {/* File List */}
      {showFiles && task.attachedFiles && task.attachedFiles.length > 0 && !compact && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '8px', color: 'var(--text)' }}>
            Attached Files ({task.attachedFiles.length}):
          </div>
          {task.attachedFiles.map((file, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                marginBottom: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onClick={() => handleDownloadFile(file)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                <FileText size={14} style={{ color: 'var(--text-2)', flexShrink: 0 }} />
                <span
                  style={{
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={file.originalName}
                >
                  {file.originalName}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-2)', fontSize: '10px' }}>
                  {formatFileSize(file.size)}
                </span>
                <Download size={12} style={{ color: 'var(--brand)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}