/**
 * Search service utilities for MyStudyHub
 * Handles universal search functionality across tasks, subjects, reminders, and files
 */

import { Timestamp } from 'firebase/firestore';
import { getDb } from './firebase';
import {
  getUserTasks,
  getTasksByFilter
} from './tasks';
import { getUserSubjects } from './storage';
import { getUserReminders } from './reminders';
import { getSubjectFiles } from './storage';
import {
  SearchResult,
  SearchResultType,
  SearchFilters,
  SearchResponse,
  SearchSuggestion,
  SEARCH_CONFIG,
  SearchableTask,
  SearchableSubject,
  SearchableReminder,
  SearchableFile
} from '@/types/search';
import { Task, TaskWithSubject } from '@/types/task';
import { Subject } from '@/types/subject';
import { Reminder } from '@/types/reminder';
import { SubjectFile } from '@/types/subject';

/**
 * Highlights search terms in text
 */
export function highlightText(text: string, query: string): string {
  if (!text || !query.trim()) return text;

  const regex = new RegExp(`(${escapeRegex(query.trim())})`, 'gi');
  return text.replace(regex, `<${SEARCH_CONFIG.highlightTag} class="${SEARCH_CONFIG.highlightClassName}">$1</${SEARCH_CONFIG.highlightTag}>`);
}

/**
 * Escapes special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculates relevance score for search results
 */
export function calculateRelevance(
  item: Task | Subject | Reminder | SubjectFile,
  query: string,
  subjectMap?: Map<string, Subject>
): number {
  const weights = SEARCH_CONFIG.relevanceWeights;
  const queryLower = query.toLowerCase().trim();
  let score = 0;

  // Get searchable text based on item type
  let title = '';
  let description = '';
  let metadata: string[] = [];

  // Use type guards to determine the item type
  if ('subjectId' in item && 'priority' in item && 'dueDate' in item && 'status' in item) {
    // Task
    const task = item as Task;
    title = task.title;
    description = task.description || '';
    // Add subject name to metadata if available
    if (task.subjectId && subjectMap?.has(task.subjectId)) {
      metadata.push(subjectMap.get(task.subjectId)!.name);
      metadata.push(subjectMap.get(task.subjectId)!.code || '');
    }
  } else if ('code' in item && 'teacher' in item && 'room' in item && 'isActive' in item) {
    // Subject
    const subject = item as Subject;
    title = subject.name;
    description = subject.description || '';
    metadata.push(subject.code || '');
    metadata.push(subject.teacher || '');
    metadata.push(subject.room || '');
  } else if ('isCompleted' in item && 'dueDate' in item && !('code' in item)) {
    // Reminder
    const reminder = item as Reminder;
    title = reminder.title;
    description = reminder.description || '';
  } else if ('originalName' in item && 'size' in item && 'url' in item) {
    // SubjectFile
    const file = item as SubjectFile;
    title = file.name;
    description = file.description || '';
    metadata.push(file.originalName);
    metadata.push(file.type);
    // Add subject name to metadata if available
    if (subjectMap?.has(file.subjectId)) {
      metadata.push(subjectMap.get(file.subjectId)!.name);
    }
  }

  const titleLower = title.toLowerCase();
  const descriptionLower = description.toLowerCase();
  const metadataLower = metadata.join(' ').toLowerCase();

  // Title exact match
  if (titleLower === queryLower) {
    score += weights.titleExactMatch;
  }
  // Title partial match
  else if (titleLower.includes(queryLower)) {
    score += weights.titlePartialMatch;
  }

  // Description matches
  if (descriptionLower.includes(queryLower)) {
    score += weights.descriptionMatch;
  }

  // Metadata matches
  if (metadataLower.includes(queryLower)) {
    score += weights.metadataMatch;
  }

  // Recent boost (items from last 7 days)
  const itemDate = getItemDate(item);
  if (itemDate) {
    const daysSinceCreation = (Date.now() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation <= 7) {
      score *= weights.recentBoost;
    }
  }

  // Priority boost for tasks
  if ('priority' in item) {
    const task = item as Task;
    score *= weights.priorityBoost[task.priority];
  }

  return score;
}

/**
 * Gets the relevant date for an item (for recent boost calculation)
 */
function getItemDate(item: Task | Subject | Reminder | SubjectFile): Date | null {
  if ('createdAt' in item && item.createdAt instanceof Timestamp) {
    return item.createdAt.toDate();
  } else if ('uploadedAt' in item && item.uploadedAt instanceof Timestamp) {
    return item.uploadedAt.toDate();
  }
  return null;
}

/**
 * Creates breadcrumbs for navigation
 */
export function createBreadcrumbs(
  type: SearchResultType,
  item: Task | Subject | Reminder | SubjectFile,
  subjects: Subject[] = []
): Array<{ label: string; href: string }> {
  const breadcrumbs: Array<{ label: string; href: string }> = [];

  switch (type) {
    case 'task':
      breadcrumbs.push(
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Tasks', href: '/dashboard/tasks' },
        { label: 'Task Details', href: `/dashboard/tasks/${(item as Task).id}` }
      );
      break;

    case 'subject':
      const subject = item as Subject;
      breadcrumbs.push(
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Subjects', href: '/dashboard/subjects' },
        { label: subject.name, href: `/dashboard/subjects/${subject.id}` }
      );
      break;

    case 'reminder':
      breadcrumbs.push(
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Reminders', href: '/dashboard/reminders' },
        { label: 'Reminder Details', href: `/dashboard/reminders/${(item as Reminder).id}` }
      );
      break;

    case 'file':
      const file = item as SubjectFile;
      const parentSubject = subjects.find(s => s.id === file.subjectId);
      breadcrumbs.push(
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Subjects', href: '/dashboard/subjects' },
        { label: parentSubject?.name || 'Unknown Subject', href: `/dashboard/subjects/${file.subjectId}` },
        { label: 'Files', href: `/dashboard/subjects/${file.subjectId}?tab=files` }
      );
      break;
  }

  return breadcrumbs;
}

/**
 * Creates metadata for search result display
 */
export function createMetadata(
  type: SearchResultType,
  item: Task | Subject | Reminder | SubjectFile,
  subjects: Subject[] = []
): Record<string, string | number | boolean> {
  const metadata: Record<string, string | number | boolean> = {};

  switch (type) {
    case 'task':
      const task = item as Task;
      metadata.status = task.status;
      metadata.priority = task.priority;
      metadata.dueDate = formatDate(task.dueDate.toDate());
      if (task.subjectId) {
        const subject = subjects.find(s => s.id === task.subjectId);
        metadata.subjectName = subject?.name || 'Unknown Subject';
        metadata.subjectColor = subject?.color || '#6B7280';
      }
      if (task.attachedFiles && task.attachedFiles.length > 0) {
        metadata.fileCount = task.attachedFiles.length;
      }
      break;

    case 'subject':
      const subject = item as Subject;
      metadata.color = subject.color;
      metadata.isActive = subject.isActive;
      metadata.code = subject.code || '';
      metadata.teacher = subject.teacher || '';
      if ('fileCount' in subject && subject.fileCount) {
        metadata.fileCount = subject.fileCount as number;
      }
      break;

    case 'reminder':
      const reminder = item as Reminder;
      metadata.isCompleted = reminder.isCompleted;
      metadata.dueDate = formatDate(reminder.dueDate.toDate());
      break;

    case 'file':
      const file = item as SubjectFile;
      metadata.type = file.type;
      metadata.size = formatFileSize(file.size);
      metadata.uploadedAt = formatDate(file.uploadedAt.toDate());
      const parentSubject = subjects.find(s => s.id === file.subjectId);
      metadata.subjectName = parentSubject?.name || 'Unknown Subject';
      metadata.subjectColor = parentSubject?.color || '#6B7280';
      break;
  }

  return metadata;
}

/**
 * Formats date for display
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'Just now' : `${diffMins} min ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

/**
 * Formats file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Universal search function following existing patterns
 */
export async function universalSearch(
  userId: string,
  query: string,
  filters: SearchFilters = { types: ['task', 'subject', 'reminder', 'file'] }
): Promise<SearchResponse> {
  const startTime = Date.now();

  try {
    if (!query.trim()) {
      return {
        results: [],
        total: 0,
        hasMore: false,
        suggestions: [],
        analytics: {
          searchTime: 0,
          totalIndexed: 0,
          cacheHit: false
        },
        facets: {
          types: [],
          subjects: [],
          dates: []
        }
      };
    }

    // Fetch data in parallel following existing patterns
    const [tasks, subjects, reminders, userSubjects] = await Promise.all([
      filters.types.includes('task') ? getUserTasks(userId) : Promise.resolve([]),
      filters.types.includes('subject') ? getUserSubjects(userId) : Promise.resolve([]),
      filters.types.includes('reminder') ? getUserReminders(userId) : Promise.resolve([]),
      getUserSubjects(userId) // Always need for metadata
    ]);

    // Create subject map for quick lookups
    const subjectMap = new Map(userSubjects.map(s => [s.id, s]));

    // Gather all files for subjects
    let files: SubjectFile[] = [];
    if (filters.types.includes('file')) {
      const filePromises = userSubjects.map(subject => getSubjectFiles(subject.id));
      const fileArrays = await Promise.all(filePromises);
      files = fileArrays.flat();
    }

    // Apply filters and calculate relevance
    const allResults: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    // Process tasks
    if (filters.types.includes('task')) {
      tasks.forEach(task => {
        if (matchesFilters(task, filters, subjectMap)) {
          const relevance = calculateRelevance(task, query, subjectMap);
          if (relevance > 0) {
            allResults.push(createSearchResult('task', task, relevance, userSubjects));
          }
        }
      });
    }

    // Process subjects
    if (filters.types.includes('subject')) {
      subjects.forEach(subject => {
        if (matchesFilters(subject, filters)) {
          const relevance = calculateRelevance(subject, query, subjectMap);
          if (relevance > 0) {
            allResults.push(createSearchResult('subject', subject, relevance, userSubjects));
          }
        }
      });
    }

    // Process reminders
    if (filters.types.includes('reminder')) {
      reminders.forEach(reminder => {
        if (matchesFilters(reminder, filters)) {
          const relevance = calculateRelevance(reminder, query, subjectMap);
          if (relevance > 0) {
            allResults.push(createSearchResult('reminder', reminder, relevance, userSubjects));
          }
        }
      });
    }

    // Process files
    if (filters.types.includes('file')) {
      files.forEach(file => {
        if (matchesFilters(file, filters, subjectMap)) {
          const relevance = calculateRelevance(file, query, subjectMap);
          if (relevance > 0) {
            allResults.push(createSearchResult('file', file, relevance, userSubjects));
          }
        }
      });
    }

    // Sort by relevance and limit results
    const sortedResults = allResults
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, SEARCH_CONFIG.maxResults);

    // Generate suggestions
    const suggestions = generateSuggestions(query, sortedResults);

    // Create facets
    const facets = createFacets(sortedResults, userSubjects);

    const searchTime = Date.now() - startTime;

    return {
      results: sortedResults,
      total: sortedResults.length,
      hasMore: allResults.length > SEARCH_CONFIG.maxResults,
      suggestions,
      analytics: {
        searchTime,
        totalIndexed: tasks.length + subjects.length + reminders.length + files.length,
        cacheHit: false
      },
      facets
    };

  } catch (error) {
    // Follow existing silent error handling pattern
    console.error('Search error:', error);
    return {
      results: [],
      total: 0,
      hasMore: false,
      suggestions: [],
      analytics: {
        searchTime: Date.now() - startTime,
        totalIndexed: 0,
        cacheHit: false
      },
      facets: {
        types: [],
        subjects: [],
        dates: []
      }
    };
  }
}

/**
 * Checks if an item matches the applied filters
 */
function matchesFilters(
  item: Task | Subject | Reminder | SubjectFile,
  filters: SearchFilters,
  subjectMap?: Map<string, Subject>
): boolean {
  // Type filter is applied at the collection level

  // Date range filter
  if (filters.dateRange) {
    const itemDate = getItemDate(item);
    if (!itemDate || itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
      return false;
    }
  }

  // Subject filter
  if (filters.subjectIds && filters.subjectIds.length > 0) {
    if ('subjectId' in item) {
      if (!filters.subjectIds.includes((item as any).subjectId)) {
        return false;
      }
    } else if ('code' in item && 'teacher' in item && 'room' in item && 'isActive' in item) {
      if (!filters.subjectIds.includes(item.id)) {
        return false;
      }
    }
  }

  // Status filter for tasks and reminders
  if (filters.status && filters.status.length > 0) {
    if ('status' in item && filters.status.includes(item.status as any)) {
      return true;
    }
    if ('isCompleted' in item && filters.status.includes(item.isCompleted as any)) {
      return true;
    }
  }

  // Priority filter for tasks
  if (filters.priorities && filters.priorities.length > 0) {
    if ('priority' in item && filters.priorities.includes((item as Task).priority)) {
      return true;
    }
  }

  // File type filter for files
  if (filters.fileTypes && filters.fileTypes.length > 0) {
    if ('type' in item && filters.fileTypes.includes((item as SubjectFile).type)) {
      return true;
    }
  }

  return true;
}

/**
 * Creates a search result object
 */
function createSearchResult(
  type: SearchResultType,
  item: Task | Subject | Reminder | SubjectFile,
  relevance: number,
  subjects: Subject[] = []
): SearchResult {
  const result: SearchResult = {
    id: item.id,
    type,
    title: getTitle(item),
    relevance,
    data: item,
    breadcrumbs: createBreadcrumbs(type, item, subjects),
    metadata: createMetadata(type, item, subjects)
  };

  // Add description if available
  const description = getDescription(item);
  if (description) {
    result.description = description;
  }

  return result;
}

/**
 * Gets the title for display
 */
function getTitle(item: Task | Subject | Reminder | SubjectFile): string {
  // Use type guards to determine the item type
  if ('subjectId' in item && 'priority' in item && 'dueDate' in item && 'status' in item) {
    // Task
    return (item as Task).title;
  } else if ('code' in item && 'teacher' in item && 'room' in item && 'isActive' in item) {
    // Subject
    return (item as Subject).name;
  } else if ('isCompleted' in item && 'dueDate' in item && !('code' in item)) {
    // Reminder
    return (item as Reminder).title;
  } else if ('originalName' in item && 'size' in item && 'url' in item) {
    // SubjectFile
    return (item as SubjectFile).name;
  }
  return 'Untitled';
}

/**
 * Gets the description for display
 */
function getDescription(item: Task | Subject | Reminder | SubjectFile): string | undefined {
  // Use type guards to determine the item type
  if ('subjectId' in item && 'priority' in item && 'dueDate' in item && 'status' in item) {
    // Task
    return (item as Task).description;
  } else if ('code' in item && 'teacher' in item && 'room' in item && 'isActive' in item) {
    // Subject
    return (item as Subject).description;
  } else if ('isCompleted' in item && 'dueDate' in item && !('code' in item)) {
    // Reminder
    return (item as Reminder).description;
  } else if ('originalName' in item && 'size' in item && 'url' in item) {
    // SubjectFile
    return (item as SubjectFile).description;
  }
  return undefined;
}

/**
 * Generates search suggestions
 */
function generateSuggestions(query: string, results: SearchResult[]): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];

  // Add popular completions from results
  const uniqueTerms = new Set<string>();
  results.forEach(result => {
    const words = result.title.toLowerCase().split(' ');
    words.forEach(word => {
      if (word.includes(query.toLowerCase()) && word !== query.toLowerCase()) {
        uniqueTerms.add(word);
      }
    });
  });

  // Convert to suggestion format
  Array.from(uniqueTerms)
    .slice(0, SEARCH_CONFIG.maxSuggestions)
    .forEach(term => {
      suggestions.push({
        text: term,
        type: 'completion',
        category: 'suggestion'
      });
    });

  return suggestions;
}

/**
 * Creates facet data for filtering
 */
function createFacets(results: SearchResult[], subjects: Subject[]) {
  const typeCounts = new Map<SearchResultType, number>();
  const subjectCounts = new Map<string, { name: string; count: number }>();

  results.forEach(result => {
    // Count by type
    typeCounts.set(result.type, (typeCounts.get(result.type) || 0) + 1);

    // Count by subject
    const subjectId = getSubjectIdFromResult(result);
    if (subjectId) {
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) {
        const existing = subjectCounts.get(subjectId);
        if (existing) {
          existing.count++;
        } else {
          subjectCounts.set(subjectId, { name: subject.name, count: 1 });
        }
      }
    }
  });

  return {
    types: Array.from(typeCounts.entries()).map(([type, count]) => ({
      type,
      count,
      label: SEARCH_CONFIG.typeLabels[type]
    })),
    subjects: Array.from(subjectCounts.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count
    })),
    dates: [] // TODO: Implement date faceting if needed
  };
}

/**
 * Gets subject ID from search result
 */
function getSubjectIdFromResult(result: SearchResult): string | null {
  switch (result.type) {
    case 'task':
      return (result.data as Task).subjectId || null;
    case 'subject':
      return result.data.id;
    case 'file':
      return (result.data as SubjectFile).subjectId;
    case 'reminder':
      return null; // Reminders don't have subjects
    default:
      return null;
  }
}

/**
 * Gets search suggestions for autocomplete
 */
export async function getSearchSuggestions(
  userId: string,
  partialQuery: string
): Promise<SearchSuggestion[]> {
  // For now, return basic suggestions
  // This could be enhanced with search history and popular queries
  if (!partialQuery.trim()) {
    return [];
  }

  // TODO: Implement search history and analytics-based suggestions
  return [];
}