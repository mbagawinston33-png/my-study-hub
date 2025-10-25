"use client";

import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, X, Upload, Loader2, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import FileUpload from '@/components/ui/FileUpload';
import FileList from '@/components/ui/FileList';
import { Subject, SubjectFile, DEFAULT_FILE_VALIDATION_RULES } from '@/types/subject';
import { uploadFile, getSubjectFiles, deleteFile } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

interface SubjectFilesModalProps {
  subject: Subject;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubjectFilesModal({
  subject,
  isOpen,
  onClose
}: SubjectFilesModalProps) {
  const { user } = useAuth();

  // State
  const [files, setFiles] = useState<SubjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load files when modal opens
  useEffect(() => {
    if (isOpen && user?.userId) {
      loadFiles();
    }
  }, [isOpen, user?.userId, subject.id]);

  const loadFiles = async () => {
    if (!user?.userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const subjectFiles = await getSubjectFiles(subject.id);
      setFiles(subjectFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Failed to load files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (!user?.userId) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const uploadedFiles: SubjectFile[] = [];

      // Upload files one by one to track progress
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = ((i + 1) / selectedFiles.length) * 100;
        setUploadProgress(progress);

        const uploadedFile = await uploadFile(
          file,
          subject.id,
          user.userId,
          (fileProgress) => {
            // Individual file progress (optional enhancement)
            const totalProgress = ((i + fileProgress / 100) / selectedFiles.length) * 100;
            setUploadProgress(totalProgress);
          }
        );

        
        uploadedFiles.push(uploadedFile);
      }

      // Update files list with new uploads
      setFiles(prev => [...uploadedFiles, ...prev]);

    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!user?.userId) return;

    try {
      await deleteFile(fileId, subject.id);

      // Remove file from local state
      setFiles(prev => prev.filter(file => file.id !== fileId));

    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file. Please try again.');
    }
  };

  const handleRetry = () => {
    setError(null);
    loadFiles();
  };

  // Calculate file statistics
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const fileCount = files.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Files: ${subject.name}`}
      size="large"
    >
      {/* Custom header with icon and badge */}
      <div className="row" style={{ alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <FolderOpen size={20} style={{ color: subject.color }} />
        <span style={{ flex: 1 }}>Manage files for <strong>{subject.name}</strong></span>
        <span className="badge" style={{
          background: `${subject.color}20`,
          color: subject.color,
          border: `1px solid ${subject.color}40`
        }}>
          {fileCount} file{fileCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
        {/* Upload area */}
        <div style={{ marginBottom: '24px' }}>
          <FileUpload
            onFilesSelected={handleFilesSelected}
            currentFileCount={fileCount}
            disabled={isUploading}
            dragActiveText="Drop files to upload"
            dragInactiveText="Add more files to this subject"
          />
        </div>

        {/* Upload progress */}
        {isUploading && (
          <div className="card" style={{
            background: 'var(--brand-100)',
            border: '1px solid var(--brand-200)',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div className="row" style={{ alignItems: 'center', gap: '12px' }}>
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', color: 'var(--brand-700)', marginBottom: '4px' }}>
                  Uploading files... {Math.round(uploadProgress)}%
                </div>
                <div style={{
                  height: '4px',
                  background: 'var(--brand-200)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: 'var(--brand)',
                    width: `${uploadProgress}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="card" style={{
            background: 'var(--danger)',
            color: 'white',
            padding: '12px',
            marginBottom: '16px',
            border: 'none'
          }}>
            <div className="row" style={{ alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                  {error}
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="btn ghost"
                style={{
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  fontSize: '12px'
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Files list */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: 'var(--text-2)'
            }}>
              <div className="row" style={{ alignItems: 'center', gap: '12px' }}>
                <Loader2 size={20} className="animate-spin" />
                <span>Loading files...</span>
              </div>
            </div>
          ) : (
            <FileList
              files={files}
              onDelete={handleDeleteFile}
              emptyMessage="No files uploaded to this subject yet"
              emptyIcon={<FolderOpen size={24} />}
              searchable={files.length > 5}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div className="small" style={{ color: 'var(--text-2)' }}>
            {fileCount > 0 ? (
              <>
                {fileCount} file{fileCount !== 1 ? 's' : ''}
                {totalSize > 0 ? (
                  <> • {(totalSize / (1024 * 1024)).toFixed(1)} MB total</>
                ) : (
                  <> • Calculating size...</>
                )}
              </>
            ) : (
              'No files yet'
            )}
          </div>

          <button
            onClick={onClose}
            className="btn"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                Uploading...
              </>
            ) : (
              'Done'
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes animate-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: animate-spin 1s linear infinite;
        }
      `}</style>
    </Modal>
  );
}