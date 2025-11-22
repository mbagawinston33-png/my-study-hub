"use client";

import { useRouter } from 'next/navigation';
import { SearchResult, SearchResultType, SEARCH_CONFIG } from '@/types/search';
import {
  CheckCircle,
  BookOpen,
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  Tag,
  User,
  ExternalLink,
  Download
} from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
  onResultClick?: (result: SearchResult) => void;
}

export default function SearchResults({
  results,
  query,
  isLoading = false,
  onResultClick
}: SearchResultsProps) {
  const router = useRouter();

  const handleResultClick = (result: SearchResult) => {
    // Call cleanup callback if provided
    if (onResultClick) {
      onResultClick(result);
    }

    // Navigate based on result type
    switch (result.type) {
      case 'task':
        // Navigate to tasks page with highlight parameter
        router.push(`/dashboard/tasks?highlight=${result.id}`);
        break;
      case 'subject':
        // Navigate to subjects page with highlight parameter
        router.push(`/dashboard/subjects?highlight=${result.id}`);
        break;
      case 'reminder':
        // Navigate to reminders page with highlight parameter
        router.push(`/dashboard/reminders?highlight=${result.id}`);
        break;
      case 'file':
        // Navigate to subject page with file tab and highlight
        const subjectId = result.metadata.subjectId as string;
        router.push(`/dashboard/subjects?highlight=${subjectId}&tab=files&file=${result.id}`);
        break;
    }
  };

  const getTypeIcon = (type: SearchResultType) => {
    const iconMap = {
      task: CheckCircle,
      subject: BookOpen,
      reminder: Calendar,
      file: FileText
    };
    return iconMap[type] || FileText;
  };

  const getTypeColor = (type: SearchResultType) => {
    const colorMap = {
      task: 'var(--brand)',
      subject: 'var(--ok)',
      reminder: 'var(--warn)',
      file: 'var(--text-2)'
    };
    return colorMap[type] || 'var(--text-2)';
  };

  
  const getStatusBadge = (result: SearchResult) => {
    switch (result.type) {
      case 'task':
        const task = result.data as any;
        const taskBorderColor = task.status === 'completed' ? '1px solid var(--ok-200)' :
                               task.status === 'overdue' ? '1px solid var(--danger-200)' : '1px solid var(--border)';
        return (
          <span
            className="badge"
            style={{
              background: task.status === 'completed' ? 'var(--ok-100)' :
                         task.status === 'overdue' ? 'var(--danger-100)' : 'var(--text-3)',
              color: task.status === 'completed' ? 'var(--ok)' :
                     task.status === 'overdue' ? 'var(--danger)' : 'var(--text)',
              border: taskBorderColor,
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '500'
            }}
          >
            {task.status === 'completed' ? '✓ Completed' :
             task.status === 'overdue' ? '⚠ Overdue' : '⏳ Pending'}
          </span>
        );

      case 'reminder':
        const reminder = result.data as any;
        return (
          <span
            className="badge"
            style={{
              background: reminder.isCompleted ? 'var(--ok-100)' : 'var(--brand-100)',
              color: reminder.isCompleted ? 'var(--ok)' : 'var(--brand)',
              border: `1px solid ${reminder.isCompleted ? 'var(--ok-200)' : 'var(--brand-200)'}`,
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '500'
            }}
          >
            {reminder.isCompleted ? '✓ Done' : '⏰ Due'}
          </span>
        );

      case 'subject':
        const subject = result.data as any;
        return (
          <span
            className="badge"
            style={{
              background: subject.isActive ? 'var(--ok-100)' : 'var(--text-3)',
              color: subject.isActive ? 'var(--ok)' : 'var(--text-2)',
              border: `1px solid ${subject.isActive ? 'var(--ok-200)' : 'var(--border)'}`,
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '500'
            }}
          >
            {subject.isActive ? '● Active' : '○ Inactive'}
          </span>
        );

      case 'file':
        const file = result.data as any;
        return (
          <span
            className="badge"
            style={{
              background: 'var(--brand-100)',
              color: 'var(--brand)',
              border: '1px solid var(--brand-200)',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}
          >
            {file.type}
          </span>
        );

      default:
        return null;
    }
  };

  const getMetadata = (result: SearchResult) => {
    const metadata: React.ReactNode[] = [];

    switch (result.type) {
      case 'task':
        if (result.metadata.dueDate) {
          metadata.push(
            <div key="dueDate" className="row" style={{ gap: '4px', color: 'var(--text-2)', fontSize: '12px' }}>
              <Clock size={12} />
              <span>Due {result.metadata.dueDate}</span>
            </div>
          );
        }
        if (result.metadata.subjectName) {
          metadata.push(
            <div key="subject" className="row" style={{ gap: '4px', color: 'var(--text-2)', fontSize: '12px' }}>
              <BookOpen size={12} />
              <span>{result.metadata.subjectName}</span>
            </div>
          );
        }
        if (result.metadata.priority) {
          metadata.push(
            <div key="priority" className="row" style={{ gap: '4px', color: 'var(--text-2)', fontSize: '12px' }}>
              <Tag size={12} />
              <span>{result.metadata.priority} priority</span>
            </div>
          );
        }
        break;

      case 'subject':
        if ('code' in result.data && (result.data as any).code) {
          metadata.push(
            <span key="code" className="badge" style={{
              background: `${result.metadata.color}20`,
              color: result.metadata.color as string,
              border: `1px solid ${result.metadata.color}40`,
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {(result.data as any).code}
            </span>
          );
        }
        if ('teacher' in result.data && (result.data as any).teacher) {
          metadata.push(
            <div key="teacher" className="row" style={{ gap: '4px', color: 'var(--text-2)', fontSize: '12px' }}>
              <User size={12} />
              <span>Prof. {(result.data as any).teacher}</span>
            </div>
          );
        }
        break;

      case 'reminder':
        if (result.metadata.dueDate) {
          metadata.push(
            <div key="dueDate" className="row" style={{ gap: '4px', color: 'var(--text-2)', fontSize: '12px' }}>
              <Clock size={12} />
              <span>{result.metadata.dueDate}</span>
            </div>
          );
        }
        break;

      case 'file':
        if (result.metadata.size) {
          metadata.push(
            <span key="size" style={{ fontSize: '12px', color: 'var(--text-2)' }}>
              {result.metadata.size}
            </span>
          );
        }
        if (result.metadata.subjectName) {
          metadata.push(
            <div key="subject" className="row" style={{ gap: '4px', color: 'var(--text-2)', fontSize: '12px' }}>
              <BookOpen size={12} />
              <span>{result.metadata.subjectName}</span>
            </div>
          );
        }
        break;
    }

    return metadata;
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--border)',
          borderTop: '2px solid var(--brand)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px'
        }} />
        <div style={{ color: 'var(--text-2)', fontSize: '14px' }}>
          Searching...
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 16px',
          borderRadius: '12px',
          background: 'var(--text-3)',
          color: 'var(--text-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FileText size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--text)' }}>
          No results found
        </h3>
        <p style={{ margin: '0 0 16px', color: 'var(--text-2)', fontSize: '14px' }}>
          {query ? `No results for "${query}"` : 'Try searching for tasks, subjects, reminders, or files'}
        </p>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
          Tips: Search by title, description, subject name, or file name
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {results.map((result) => {
        const Icon = getTypeIcon(result.type);
        const typeColor = getTypeColor(result.type);

        return (
          <div
            key={`${result.type}-${result.id}`}
            className="card"
            style={{
              padding: '16px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderLeft: `4px solid ${typeColor}`,
              position: 'relative',
              borderRadius: '8px',
              margin: '4px 8px'
            }}
            onClick={() => handleResultClick(result)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover)';
              e.currentTarget.style.transform = 'translateX(2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)';
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div className="row" style={{ gap: '16px', alignItems: 'flex-start' }}>
              {/* Icon */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: `${typeColor}15`,
                color: typeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                <Icon size={16} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title and Type Badge */}
                <div className="row" style={{
                  gap: '10px',
                  alignItems: 'center',
                  marginBottom: '8px',
                  flexWrap: 'wrap'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {result.title}
                  </h4>
                  {getStatusBadge(result)}
                </div>

                {/* Description */}
                {result.description && (
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '13px',
                    color: 'var(--text-2)',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {result.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="row" style={{ gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {getMetadata(result)}
                </div>

                {/* Breadcrumb */}
                {result.breadcrumbs && result.breadcrumbs.length > 1 && (
                  <div className="row" style={{
                    gap: '6px',
                    alignItems: 'center',
                    marginTop: '10px',
                    fontSize: '11px',
                    color: 'var(--text-3)'
                  }}>
                    {result.breadcrumbs.slice(0, 2).map((crumb, index) => (
                      <div key={index} className="row" style={{ gap: '4px', alignItems: 'center' }}>
                        <span>{crumb.label}</span>
                        {index < result.breadcrumbs.slice(0, 2).length - 1 && (
                          <span style={{ opacity: 0.5 }}>›</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}