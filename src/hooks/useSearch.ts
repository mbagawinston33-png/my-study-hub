/**
 * Search hook for MyStudyHub
 * Provides search functionality with state management and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchState, SearchResult, SearchFilters, SearchResultType } from '@/types/search';
import { universalSearch } from '@/lib/search';

interface UseSearchOptions {
  userId: string;
  initialFilters?: SearchFilters;
  debounceMs?: number;
  cacheResults?: boolean;
}

interface UseSearchReturn {
  // State
  query: string;
  results: SearchResult[];
  filters: SearchFilters;
  isLoading: boolean;
  totalResults: number;
  searchTime: number;
  hasError: boolean;
  errorMessage?: string;

  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearSearch: () => void;
  performSearch: (query?: string, filters?: SearchFilters) => Promise<void>;
  refreshResults: () => Promise<void>;

  // Utils
  getResultsByType: (type: SearchResultType) => SearchResult[];
  hasResults: boolean;
  isEmpty: boolean;
}

export function useSearch({
  userId,
  initialFilters = { types: ['task', 'subject', 'reminder', 'file'] },
  debounceMs = 300,
  cacheResults = true
}: UseSearchOptions): UseSearchReturn {
  // Search state
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    filters: initialFilters,
    isLoading: false,
    totalResults: 0,
    searchTime: 0,
    hasError: false,
    errorMessage: undefined
  });

  // Refs for debouncing and caching
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, SearchResult[]>>(new Map());
  const lastSearchRef = useRef<{ query: string; filters: SearchFilters }>({
    query: '',
    filters: initialFilters
  });

  // Generate cache key
  const getCacheKey = useCallback((query: string, filters: SearchFilters): string => {
    return JSON.stringify({ query, filters });
  }, []);

  // Perform search with caching
  const performSearch = useCallback(async (
    query?: string,
    filters?: SearchFilters
  ) => {
    const searchQuery = query !== undefined ? query : searchState.query;
    const searchFilters = filters !== undefined ? filters : searchState.filters;

    // Return cached results if available
    if (cacheResults && !searchQuery.trim()) {
      const cacheKey = getCacheKey(searchQuery, searchFilters);
      const cachedResults = cacheRef.current.get(cacheKey);
      if (cachedResults) {
        setSearchState(prev => ({
          ...prev,
          query: searchQuery,
          filters: searchFilters,
          results: cachedResults,
          totalResults: cachedResults.length,
          isLoading: false,
          hasError: false,
          errorMessage: undefined
        }));
        return;
      }
    }

    // Set loading state
    setSearchState(prev => ({
      ...prev,
      query: searchQuery,
      filters: searchFilters,
      isLoading: true,
      hasError: false,
      errorMessage: undefined
    }));

    try {
      const response = await universalSearch(userId, searchQuery, searchFilters);

      // Cache results
      if (cacheResults && searchQuery.trim()) {
        const cacheKey = getCacheKey(searchQuery, searchFilters);
        cacheRef.current.set(cacheKey, response.results);
      }

      setSearchState(prev => ({
        ...prev,
        results: response.results,
        totalResults: response.total,
        searchTime: response.analytics.searchTime,
        isLoading: false,
        hasError: false,
        errorMessage: undefined
      }));

      // Update last search ref
      lastSearchRef.current = { query: searchQuery, filters: searchFilters };

    } catch (error) {
      console.error('Search error:', error);
      setSearchState(prev => ({
        ...prev,
        results: [],
        totalResults: 0,
        isLoading: false,
        hasError: true,
        errorMessage: 'Search failed. Please try again.'
      }));
    }
  }, [userId, searchState.query, searchState.filters, cacheResults, getCacheKey]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string, filters: SearchFilters) => {
      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Don't search for empty queries immediately
      if (!query.trim()) {
        setSearchState(prev => ({
          ...prev,
          query,
          results: [],
          totalResults: 0,
          searchTime: 0,
          hasError: false,
          errorMessage: undefined
        }));
        return;
      }

      // Set new timeout
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query, filters);
      }, debounceMs);
    },
    [performSearch, debounceMs]
  );

  // Set query with debouncing
  const setQuery = useCallback((query: string) => {
    setSearchState(prev => ({ ...prev, query }));
    debouncedSearch(query, searchState.filters);
  }, [debouncedSearch, searchState.filters]);

  // Set filters and trigger search
  const setFilters = useCallback((filters: Partial<SearchFilters>) => {
    const newFilters = { ...searchState.filters, ...filters };
    setSearchState(prev => ({ ...prev, filters: newFilters }));

    if (searchState.query.trim()) {
      debouncedSearch(searchState.query, newFilters);
    }
  }, [debouncedSearch, searchState.query, searchState.filters]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      query: '',
      results: [],
      totalResults: 0,
      searchTime: 0,
      hasError: false,
      errorMessage: undefined
    }));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // Refresh current search
  const refreshResults = useCallback(async () => {
    if (searchState.query.trim()) {
      // Clear cache for this search
      const cacheKey = getCacheKey(searchState.query, searchState.filters);
      cacheRef.current.delete(cacheKey);

      await performSearch(searchState.query, searchState.filters);
    }
  }, [searchState.query, searchState.filters, performSearch, getCacheKey]);

  // Get results by type
  const getResultsByType = useCallback((type: SearchResultType): SearchResult[] => {
    return searchState.results.filter(result => result.type === type);
  }, [searchState.results]);

  // Utility getters
  const hasResults = searchState.results.length > 0;
  const isEmpty = !searchState.query.trim() && searchState.results.length === 0;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Clear cache when user changes
  useEffect(() => {
    cacheRef.current.clear();
  }, [userId]);

  return {
    // State
    query: searchState.query,
    results: searchState.results,
    filters: searchState.filters,
    isLoading: searchState.isLoading,
    totalResults: searchState.totalResults,
    searchTime: searchState.searchTime,
    hasError: searchState.hasError,
    errorMessage: searchState.errorMessage,

    // Actions
    setQuery,
    setFilters,
    clearSearch,
    performSearch,
    refreshResults,

    // Utils
    getResultsByType,
    hasResults,
    isEmpty
  };
}

/**
 * Hook for search history management
 */
export function useSearchHistory(maxHistory: number = 10) {
  const [history, setHistory] = useState<string[]>([]);

  // Load history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('search-history');
        if (saved) {
          setHistory(JSON.parse(saved));
        }
      } catch (error) {
        // Silent error handling
      }
    }
  }, []);

  // Add to history
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    const newHistory = [query.trim(), ...history.filter(h => h !== query.trim())].slice(0, maxHistory);
    setHistory(newHistory);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('search-history', JSON.stringify(newHistory));
      } catch (error) {
        // Silent error handling
      }
    }
  }, [history, maxHistory]);

  // Remove from history
  const removeFromHistory = useCallback((query: string) => {
    const newHistory = history.filter(h => h !== query);
    setHistory(newHistory);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('search-history', JSON.stringify(newHistory));
      } catch (error) {
        // Silent error handling
      }
    }
  }, [history]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('search-history');
      } catch (error) {
        // Silent error handling
      }
    }
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
}

/**
 * Hook for search suggestions and autocomplete
 */
export function useSearchSuggestions(userId: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = useCallback(async (partialQuery: string) => {
    if (!partialQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // For now, return basic suggestions
      // This could be enhanced with search history, popular queries, etc.
      const basicSuggestions: string[] = [];

      // TODO: Implement actual suggestion logic
      setSuggestions(basicSuggestions.slice(0, 8));
    } catch (error) {
      console.error('Suggestions error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    getSuggestions
  };
}