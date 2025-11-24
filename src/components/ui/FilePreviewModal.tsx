"use client";

import { useState } from "react";
import Modal from "./Modal";
import {
  Download,
  ExternalLink,
  X,
  FileText,
  Image as ImageIcon,
  File
} from "lucide-react";

// Generic file interface that works with both TaskFile and SubjectFile
interface BaseFile {
  id: string;
  userId: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  url: string;
  storagePath: string;
  uploadedAt: any; // Firebase Timestamp
}

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: BaseFile | null;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  file
}: FilePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension || '')) {
      return <ImageIcon size={24} />;
    }
    if (['pdf'].includes(extension || '')) {
      return <FileText size={24} />;
    }
    return <File size={24} />;
  };

  const isPreviewable = (file: BaseFile): boolean => {
    const extension = file.originalName.split('.').pop()?.toLowerCase();
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'md', 'json', 'xml', 'csv'];
    return previewableTypes.includes(extension || '');
  };

  const handleDownload = () => {
    if (!file) {
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.originalName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
}
  };

  const handlePreview = () => {
    if (!file) {
      return;
    }

    const previewable = isPreviewable(file);

    try {
      if (previewable) {
        window.open(file.url, '_blank');
      } else {
        handleDownload();
      }
    } catch (error) {
}
  };

  const getFileTypeLabel = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension?.toUpperCase() || 'FILE';
  };

  const renderFilePreview = (file: BaseFile) => {
    const extension = file.originalName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
      case 'webp':
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <img
              src={file.url}
              alt={file.originalName}
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onLoad={() => {}}
              onError={(e) => {
setError('Failed to load image');
              }}
            />
            <div style={{ marginTop: '12px', color: 'var(--text-2)', fontSize: '14px' }}>
              Image Preview
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div style={{ width: '100%', height: '500px', textAlign: 'center' }}>
            <iframe
              src={file.url}
              title={file.originalName}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onLoad={() => {}}
              onError={(e) => {
setError('Failed to load PDF');
              }}
            />
            <div style={{ marginTop: '12px', color: 'var(--text-2)', fontSize: '14px' }}>
              PDF Preview
            </div>
          </div>
        );

      case 'txt':
      case 'md':
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ color: 'var(--text-2)', marginBottom: '16px' }}>
              Text files cannot be previewed inline due to security restrictions
            </div>
            <button
              onClick={handlePreview}
              className="btn"
              style={{ padding: '8px 16px' }}
            >
              Open in new tab
            </button>
          </div>
        );

      default:
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            {getFileIcon(file.originalName)}
            <div style={{ marginTop: '12px', color: 'var(--text)' }}>
              Preview not available for this file type
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-2)' }}>
              Use the download button to view this file
            </div>
          </div>
        );
    }
  };

  if (!file) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={file.originalName}
      size="large"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* File Info */}
        <div style={{
          padding: '12px',
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ color: 'var(--text-2)' }}>
              {getFileIcon(file.originalName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', wordBreak: 'break-word' }}>
                {file.originalName}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px' }}>
                Type
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
                {getFileTypeLabel(file.originalName)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px' }}>
                Size
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div style={{
          minHeight: '300px',
          maxHeight: '500px',
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto'
        }}>
          {isPreviewable(file) ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderFilePreview(file)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              {getFileIcon(file.originalName)}
              <div style={{ marginTop: '12px', color: 'var(--text-2)' }}>
                This file type cannot be previewed
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-2)' }}>
                Download to view the content
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px',
            background: 'var(--danger-100)',
            border: '1px solid var(--danger-200)',
            borderRadius: '6px',
            color: 'var(--danger)',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn ghost"
            style={{ padding: '8px 16px' }}
          >
            Close
          </button>

          <button
            onClick={handleDownload}
            className="btn"
            style={{ padding: '8px 16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={16} />
              Download
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
}