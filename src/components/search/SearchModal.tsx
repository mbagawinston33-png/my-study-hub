"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Filter, Clock } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import SearchResults from './SearchResults';
import { SearchState, SearchFilters, SearchResultType, SEARCH_CONFIG, SearchResult } from '@/types/search';
import { universalSearch } from '@/lib/search';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function SearchModal({
  isOpen,
  onClose,
  userId
}: SearchModalProps) {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    filters: { types: ['task', 'subject', 'reminder', 'file'] },
    isLoading: false,
    totalResults: 0,
    searchTime: 0,
    hasError: false,
    errorMessage: undefined
  });

  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Load search history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('search-history');
        if (saved) {
          setSearchHistory(JSON.parse(saved));
        }
      } catch (error) {
        // Silent error handling following existing patterns
      }
    }
  }, []);

  // Save search history to localStorage
  const saveToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('search-history', JSON.stringify(newHistory));
      } catch (error) {
        // Silent error handling
      }
    }
  }, [searchHistory]);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
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

    setSearchState(prev => ({
      ...prev,
      query,
      isLoading: true,
      hasError: false,
      errorMessage: undefined
    }));

    try {
      const response = await universalSearch(userId, query, searchState.filters);

      setSearchState(prev => ({
        ...prev,
        results: response.results,
        totalResults: response.total,
        searchTime: response.analytics.searchTime,
        isLoading: false,
        hasError: false,
        errorMessage: undefined
      }));

      saveToHistory(query);
    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        results: [],
        totalResults: 0,
        isLoading: false,
        hasError: true,
        errorMessage: 'Search failed. Please try again.'
      }));
    }
  }, [userId, searchState.filters, saveToHistory]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;

    setSearchState(prev => ({ ...prev, query }));

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, SEARCH_CONFIG.searchDebounceMs);
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchState.query);
  };

  // Handle filter changes
  const handleFilterChange = (filters: Partial<SearchFilters>) => {
    const newFilters = { ...searchState.filters, ...filters };
    setSearchState(prev => ({ ...prev, filters: newFilters }));

    // Re-run search with new filters
    if (searchState.query.trim()) {
      performSearch(searchState.query);
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    // Navigate based on result type
    let navigationUrl = '';
    switch (result.type) {
      case 'task':
        navigationUrl = `/dashboard/tasks?highlight=${result.id}`;
        break;
      case 'subject':
        navigationUrl = `/dashboard/subjects?highlight=${result.id}`;
        break;
      case 'reminder':
        navigationUrl = `/dashboard/reminders?highlight=${result.id}`;
        break;
      case 'file':
        const subjectId = result.metadata.subjectId as string;
        navigationUrl = `/dashboard/subjects?highlight=${subjectId}&tab=files&file=${result.id}`;
        break;
      default:
        return;
    }

    // Navigate and close modal
    window.location.href = navigationUrl; // Use window.location for immediate navigation
    onClose();
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchState(prev => ({
      ...prev,
      query: '',
      results: [],
      totalResults: 0,
      searchTime: 0,
      hasError: false,
      errorMessage: undefined
    }));

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      handleSearchSubmit(e);
    } else if (e.key === '/' && e.ctrlKey) {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const getRecentSearches = () => {
    return searchHistory.filter(query => query.toLowerCase().includes(searchState.query.toLowerCase()));
  };

  const handleHistoryClick = (query: string) => {
    setSearchState(prev => ({ ...prev, query }));
    performSearch(query);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search Everything"
      size="large"
      closeOnEscape={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '70vh' }}>
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ marginBottom: '16px' }}>
          <div className="row" style={{ gap: '8px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-2)',
                  pointerEvents: 'none'
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchState.query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Search tasks, subjects, reminders, files..."
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 48px',
                  border: `1px solid ${searchState.hasError ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  fontSize: '15px',
                  color: 'var(--text)',
                  background: 'var(--bg)',
                  outline: 'none'
                }}
              />
              {searchState.query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="btn ghost"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px',
                    borderRadius: '6px'
                  }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? '' : 'ghost'}`}
              style={{ padding: '12px 16px', borderRadius: '10px' }}
              title="Toggle filters"
            >
              <Filter size={18} />
            </button>
          </div>

          {searchState.hasError && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'var(--danger-100)',
              border: '1px solid var(--danger-200)',
              borderRadius: '6px',
              fontSize: '13px',
              color: 'var(--danger)'
            }}>
              {searchState.errorMessage}
            </div>
          )}
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="card" style={{ marginBottom: '16px', padding: '12px' }}>
            <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
              Filter by type:
            </div>
            <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
              {(['task', 'subject', 'reminder', 'file'] as SearchResultType[]).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    const newTypes = searchState.filters.types.includes(type)
                      ? searchState.filters.types.filter(t => t !== type)
                      : [...searchState.filters.types, type];
                    handleFilterChange({ types: newTypes });
                  }}
                  className={searchState.filters.types.includes(type) ? 'btn' : 'btn ghost'}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    background: searchState.filters.types.includes(type)
                      ? 'var(--brand-100)'
                      : 'transparent',
                    color: searchState.filters.types.includes(type)
                      ? 'var(--brand)'
                      : 'var(--text-2)',
                    border: `1px solid ${searchState.filters.types.includes(type)
                      ? 'var(--brand-200)'
                      : 'var(--border)'}`
                  }}
                >
                  {SEARCH_CONFIG.typeLabels[type]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Info */}
        {searchState.query && (
          <div className="row" style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            fontSize: '13px',
            color: 'var(--text-2)'
          }}>
            <span>
              {searchState.isLoading
                ? 'Searching...'
                : searchState.totalResults > 0
                  ? `${searchState.totalResults} result${searchState.totalResults !== 1 ? 's' : ''}`
                  : 'No results'
              }
              {searchState.searchTime > 0 && !searchState.isLoading && (
                <span style={{ marginLeft: '8px' }}>
                  ({searchState.searchTime}ms)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {/* Recent Searches */}
          {!searchState.query && searchHistory.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div className="row" style={{
                alignItems: 'center',
                gap: '6px',
                marginBottom: '12px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text)'
              }}>
                <Clock size={14} />
                Recent Searches
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {getRecentSearches().slice(0, 5).map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(query)}
                    className="btn ghost"
                    style={{
                      justifyContent: 'flex-start',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: 'var(--text-2)',
                      textAlign: 'left',
                      borderRadius: '6px'
                    }}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <SearchResults
            results={searchState.results}
            query={searchState.query}
            isLoading={searchState.isLoading}
            onResultClick={handleResultClick}
          />
        </div>
      </div>
    </Modal>
  );
}