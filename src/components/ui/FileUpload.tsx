"use client";

import { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, File } from 'lucide-react';
import { DEFAULT_FILE_VALIDATION_RULES, FileValidationError, FILE_TYPE_CONFIG } from '@/types/subject';
import { validateFiles } from '@/lib/fileUtils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  currentFileCount?: number;
  validationRules?: typeof DEFAULT_FILE_VALIDATION_RULES;
  disabled?: boolean;
  maxFiles?: number;
  acceptedTypes?: string;
  dragActiveText?: string;
  dragInactiveText?: string;
}

export default function FileUpload({
  onFilesSelected,
  currentFileCount = 0,
  validationRules = DEFAULT_FILE_VALIDATION_RULES,
  disabled = false,
  maxFiles = validationRules.maxFilesPerSubject,
  acceptedTypes,
  dragActiveText = "Drop files here",
  dragInactiveText = "Drag & drop files here, or click to browse"
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate accept attribute string from allowed types
  const getAcceptAttribute = (): string => {
    if (acceptedTypes) return acceptedTypes;

    const acceptList: string[] = [];

    // Add both MIME types and extensions for better browser compatibility
    Object.entries(validationRules.allowedTypes).forEach(([type]) => {
      // Add file extension
      const extension = type.startsWith('.') ? type : `.${type}`;
      acceptList.push(extension);

      // Add MIME types from FILE_TYPE_CONFIG
      if (type in FILE_TYPE_CONFIG && FILE_TYPE_CONFIG[type as keyof typeof FILE_TYPE_CONFIG].mime) {
        FILE_TYPE_CONFIG[type as keyof typeof FILE_TYPE_CONFIG].mime.forEach((mimeType: string) => {
          acceptList.push(mimeType);
        });
      }
    });

    return acceptList.join(',');
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [disabled]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);

    // Reset the input value so the same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process and validate files
  const processFiles = (files: File[]) => {
    // Check if adding these files would exceed the max limit
    if (currentFileCount + files.length > maxFiles) {
      setValidationErrors([{
        file: files[0], // Use first file as reference
        message: `Cannot add ${files.length} file(s). Maximum ${maxFiles} files allowed per subject.`,
        type: 'count'
      }]);
      return;
    }

    // Validate files
    const { valid, errors } = validateFiles(files, validationRules, currentFileCount);

    if (errors.length > 0) {
      setValidationErrors(errors);
    }

    if (valid.length > 0) {
      setValidationErrors([]); // Clear errors on successful upload
      onFilesSelected(valid);
    }
  };

  // Open file browser
  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Clear validation errors
  const clearErrors = () => {
    setValidationErrors([]);
  };

  return (
    <div className="file-upload-container">
      {/* Upload area */}
      <div
        className={`file-upload-area ${isDragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={openFileDialog}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--brand)' : 'var(--border)'}`,
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isDragActive ? 'var(--brand-100)' : 'var(--card)',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Upload icon */}
        <div style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 16px',
          borderRadius: '12px',
          background: isDragActive ? 'var(--brand)' : 'var(--brand-100)',
          color: isDragActive ? 'white' : 'var(--brand-700)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}>
          <Upload size={24} />
        </div>

        {/* Text */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '500',
            color: 'var(--text)',
            marginBottom: '4px'
          }}>
            {isDragActive ? dragActiveText : dragInactiveText}
          </div>
          <div className="small" style={{ color: 'var(--text-2)' }}>
            Max {validationRules.maxSizeBytes / (1024 * 1024)}MB per file
          </div>
        </div>

        {/* File types info */}
        <div className="small" style={{ color: 'var(--text-2)' }}>
          Supported: {validationRules.allowedTypes.join(', ').toUpperCase()}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAcceptAttribute()}
          onChange={handleFileInputChange}
          disabled={disabled}
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0
          }}
        />
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div className="card" style={{
            background: 'var(--danger)',
            color: 'white',
            padding: '12px',
            border: 'none'
          }}>
            <div className="row" style={{ alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', marginBottom: '8px' }}>
                  Upload Errors ({validationErrors.length})
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                  {validationErrors.map((error, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      • {error.file.name}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={clearErrors}
                className="btn ghost"
                style={{
                  padding: '4px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File count indicator */}
      {currentFileCount > 0 && (
        <div className="small" style={{
          marginTop: '8px',
          color: 'var(--text-2)',
          textAlign: 'center'
        }}>
          {currentFileCount} of {maxFiles} files uploaded
        </div>
      )}

      <style jsx>{`
        .file-upload-area:hover:not(.disabled) {
          border-color: var(--brand);
          background: var(--brand-100);
        }

        .file-upload-area.drag-active {
          transform: scale(1.02);
        }

        .file-upload-area.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .file-upload-area.drag-active {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}