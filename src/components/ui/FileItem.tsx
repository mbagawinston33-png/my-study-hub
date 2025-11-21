"use client";

import { useState } from 'react';
import { Download, Trash2, Eye, AlertCircle, File } from 'lucide-react';
import { SubjectFile, FILE_TYPE_CONFIG } from '@/types/subject';
import { formatFileSize, formatDate, downloadFile, isPreviewable } from '@/lib/fileUtils';
import ConfirmModal from './ConfirmModal';

interface FileItemProps {
  file: SubjectFile;
  onDelete?: (fileId: string) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export default function FileItem({
  file,
  onDelete,
  showActions = true,
  compact = false,
  className = ''
}: FileItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fileConfig = FILE_TYPE_CONFIG[file.type] || FILE_TYPE_CONFIG.other;

  const handleDownload = async () => {
    if (isDownloading) return;

    try {
      setIsDownloading(true);
      downloadFile(file);
    } catch (error) {
} finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    if (isDeleting || !onDelete) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;

    try {
      setIsDeleting(true);
      await onDelete(file.id);
      setShowDeleteModal(false);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const handlePreview = () => {
    if (isPreviewable(file.type)) {
      window.open(file.url, '_blank');
    } else {
      // For non-previewable files, just download them
      handleDownload();
    }
  };

  const getItemHeight = () => {
    return compact ? 'auto' : '72px';
  };

  return (
    <div
      className={`file ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: compact ? '10px 12px' : '14px',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        background: 'var(--card)',
        transition: 'all 0.2s ease',
        minHeight: getItemHeight(),
        cursor: 'pointer'
      }}
      onClick={handlePreview}
    >
      {/* File icon */}
      <div
        className="file-icon"
        style={{
          width: compact ? '32px' : '36px',
          height: compact ? '32px' : '36px',
          borderRadius: '10px',
          background: `${fileConfig.color}15`,
          color: fileConfig.color,
          display: 'grid',
          placeItems: 'center',
          fontWeight: '700',
          fontSize: compact ? '11px' : '12px',
          flexShrink: 0,
          border: `1px solid ${fileConfig.color}30`
        }}
      >
        {fileConfig.icon}
      </div>

      {/* File info */}
      <div
        className="file-info"
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* File name */}
        <div
          className="file-name"
          style={{
            fontWeight: '500',
            color: 'var(--text)',
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: compact ? '13px' : '14px'
          }}
          title={file.originalName}
        >
          {file.originalName}
        </div>

        {/* File metadata */}
        <div
          className="file-meta"
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
            fontSize: '11px',
            color: 'var(--text-2)'
          }}
        >
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span>{formatDate(file.uploadedAt)}</span>
          {!compact && (
            <>
              <span>•</span>
              <span style={{ textTransform: 'uppercase' }}>{file.type}</span>
            </>
          )}
          {file.isVerified && (
            <>
              <span>•</span>
              <span style={{ color: 'var(--ok)' }}>Verified</span>
            </>
          )}
        </div>

        {/* File description (if exists and not compact) */}
        {!compact && file.description && (
          <div
            className="file-description"
            style={{
              fontSize: '12px',
              color: 'var(--text-2)',
              marginTop: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={file.description}
          >
            {file.description}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div
          className="file-actions"
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            flexShrink: 0
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Preview/Open button */}
          <button
            onClick={handlePreview}
            className="btn ghost"
            style={{
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '32px',
              height: '32px'
            }}
            title={isPreviewable(file.type) ? 'Preview file' : 'Download file'}
          >
            {isPreviewable(file.type) ? (
              <Eye size={14} />
            ) : (
              <Download size={14} />
            )}
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn ghost subtle"
            style={{
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '32px',
              height: '32px',
              opacity: isDownloading ? 0.6 : 1
            }}
            title="Download file"
          >
            {isDownloading ? (
              <div style={{
                width: '14px',
                height: '14px',
                border: '2px solid var(--brand)',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <Download size={14} />
            )}
          </button>

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn ghost"
              style={{
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '32px',
                height: '32px',
                color: isDeleting ? 'var(--text-2)' : 'var(--danger)',
                opacity: isDeleting ? 0.6 : 1
              }}
              title="Delete file"
            >
              {isDeleting ? (
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid var(--danger)',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .file:hover {
          border-color: var(--brand-300);
          background: var(--brand-100);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .file-actions button:hover {
          background: var(--card);
          border-color: var(--brand);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete File"
        message={`Are you sure you want to delete "${file.originalName}"? This action cannot be undone and will permanently remove the file from storage.`}
        confirmText="Delete File"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}