/**
 * Search data types for MyStudyHub
 * Universal search functionality across tasks, subjects, reminders, and files
 */

import { Timestamp } from 'firebase/firestore';
import { Task, TaskStatus, TaskPriority } from './task';
import { Subject } from './subject';
import { Reminder } from './reminder';
import { SubjectFile, FileType } from './subject';

// Search result types
export type SearchResultType = 'task' | 'subject' | 'reminder' | 'file';

// Main search result interface
export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  relevance: number;
  highlights?: {
    title?: string;
    description?: string;
    metadata?: string[];
  };
  data: Task | Subject | Reminder | SubjectFile;
  breadcrumbs: {
    label: string;
    href: string;
  }[];
  metadata: {
    [key: string]: string | number | boolean;
  };
}

// Search filters configuration
export interface SearchFilters {
  types: SearchResultType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  subjectIds?: string[];
  status?: (TaskStatus | boolean)[];
  fileTypes?: FileType[];
  priorities?: TaskPriority[];
}

// Search state management
export interface SearchState {
  query: string;
  results: SearchResult[];
  filters: SearchFilters;
  isLoading: boolean;
  totalResults: number;
  searchTime: number;
  hasError: boolean;
  errorMessage?: string;
}

// Search suggestions for autocomplete
export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'completion';
  category?: string;
  result?: SearchResult;
}

// Search response structure
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  suggestions: SearchSuggestion[];
  analytics: {
    searchTime: number;
    totalIndexed: number;
    cacheHit: boolean;
  };
  facets: {
    types: Array<{
      type: SearchResultType;
      count: number;
      label: string;
    }>;
    subjects: Array<{
      id: string;
      name: string;
      count: number;
    }>;
    dates: Array<{
      period: string;
      count: number;
    }>;
  };
}

// Search configuration (following existing patterns like TASK_PRIORITY_CONFIG)
export const SEARCH_CONFIG = {
  // Relevance scoring weights
  relevanceWeights: {
    titleExactMatch: 10,
    titlePartialMatch: 5,
    descriptionMatch: 3,
    metadataMatch: 1,
    recentBoost: 1.5,
    priorityBoost: {
      high: 1.3,
      medium: 1.1,
      low: 1.0
    }
  },

  // Search limits and performance
  maxResults: 50,
  maxSuggestions: 8,
  searchDebounceMs: 300,

  // Highlighting configuration
  highlightTag: 'mark',
  highlightClassName: 'search-highlight',
  maxSnippetLength: 150,

  // Type-specific search fields
  searchableFields: {
    task: ['title', 'description'],
    subject: ['name', 'code', 'description', 'teacher'],
    reminder: ['title', 'description'],
    file: ['name', 'originalName', 'description']
  },

  // Type labels for display
  typeLabels: {
    task: 'Task',
    subject: 'Subject',
    reminder: 'Reminder',
    file: 'File'
  },

  // Type icons (using Lucide icon names)
  typeIcons: {
    task: 'CheckCircle',
    subject: 'BookOpen',
    reminder: 'Calendar',
    file: 'FileText'
  }
} as const;

// Enhanced interfaces for search optimization
export interface SearchableTask extends Task {
  searchVector?: string;
  lastIndexed?: Timestamp;
  searchFrequency?: number;
}

export interface SearchableSubject extends Subject {
  searchVector?: string;
  lastIndexed?: Timestamp;
  searchFrequency?: number;
}

export interface SearchableReminder extends Reminder {
  searchVector?: string;
  lastIndexed?: Timestamp;
  searchFrequency?: number;
}

export interface SearchableFile extends SubjectFile {
  searchVector?: string;
  lastIndexed?: Timestamp;
  searchFrequency?: number;
}

// Search analytics for admin dashboard
export interface SearchAnalytics {
  totalSearches: number;
  averageResults: number;
  popularQueries: Array<{
    query: string;
    count: number;
    avgResults: number;
  }>;
  typeDistribution: Record<SearchResultType, number>;
  noResultQueries: string[];
  searchPerformance: {
    averageSearchTime: number;
    cacheHitRate: number;
  };
}

// Search validation interfaces
export interface SearchValidationError {
  field: string;
  message: string;
}

export interface SearchValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Helper function types
export type HighlightFunction = (text: string, query: string) => string;
export type RelevanceCalculator = (item: any, query: string) => number;
export type FilterFunction = (item: any, filters: SearchFilters) => boolean;