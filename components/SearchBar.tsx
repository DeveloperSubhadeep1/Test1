import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { SearchIcon } from './Icons';
import { searchTMDB } from '../services/api';
import { MovieSummary, TVSummary } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isUserTyping = useRef(false);

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
  const debouncedQuery = useDebounce(query, 300); // Shorten debounce for better autocomplete feel

  const [suggestions, setSuggestions] = useState<(MovieSummary | TVSummary)[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const queryFromPath = getQueryFromPath();
    isUserTyping.current = false;
    if (queryFromPath !== query) {
      setQuery(queryFromPath);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getQueryFromPath]);

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
        setShowSuggestions(false);
      }
    };

    if (isUserTyping.current) {
      fetchSuggestions();
    }
  }, [debouncedQuery]);

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

  return (
    <div className="relative" ref={searchContainerRef}>
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          placeholder="Search for movies or TV shows..."
          className="w-full bg-primary border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-muted" />
        </div>
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-secondary border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <ul>
            {suggestions.map((item, index) => {
              const type = (item as any).media_type;
              const title = type === 'movie' ? (item as MovieSummary).title : (item as TVSummary).name;
              const releaseDate = type === 'movie' ? (item as MovieSummary).release_date : (item as TVSummary).first_air_date;
              const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
              const posterUrl = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : 'https://picsum.photos/50/75';

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
        </div>
      )}
    </div>
  );
};

export default SearchBar;
