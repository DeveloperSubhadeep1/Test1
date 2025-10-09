import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { SearchIcon, ClockIcon, XIcon } from './Icons';
import { searchTMDB } from '../services/api';
import { MovieSummary, TVSummary } from '../types';
import { TMDB_IMAGE_BASE_URL_SMALL } from '../constants';

const RECENT_SEARCHES_KEY = 'cineStreamRecentSearches';
const MAX_RECENT_SEARCHES = 5;

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isUserTyping = useRef(false);

  const getQueryFromPath = useCallback(() => {
    if (location.pathname.startsWith('/search/')) {
      try {
        return decodeURIComponent(location.pathname.split('/')[2]);
      } catch (e) {
        console.error("Failed to decode URL component", location.pathname.split('/')[2]);
        return '';
      }
    }
    return '';
  }, [location.pathname]);

  const [query, setQuery] = useState(getQueryFromPath());
  const debouncedQuery = useDebounce(query, 300);

  const [suggestions, setSuggestions] = useState<(MovieSummary | TVSummary)[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Load recent searches from localStorage on initial render
  useEffect(() => {
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
            setRecentSearches(JSON.parse(stored));
        }
    } catch (e) {
        console.error("Failed to parse recent searches from localStorage", e);
    }
  }, []);

  const updateRecentSearches = useCallback((searches: string[]) => {
      setRecentSearches(searches);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  }, []);

  const addRecentSearch = useCallback((term: string) => {
    if (!term) return;
    setRecentSearches(prevSearches => {
        const newSearches = [
            term,
            ...prevSearches.filter(s => s.toLowerCase() !== term.toLowerCase())
        ].slice(0, MAX_RECENT_SEARCHES);

        if (JSON.stringify(newSearches) !== JSON.stringify(prevSearches)) {
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
        }
        return newSearches;
    });
  }, []);
  
  useEffect(() => {
    const queryFromPath = getQueryFromPath();
    isUserTyping.current = false;
    if (queryFromPath !== query) {
      setQuery(queryFromPath);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getQueryFromPath]);
  
  // Effect to add a search term to history when the user lands on a search page
  useEffect(() => {
    const queryFromPath = getQueryFromPath();
    if (location.pathname.startsWith('/search/') && queryFromPath) {
        addRecentSearch(queryFromPath);
    }
  }, [location.pathname, getQueryFromPath, addRecentSearch]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim().length > 1) {
        try {
          const res = await searchTMDB(debouncedQuery);
          setSuggestions(res.results.slice(0, 5));
          setShowSuggestions(true);
          setActiveIndex(-1);
        } catch (error) {
          console.error("Failed to fetch search suggestions", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        if (query.trim().length === 0) {
            setShowSuggestions(true); // Show recent searches if input is empty
        } else {
            setShowSuggestions(false);
        }
      }
    };

    if (isUserTyping.current) {
      fetchSuggestions();
    }
  }, [debouncedQuery, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isUserTyping.current = true;
    setQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    isUserTyping.current = false;
    const trimmedQuery = query.trim();
    const queryFromPath = getQueryFromPath();

    if (trimmedQuery && trimmedQuery !== queryFromPath) {
      navigate(`/search/${encodeURIComponent(trimmedQuery)}`);
    } else if (!trimmedQuery && queryFromPath) {
      navigate('/');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prevIndex => (prevIndex + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prevIndex => (prevIndex - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0) {
          e.preventDefault();
          const selected = suggestions[activeIndex];
          const type = (selected as any).media_type;
          navigate(`/${type}/${selected.id}`);
          setShowSuggestions(false);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const clearSuggestions = () => {
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleRemoveRecent = (e: React.MouseEvent, term: string) => {
      e.stopPropagation();
      e.preventDefault();
      updateRecentSearches(recentSearches.filter(s => s !== term));
  };

  const handleClearAllRecent = (e: React.MouseEvent) => {
      e.stopPropagation();
      updateRecentSearches([]);
      setShowSuggestions(false);
  };

  const showRecentSearches = showSuggestions && query.trim().length === 0 && recentSearches.length > 0;
  const showLiveSuggestions = showSuggestions && query.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="relative" ref={searchContainerRef}>
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search for movies or TV shows..."
          className="w-full bg-primary border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-muted" />
        </div>
      </form>
      {(showRecentSearches || showLiveSuggestions) && (
        <div className="absolute z-20 w-full mt-1 bg-secondary border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {showRecentSearches && (
            <div>
              <div className="px-4 pt-3 pb-2 flex justify-between items-center">
                <h4 className="text-sm font-semibold text-muted">Recent Searches</h4>
                <button onClick={handleClearAllRecent} className="text-xs text-accent hover:underline">Clear All</button>
              </div>
              <ul>
                {recentSearches.map(term => (
                  <li key={term} className="group flex items-center justify-between hover:bg-primary">
                    <Link
                      to={`/search/${encodeURIComponent(term)}`}
                      onClick={clearSuggestions}
                      className="flex-grow flex items-center space-x-4 p-3 min-w-0"
                    >
                      <ClockIcon className="h-4 w-4 text-muted flex-shrink-0" />
                      <span className="text-white truncate">{term}</span>
                    </Link>
                    <button
                      onClick={(e) => handleRemoveRecent(e, term)}
                      className="p-3 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title={`Remove "${term}"`}
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showLiveSuggestions && (
            <ul>
              {suggestions.map((item, index) => {
                const type = (item as any).media_type;
                const title = type === 'movie' ? (item as MovieSummary).title : (item as TVSummary).name;
                const releaseDate = type === 'movie' ? (item as MovieSummary).release_date : (item as TVSummary).first_air_date;
                const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
                const posterUrl = item.poster_path ? `${TMDB_IMAGE_BASE_URL_SMALL}${item.poster_path}` : 'https://picsum.photos/50/75';

                return (
                  <li key={item.id} className={`${index === activeIndex ? 'bg-primary' : ''}`}>
                    <Link
                      to={`/${type}/${item.id}`}
                      onClick={clearSuggestions}
                      className="p-3 hover:bg-primary flex items-center space-x-4 cursor-pointer"
                    >
                      <img src={posterUrl} alt={title} className="w-12 h-auto rounded flex-shrink-0" />
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-white truncate">{title}</p>
                        <p className="text-sm text-muted">{year}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;