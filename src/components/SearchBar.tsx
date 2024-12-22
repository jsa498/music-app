'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  ClockIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { formatTimeAgo } from '../utils/time';

interface SearchFilters {
  type: 'video' | 'playlist' | 'channel' | 'all';
  duration: 'any' | 'short' | 'medium' | 'long';
  sortBy: 'relevance' | 'date' | 'rating' | 'viewCount';
}

interface SearchHistoryItem {
  query: string;
  filters: SearchFilters;
  timestamp: number;
}

interface SearchBarProps {
  onSearch: (results: any[]) => void;
}

const DEFAULT_FILTERS: SearchFilters = {
  type: 'video',
  duration: 'any',
  sortBy: 'relevance',
};

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSearchRef = useRef<string>('');
  
  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  const handleSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters = filters) => {
    if (!searchQuery?.trim()) {
      onSearch([]);
      return;
    }

    // Don't search if query hasn't changed
    if (searchQuery.trim() === lastSearchRef.current) {
      return;
    }

    lastSearchRef.current = searchQuery.trim();

    try {
      setError(null);
      setIsLoading(true);
      
      const params = new URLSearchParams();
      params.append('q', searchQuery.trim());
      params.append('type', searchFilters.type);
      
      if (searchFilters.type === 'video') {
        params.append('duration', searchFilters.duration);
        params.append('sortBy', searchFilters.sortBy);
      }

      const response = await fetch(`/api/youtube/search?${params}`);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        const data = await response.json();
        throw new Error(data.details || data.error || 'Failed to search');
      }

      const data = await response.json();

      // Add to search history
      const historyItem: SearchHistoryItem = {
        query: searchQuery.trim(),
        filters: searchFilters,
        timestamp: Date.now(),
      };

      const newHistory = [
        historyItem,
        ...searchHistory.filter(item => item.query !== searchQuery)
      ].slice(0, 10); // Keep only last 10 searches

      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      onSearch(data);
    } catch (error: any) {
      console.error('Search error:', error);
      setError(error.message);
      onSearch([]); // Clear results on error
    } finally {
      setIsLoading(false);
    }
  }, [onSearch, filters, searchHistory]);

  // Debounced search with increased delay
  useEffect(() => {
    if (!query?.trim()) {
      onSearch([]);
      setIsLoading(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set loading state only if query has changed
    if (query.trim() !== lastSearchRef.current) {
      setIsLoading(true);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query, filters);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters, handleSearch, onSearch]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowHistory(false);
        setIsFiltersOpen(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  }, []);

  return (
    <div ref={searchBarRef} className="relative w-full">
      <div className="relative">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            placeholder="Search for songs, artists, or albums..."
            className="w-full bg-white/10 rounded-full py-2 pl-10 pr-12 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <MagnifyingGlassIcon className={`absolute left-3 w-5 h-5 ${isLoading ? 'text-primary animate-pulse' : 'text-gray-400'}`} />
          {isLoading && (
            <div className="absolute right-12">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            </div>
          )}
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="absolute right-3 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#282828] rounded-lg shadow-xl border border-white/10 overflow-hidden z-50">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-sm text-[#aaaaaa]">
                <ClockIcon className="h-4 w-4" />
                <span>Recent Searches</span>
              </div>
              <button
                onClick={clearHistory}
                className="text-xs text-[#aaaaaa] hover:text-white transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {searchHistory.map((item, index) => (
                <button
                  key={`${item.query}-${item.timestamp}`}
                  onClick={() => {
                    setQuery(item.query);
                    setFilters(item.filters);
                    handleSearch(item.query, item.filters);
                    setShowHistory(false);
                  }}
                  className={`w-full p-3 text-left transition-colors flex items-center justify-between group ${
                    index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ClockIcon className="h-4 w-4 text-[#aaaaaa]" />
                    <span>{item.query}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#aaaaaa]">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters Dropdown */}
        {isFiltersOpen && !isLoading && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-[#282828] rounded-lg shadow-xl border border-white/10 overflow-hidden z-50">
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as SearchFilters['type'] }))}
                  className="w-full bg-[#383838] rounded-lg p-2 text-sm"
                >
                  <option value="video">Videos</option>
                  <option value="playlist">Playlists</option>
                  <option value="channel">Channels</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duration</label>
                <select
                  value={filters.duration}
                  onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value as SearchFilters['duration'] }))}
                  className="w-full bg-[#383838] rounded-lg p-2 text-sm"
                >
                  <option value="any">Any</option>
                  <option value="short">&lt; 4 minutes</option>
                  <option value="medium">4-20 minutes</option>
                  <option value="long">&gt; 20 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as SearchFilters['sortBy'] }))}
                  className="w-full bg-[#383838] rounded-lg p-2 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Upload Date</option>
                  <option value="rating">Rating</option>
                  <option value="viewCount">View Count</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-white/10 flex justify-between">
              <button
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setIsFiltersOpen(false);
                }}
                className="px-4 py-2 text-sm text-[#aaaaaa] hover:text-white transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  handleSearch(query, filters);
                  setIsFiltersOpen(false);
                }}
                className="px-4 py-2 text-sm bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 