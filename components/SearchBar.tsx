import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { SearchIcon, ClockIcon, XIcon, InfoIcon, FilmIcon } from './Icons';
import { searchTMDB } from '../services/api';
import { MovieSummary, TVSummary } from '../types';
import { TMDB_IMAGE_BASE_URL_SMALL } from '../constants';
import { generateSlug } from '../utils';

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
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
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
        
        if (JSON.stringify(newSearches) === JSON.stringify(prevSearches)) {
            return prevSearches;
        }

        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
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
  
  useEffect(() => {
    const queryFromPath = getQueryFromPath();
    if (location.pathname.startsWith('/search/') && queryFromPath) {
        addRecentSearch(queryFromPath);
    }
  }, [location.pathname, getQueryFromPath, addRecentSearch]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim().length > 1) {
        setIsLoading(true);
        try {
          const res = await searchTMDB(debouncedQuery);
          setSuggestions(res.results.slice(0, 7));
          setShowSuggestions(true);
          setActiveIndex(-1);
        } catch (error) {
          console.error("Failed to fetch search suggestions", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setSuggestions([]);
        if (query.trim().length === 0) {
            setShowSuggestions(true);
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

  const showDropdown = showSuggestions && (query.trim().length > 0 || recentSearches.length > 0);
  const showRecentSearches = showSuggestions && query.trim().length === 0 && recentSearches.length > 0;
  const showLiveSuggestions = showSuggestions && query.trim().length > 0 && suggestions.length > 0;
  const showNoResults = showSuggestions && query.trim().length > 0 && !isLoading && suggestions.length === 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }

    const isShowingLive = showLiveSuggestions;
    const isShowingRecent = showRecentSearches;
    
    if (isShowingLive) {
        const listLength = suggestions.length + 1; // N suggestions + "View All" link
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prevIndex => (prevIndex + 1) % listLength);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prevIndex => (prevIndex - 1 + listLength) % listLength);
                break;
            case 'Enter':
                if (activeIndex >= 0) {
                    e.preventDefault();
                    setShowSuggestions(false);
                    if (activeIndex < suggestions.length) {
                        const item = suggestions[activeIndex];
                        const type = 'title' in item ? 'movie' : 'tv';
                        const title = 'title' in item ? item.title : item.name;
                        const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
                        const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
                        const slug = generateSlug(title, year);
                        navigate(`/${type}/${slug}`);
                    } else {
                        navigate(`/search/${encodeURIComponent(query.trim())}`);
                    }
                }
                break;
            default:
                break;
        }
    } else if (isShowingRecent) {
      const listLength = recentSearches.length;
      if (listLength === 0) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prevIndex => (prevIndex + 1) % listLength);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prevIndex => (prevIndex - 1 + listLength) % listLength);
          break;
        case 'Enter':
          if (activeIndex >= 0) {
            e.preventDefault();
            setShowSuggestions(false);
            const term = recentSearches[activeIndex];
            setQuery(term);
            navigate(`/search/${encodeURIComponent(term)}`);
          }
          break;
        default:
          break;
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

  const activeClass = 'bg-light-accent/20 dark:bg-accent/20';

  return (
    <div className="relative" ref={searchContainerRef}>
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search movies, TV shows..."
          className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-full py-2 lg:py-2.5 pl-10 lg:pl-12 pr-4 lg:pr-6 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent transition-all"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 left-0 pl-3 lg:pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-light-muted dark:text-muted" />
        </div>
      </form>
      {showDropdown && (
        <div className="absolute z-20 w-full mt-2 bg-light-primary dark:bg-secondary border border-light-border dark:border-gray-700 rounded-lg shadow-lg flex flex-col max-h-[80vh]">
          {showRecentSearches && (
            <div className="overflow-y-auto">
              <div className="px-4 pt-3 pb-2 flex justify-between items-center">
                <h4 className="text-sm font-semibold text-light-muted dark:text-muted">Recent Searches</h4>
                <button onClick={handleClearAllRecent} className="text-xs text-light-accent dark:text-accent hover:underline">Clear All</button>
              </div>
              <ul>
                {recentSearches.map((term, index) => (
                  <li 
                    key={term}
                    className={`group flex items-center justify-between transition-colors ${index === activeIndex ? activeClass : 'hover:bg-light-secondary dark:hover:bg-primary'}`}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <Link
                      to={`/search/${encodeURIComponent(term)}`}
                      onClick={clearSuggestions}
                      className="flex-grow flex items-center space-x-4 p-3 min-w-0"
                    >
                      <ClockIcon className="h-4 w-4 text-light-muted dark:text-muted flex-shrink-0" />
                      <span className="text-light-text dark:text-white truncate">{term}</span>
                    </Link>
                    <button
                      onClick={(e) => handleRemoveRecent(e, term)}
                      className="p-3 text-light-muted dark:text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title={`Remove "${term}"`}
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isLoading && <div className="p-4 text-center text-light-muted dark:text-muted">Loading...</div>}
          
          {showNoResults && (
            <div className="p-6 flex flex-col items-center justify-center text-center text-light-muted dark:text-muted">
              <InfoIcon className="h-10 w-10 mb-3" />
              <p className="font-semibold text-lg text-light-text dark:text-white">No Results Found</p>
              <p className="text-sm">We couldn't find anything for "{query}"</p>
            </div>
          )}

          {showLiveSuggestions && (
            <>
              <div className="overflow-y-auto">
                <div className="px-4 pt-3 pb-2">
                    <h4 className="text-sm font-semibold text-light-muted dark:text-muted">Top Results</h4>
                </div>
                <ul>
                    {suggestions.map((item, index) => {
                        const type = 'title' in item ? 'movie' : 'tv';
                        const title = type === 'movie' ? (item as MovieSummary).title : (item as TVSummary).name;
                        const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
                        const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
                        const posterUrl = item.poster_path ? `${TMDB_IMAGE_BASE_URL_SMALL}${item.poster_path}` : null;
                        const slug = generateSlug(title, year);

                        return (
                            <li
                                key={item.id}
                                className={`transition-colors ${index === activeIndex ? activeClass : 'hover:bg-light-secondary dark:hover:bg-primary'}`}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <Link
                                    to={`/${type}/${slug}`}
                                    onClick={clearSuggestions}
                                    className="flex items-center space-x-4 p-3 min-w-0"
                                >
                                    <div className="w-10 h-14 flex-shrink-0 bg-light-secondary dark:bg-primary rounded overflow-hidden">
                                        {posterUrl ? (
                                            <img src={posterUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                            <FilmIcon className="w-5 h-5 text-light-muted dark:text-muted" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="text-light-text dark:text-white truncate font-semibold">{title}</p>

                                        <p className="text-sm text-light-muted dark:text-muted">{year || 'N/A'}</p>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
              </div>
              <div className="flex-shrink-0 border-t border-light-border dark:border-gray-700">
                <Link
                  to={`/search/${encodeURIComponent(query.trim())}`}
                  onClick={clearSuggestions}
                  className={`block p-3 text-center w-full text-sm font-semibold text-light-accent dark:text-accent transition-colors ${activeIndex === suggestions.length ? activeClass : 'hover:bg-light-secondary dark:hover:bg-primary'}`}
                  onMouseEnter={() => setActiveIndex(suggestions.length)}
                >
                  View all results for "{query.trim()}"
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;