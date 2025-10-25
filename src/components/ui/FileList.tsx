"use client";

import { useState, useMemo } from 'react';
import { Search, SortAsc, SortDesc, Filter, File, FolderOpen } from 'lucide-react';
import { SubjectFile, FileType } from '@/types/subject';
import { sortFiles, filterFiles, getFileCategory } from '@/lib/fileUtils';
import FileItem from './FileItem';

interface FileListProps {
  files: SubjectFile[];
  onDelete?: (fileId: string) => void;
  showActions?: boolean;
  compact?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

type SortBy = 'name' | 'date' | 'size' | 'type';
type SortDirection = 'asc' | 'desc';

export default function FileList({
  files,
  onDelete,
  showActions = true,
  compact = false,
  searchable = true,
  sortable = true,
  filterable = true,
  emptyMessage = "No files uploaded yet",
  emptyIcon
}: FileListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedType, setSelectedType] = useState<FileType | 'all'>('all');

  // Get unique file types for filtering
  const availableTypes = useMemo(() => {
    const types = new Set<FileType>();
    files.forEach(file => types.add(file.type));
    return Array.from(types).sort();
  }, [files]);

  // Filter and sort files
  const processedFiles = useMemo(() => {
    let result = files;

    // Apply search filter
    if (searchTerm) {
      result = filterFiles(result, searchTerm);
    }

    // Apply type filter
    if (selectedType !== 'all') {
      result = filterFiles(result, '', selectedType);
    }

    // Apply sorting
    result = sortFiles(result, sortBy, sortDirection);

    return result;
  }, [files, searchTerm, selectedType, sortBy, sortDirection]);

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Group files by category (optional)
  const groupedFiles = useMemo(() => {
    if (!filterable || selectedType !== 'all') {
      return { 'All Files': processedFiles };
    }

    const groups: Record<string, SubjectFile[]> = {};
    processedFiles.forEach(file => {
      const category = getFileCategory(file.type);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(file);
    });

    return groups;
  }, [processedFiles, filterable, selectedType]);

  // Calculate file statistics
  const fileStats = useMemo(() => {
    const totalSize = processedFiles.reduce((sum, file) => sum + file.size, 0);
    const fileCount = processedFiles.length;
    return { totalSize, fileCount };
  }, [processedFiles]);

  if (files.length === 0) {
    return (
      <div className="file-list-empty" style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: 'var(--text-2)'
      }}>
        <div style={{ marginBottom: '16px' }}>
          {emptyIcon || (
            <div style={{
              width: '48px',
              height: '48px',
              margin: '0 auto',
              borderRadius: '12px',
              background: 'var(--brand-100)',
              color: 'var(--brand-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FolderOpen size={24} />
            </div>
          )}
        </div>
        <h3 style={{ margin: '0 0 8px', color: 'var(--text)' }}>
          {emptyMessage}
        </h3>
        <p className="small">
          Upload files to get started with your subject materials
        </p>
      </div>
    );
  }

  return (
    <div className="file-list">
      {/* Controls */}
      {(searchable || sortable || filterable) && (
        <div className="file-list-controls" style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          {searchable && (
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-2)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--card)',
                    color: 'var(--text)'
                  }}
                />
              </div>
            </div>
          )}

          {/* Sort */}
          {sortable && (
            <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
              <label className="small" style={{ color: 'var(--text-2)', margin: 0 }}>
                Sort:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                style={{
                  padding: '6px 8px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--card)',
                  color: 'var(--text)'
                }}
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="type">Type</option>
              </select>
              <button
                onClick={toggleSortDirection}
                className="btn ghost"
                style={{ padding: '6px' }}
                title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
              </button>
            </div>
          )}

          {/* Filter */}
          {filterable && availableTypes.length > 1 && (
            <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
              <label className="small" style={{ color: 'var(--text-2)', margin: 0 }}>
                Type:
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as FileType | 'all')}
                style={{
                  padding: '6px 8px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--card)',
                  color: 'var(--text)'
                }}
              >
                <option value="all">All Types</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* File statistics */}
      {processedFiles.length > 0 && (
        <div className="file-list-stats" style={{
          padding: '8px 12px',
          background: 'var(--brand-100)',
          border: '1px solid var(--brand-200)',
          borderRadius: '8px',
          marginBottom: '12px',
          fontSize: '12px',
          color: 'var(--brand-700)'
        }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {fileStats.fileCount} file{fileStats.fileCount !== 1 ? 's' : ''}
            </span>
            <span>
              Total: {(fileStats.totalSize / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </div>
      )}

      {/* File list */}
      <div className="file-list-items" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {Object.entries(groupedFiles).map(([category, categoryFiles]) => (
          <div key={category}>
            {/* Category header (if grouping) */}
            {filterable && selectedType === 'all' && Object.keys(groupedFiles).length > 1 && (
              <div className="file-category-header" style={{
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {category} ({categoryFiles.length})
              </div>
            )}

            {/* Files in this category */}
            {categoryFiles.map(file => (
              <FileItem
                key={file.id}
                file={file}
                onDelete={onDelete}
                showActions={showActions}
                compact={compact}
              />
            ))}
          </div>
        ))}

        {/* No results message */}
        {processedFiles.length === 0 && files.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            color: 'var(--text-2)'
          }}>
            <File size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <div>No files match your filters</div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
              }}
              className="btn ghost subtle"
              style={{ marginTop: '8px', fontSize: '12px' }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}