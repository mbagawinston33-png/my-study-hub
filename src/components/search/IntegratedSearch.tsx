"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SearchResults from "./SearchResults";
import { universalSearch } from "@/lib/search";
import { SearchResult } from "@/types/search";

interface IntegratedSearchProps {
  userId: string;
}

export default function IntegratedSearch({ userId }: IntegratedSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut for search (Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle clicks outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const searchResponse = await universalSearch(
        userId,
        query.trim(),
        { types: ['task', 'subject', 'reminder', 'file'] }
      );

      // Limit results for dropdown
      searchResponse.results = searchResponse.results.slice(0, 8);

      setResults(searchResponse.results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleInputFocus = () => {
    if (searchQuery.trim() && results.length > 0) {
      setShowResults(true);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  // Auto-hide search results when navigation happens
  const handleResultClick = () => {
    setShowResults(false);
    setSearchQuery("");
    setResults([]);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={resultsRef}>
      {/* Search Input Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* Search Icon */}
        <div
          style={{
            position: 'absolute',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            color: 'var(--text-2)',
            zIndex: 10
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyPress}
          placeholder="Search tasks, subjects, reminders..."
          className="field"
          style={{
            width: '100%',
            paddingLeft: '40px',
            paddingRight: '40px',
            height: '36px',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            color: 'var(--text)',
            transition: 'all 0.2s ease'
          }}
          title="Search (Ctrl+/)"
        />

        {/* Clear Button */}
        {searchQuery && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'none',
              border: 'none',
              color: 'var(--text-2)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            title="Clear search"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text)';
              e.currentTarget.style.backgroundColor = 'var(--bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-2)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          {isLoading ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-2)' }}>
              <div style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <div style={{ marginTop: '8px', fontSize: '14px' }}>Searching...</div>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                <SearchResults
                  results={results}
                  query={searchQuery}
                  isLoading={false}
                  onResultClick={handleResultClick}
                />
              </div>
            </div>
          ) : searchQuery.trim() ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-2)' }}>
              <div style={{ fontSize: '14px' }}>No results found for "{searchQuery}"</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Try different keywords</div>
            </div>
          ) : null}
        </div>
      )}

      <style jsx>{`
        input:focus {
          outline: none;
          border-color: var(--brand);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand) 20%, transparent);
        }

        input::placeholder {
          color: var(--text-2);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Scrollbar styling for results dropdown */
        div[style*="overflowY: 'auto'"]::-webkit-scrollbar {
          width: 6px;
        }

        div[style*="overflowY: 'auto'"]::-webkit-scrollbar-track {
          background: var(--bg);
        }

        div[style*="overflowY: 'auto'"]::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }

        div[style*="overflowY: 'auto'"]::-webkit-scrollbar-thumb:hover {
          background: var(--text-2);
        }
      `}</style>
    </div>
  );
}