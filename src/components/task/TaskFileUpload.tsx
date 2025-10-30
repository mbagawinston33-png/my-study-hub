"use client";

import { useState, useCallback } from "react";
import { TaskFile } from "@/types/task";
import { validateTaskFile } from "@/lib/taskFiles";
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  Eye
} from "lucide-react";
import FilePreviewModal from "@/components/ui/FilePreviewModal";

interface TaskFileUploadProps {
  taskId: string;
  userId: string;
  existingFiles?: TaskFile[];
  onFilesChange: (files: File[]) => void;
  onUploadProgress?: (progress: number) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export default function TaskFileUpload({
  taskId,
  userId,
  existingFiles = [],
  onFilesChange,
  onUploadProgress,
  maxFiles = 10,
  disabled = false
}: TaskFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<TaskFile | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    const newErrors: Record<string, string> = {};

    // Check total file count limit
    if (existingFiles.length + selectedFiles.length + newFiles.length > maxFiles) {
      newErrors['general'] = `Maximum ${maxFiles} files allowed`;
      setUploadErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }

    // Validate each file
    newFiles.forEach((file, index) => {
      const validation = validateTaskFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        newErrors[`file-${Date.now()}-${index}`] = validation.error || 'Invalid file';
      }
    });

    if (validFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(updatedFiles);
      onFilesChange(updatedFiles);
      }

    if (Object.keys(newErrors).length > 0) {
      setUploadErrors(prev => ({ ...prev, ...newErrors }));
      // Auto-clear errors after 5 seconds
      setTimeout(() => {
        setUploadErrors(prev => {
          const updated = { ...prev };
          Object.keys(newErrors).forEach(key => delete updated[key]);
          return updated;
        });
      }, 5000);
    }
  }, [disabled, existingFiles.length, selectedFiles.length, maxFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFile = useCallback((index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    onFilesChange(updatedFiles);
    }, [selectedFiles, onFilesChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadExistingFile = (file: TaskFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.originalName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    };

  const handlePreviewExistingFile = (file: TaskFile) => {
    try {
      setPreviewFile(file);
      setShowPreviewModal(true);
    } catch (error) {
}
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText size={16} style={{ color: '#DC2626' }} />;
      case 'doc':
      case 'docx':
        return <FileText size={16} style={{ color: '#2563EB' }} />;
      case 'xls':
      case 'xlsx':
        return <FileText size={16} style={{ color: '#16A34A' }} />;
      case 'ppt':
      case 'pptx':
        return <FileText size={16} style={{ color: '#EA580C' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText size={16} style={{ color: '#9333EA' }} />;
      case 'zip':
      case 'rar':
        return <FileText size={16} style={{ color: '#A855F7' }} />;
      default:
        return <FileText size={16} style={{ color: '#6B7280' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--brand)' : 'var(--border)'}`,
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isDragging ? 'var(--brand-50)' : 'var(--bg)',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <input
          id="file-input"
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          style={{ display: 'none' }}
        />

        <Upload size={32} style={{
          color: isDragging ? 'var(--brand)' : 'var(--text-2)',
          marginBottom: '8px',
          margin: '0 auto 8px'
        }} />

        <div style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '4px' }}>
          {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
        </div>

        <div className="small" style={{ color: 'var(--text-2)' }}>
          Maximum {maxFiles} files • 10MB per file
        </div>

        <div className="small" style={{ color: 'var(--text-2)', marginTop: '4px' }}>
          Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, TXT, ZIP, RAR
        </div>
      </div>

      {/* Errors */}
      {Object.keys(uploadErrors).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(uploadErrors).map(([key, error]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--danger-100)',
                border: '1px solid var(--danger-200)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--danger)'
              }}
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
            Selected Files ({selectedFiles.length})
          </div>

          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px'
              }}
            >
              <div style={{ color: 'var(--text-2)' }}>
                {getFileIcon(file.name)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text)',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {file.name}
                </div>
                <div className="small" style={{ color: 'var(--text-2)' }}>
                  {formatFileSize(file.size)}
                </div>
              </div>

              <button
                onClick={() => removeFile(index)}
                disabled={disabled}
                className="btn ghost"
                style={{ padding: '4px', borderRadius: '4px' }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
            Existing Files ({existingFiles.length})
          </div>

          {existingFiles.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'var(--ok-50)',
                border: '1px solid var(--ok-200)',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              title="File attachments"
            >
              <div style={{ color: 'var(--ok)' }}>
                <CheckCircle size={16} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text)',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {file.originalName}
                </div>
                <div className="small" style={{ color: 'var(--text-2)' }}>
                  {formatFileSize(file.size)} • {file.type.toUpperCase()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handlePreviewExistingFile(file);
                  }}
                  className="btn ghost"
                  style={{ padding: '4px', borderRadius: '4px' }}
                  title="Preview file"
                >
                  <Eye size={14} style={{ color: 'var(--ok)' }} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDownloadExistingFile(file);
                  }}
                  className="btn ghost"
                  style={{ padding: '4px', borderRadius: '4px' }}
                  title="Download file"
                >
                  <Download size={14} style={{ color: 'var(--ok)' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          background: 'var(--brand-50)',
          border: '1px solid var(--brand-200)',
          borderRadius: '6px'
        }}>
          <Loader2 size={16} className="animate-spin" />
          <span style={{ fontSize: '13px', color: 'var(--brand)' }}>
            Uploading files...
          </span>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewFile(null);
        }}
        file={previewFile}
      />
    </div>
  );
}