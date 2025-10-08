
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { SearchIcon } from './Icons';

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isUserTyping = useRef(false); // Tracks if change is from user input vs. URL sync

  const getQueryFromPath = useCallback(() => {
    const parts = location.pathname.split('/');
    if (parts.length >= 3 && parts[1] === 'search') {
      try {
        return decodeURIComponent(parts[2]);
      } catch (e) {
        console.error("Failed to decode URL component", parts[2]);
        return '';
      }
    }
    return '';
  }, [location.pathname]);
  
  const [query, setQuery] = useState(getQueryFromPath());
  const debouncedQuery = useDebounce(query, 500);

  // Effect to sync the input field FROM the URL.
  // This runs when the component loads or the URL changes (e.g. back/forward).
  useEffect(() => {
    const queryFromPath = getQueryFromPath();
    // If the URL changes, we assume it's not from the user typing in this component.
    // We reset the flag and sync the state if it's different.
    isUserTyping.current = false;
    if (queryFromPath !== query) {
      setQuery(queryFromPath);
    }
  // The dependency is getQueryFromPath, which is memoized against location.pathname.
  // This correctly triggers the effect only on route changes.
  // We disable the exhaustive-deps rule because adding `query` would re-introduce the bug.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getQueryFromPath]);

  // Effect to navigate WHEN THE USER TYPES (syncing TO the URL).
  useEffect(() => {
    // This guard is crucial. It prevents navigation when the state is just syncing
    // from a URL change.
    if (!isUserTyping.current) {
      return;
    }

    const queryFromPath = getQueryFromPath();
    const trimmedDebouncedQuery = debouncedQuery.trim();

    if (trimmedDebouncedQuery && trimmedDebouncedQuery !== queryFromPath) {
      navigate(`/search/${encodeURIComponent(trimmedDebouncedQuery)}`);
    } else if (!trimmedDebouncedQuery && queryFromPath) {
      // User cleared the search bar while on a search page, so go home.
      navigate('/');
    }
  }, [debouncedQuery, navigate, getQueryFromPath]);
  
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isUserTyping.current = true; // Mark that this change is from the user
    setQuery(e.target.value);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    isUserTyping.current = false; // Prevent debounced effect from also firing
    const trimmedQuery = query.trim();
    const queryFromPath = getQueryFromPath();

    if (trimmedQuery && trimmedQuery !== queryFromPath) {
        navigate(`/search/${encodeURIComponent(trimmedQuery)}`);
    } else if (!trimmedQuery && queryFromPath) {
        // User submits an empty search from a search page, go home
        navigate('/');
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleQueryChange}
        placeholder="Search for movies or TV shows..."
        className="w-full bg-primary border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon className="h-5 w-5 text-muted" />
      </div>
    </form>
  );
};

export default SearchBar;
