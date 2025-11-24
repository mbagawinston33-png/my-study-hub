"use client";

import { useState, useCallback, useEffect } from "react";
import { SubjectFile } from "@/types/subject";
import { validateSubjectFile } from "@/lib/subjectFiles";
import { getFileValidationRules, createValidationRulesFromAdminConfig } from '@/lib/adminConfig';
import { DEFAULT_FILE_VALIDATION_RULES, FileValidationRules } from '@/types/subject';
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Trash2,
  FolderOpen
} from "lucide-react";
import FilePreviewModal from "@/components/ui/FilePreviewModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { deleteSubjectFile } from "@/lib/subjectFiles";

interface SubjectFileUploadProps {
  subjectId?: string; // Optional during subject creation
  userId: string;
  onFilesChange: (files: File[]) => void;
  onUploadProgress?: (progress: number) => void;
  maxFiles?: number;
  disabled?: boolean;
  validationRules?: FileValidationRules;
  onFileDelete?: (fileId: string) => void; // New callback for when a file is deleted
  showExistingFiles?: boolean; // Whether to show existing files section
  existingFiles?: SubjectFile[]; // Existing subject files
}

export default function SubjectFileUpload({
  subjectId,
  userId,
  onFilesChange,
  onUploadProgress,
  maxFiles = 10,
  disabled = false,
  validationRules = DEFAULT_FILE_VALIDATION_RULES,
  onFileDelete,
  showExistingFiles = false,
  existingFiles = []
}: SubjectFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<SubjectFile | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentValidationRules, setCurrentValidationRules] = useState<FileValidationRules>(validationRules);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    fileId: string | null;
    fileName: string;
  }>({
    isOpen: false,
    fileId: null,
    fileName: ''
  });

  // Load admin validation rules on component mount
  useEffect(() => {
    const loadValidationRules = async () => {
      try {
        const adminConfig = await getFileValidationRules();
        const rules = createValidationRulesFromAdminConfig(adminConfig);
        setCurrentValidationRules(rules);
      } catch (error) {
        console.error('Failed to load file validation rules:', error);
        // Fall back to provided rules or defaults
        setCurrentValidationRules(validationRules);
      }
    };

    loadValidationRules();
  }, [validationRules]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    const newErrors: Record<string, string> = {};

    // Check total file count limit
    if (existingFiles.length + selectedFiles.length + newFiles.length > maxFiles) {
      newErrors['general'] = `Maximum ${maxFiles} files allowed per subject`;
      setUploadErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }

    // Validate each file using current validation rules
    newFiles.forEach((file, index) => {
      const validation = validateSubjectFile(file, currentValidationRules);
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
  }, [disabled, existingFiles.length, selectedFiles.length, maxFiles, currentValidationRules, onFilesChange]);

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

  const handleDownloadExistingFile = (file: SubjectFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.originalName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewExistingFile = (file: SubjectFile) => {
    try {
      setPreviewFile(file);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Failed to preview file:', error);
    }
  };

  const handleDeleteFile = (file: SubjectFile) => {
    setDeleteConfirmModal({
      isOpen: true,
      fileId: file.id,
      fileName: file.originalName
    });
  };

  const handleConfirmDelete = async () => {
    const { fileId } = deleteConfirmModal;
    if (!fileId) return;

    try {
      await deleteSubjectFile(userId, fileId);

      // Notify parent component about the deletion
      if (onFileDelete) {
        onFileDelete(fileId);
      }

      // Close the confirmation modal
      setDeleteConfirmModal({ isOpen: false, fileId: null, fileName: '' });

    } catch (error) {
      console.error('Failed to delete file:', error);
      // Close the modal even on error
      setDeleteConfirmModal({ isOpen: false, fileId: null, fileName: '' });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmModal({ isOpen: false, fileId: null, fileName: '' });
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

  const isPreviewable = (filename: string): boolean => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'md'];
    return previewableTypes.includes(extension || '');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('subject-file-input')?.click()}
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
          id="subject-file-input"
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
          {isDragging ? 'Drop files here' : 'Click to upload or drag and drop subject files'}
        </div>

        <div className="small" style={{ color: 'var(--text-2)' }}>
          Maximum {maxFiles} files • {(currentValidationRules.maxSizeBytes / (1024 * 1024)).toFixed(1)}MB per file
        </div>

        <div className="small" style={{ color: 'var(--text-2)', marginTop: '4px' }}>
          Supported: {currentValidationRules.allowedTypes.join(', ').toUpperCase()}
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
            New Files ({selectedFiles.length})
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
      {showExistingFiles && existingFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
            <FolderOpen size={14} style={{ display: 'inline-block', marginRight: '6px' }} />
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
              title="Subject files"
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
                {isPreviewable(file.originalName) && (
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
                )}
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
                  <Upload size={14} style={{ color: 'var(--ok)' }} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDeleteFile(file);
                  }}
                  className="btn ghost"
                  style={{ padding: '4px', borderRadius: '4px' }}
                  title="Delete file"
                >
                  <Trash2 size={14} style={{ color: 'var(--danger)' }} />
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
            Uploading subject files...
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Subject File"
        message={`Are you sure you want to delete "${deleteConfirmModal.fileName}" from this subject? This action cannot be undone and will permanently remove the file.`}
        confirmText="Delete File"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}