import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getDiscover, getAllGenres } from '../services/api';
import { MovieSummary, TVSummary, Genre } from '../types';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';
import MovieCard from '../components/MovieCard';
import Spinner from '../components/Spinner';
import TelegramAd from '../components/TelegramAd';
import { XIcon } from '../components/Icons';
import MovieCardSkeleton from '../components/MovieCardSkeleton';

const SortFilter: React.FC<{
  currentSort: string;
  onSortChange: (newSort: string) => void;
}> = ({ currentSort, onSortChange }) => {
  const buttonClass = (sortType: string) => `px-4 py-1 text-sm font-semibold rounded-full transition-colors ${
      currentSort === sortType
          ? 'bg-light-accent dark:bg-accent text-white'
          : 'bg-light-secondary dark:bg-secondary text-light-muted dark:text-muted hover:bg-gray-200 dark:hover:bg-gray-700'
  }`;

  return (
    <div className="flex space-x-2 bg-light-primary dark:bg-primary p-1 rounded-full">
      <button onClick={() => onSortChange('popularity.desc')} className={buttonClass('popularity.desc')}>
        Popular
      </button>
      <button onClick={() => onSortChange('vote_average.desc')} className={buttonClass('vote_average.desc')}>
        Top Rated
      </button>
    </div>
  );
};

type ContentItem = (MovieSummary | TVSummary) & { type: 'movie' | 'tv' };

const useQuery = () => {
    return new URLSearchParams(useLocation().search);
}

const HomePage: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState('popularity.desc');
  const query = useQuery();
  const [genre, setGenre] = useState(query.get('genre') || '');
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [selectedGenreName, setSelectedGenreName] = useState('');

  const observer = useRef<IntersectionObserver | null>(null);

  usePageMetadata({
    title: 'Discover Movies & TV Shows',
    description: 'Explore and discover the latest and greatest movies and TV shows. Find popular, top-rated content and get download links.',
    path: '/',
  });
  
  // Update genre from URL
  useEffect(() => {
    setGenre(query.get('genre') || '');
  }, [query]);

  // Fetch all genres for mapping ID to name
  useEffect(() => {
    const fetchAllGenres = async () => {
      try {
        const genresData = await getAllGenres();
        setAllGenres(genresData);
      } catch {
        // Error toast is already handled in the service
      }
    };
    fetchAllGenres();
  }, []);

  // Update genre name when ID or genre list changes
  useEffect(() => {
    if (genre && allGenres.length > 0) {
      const foundGenre = allGenres.find(g => g.id.toString() === genre);
      setSelectedGenreName(foundGenre ? foundGenre.name : 'Selected Genre');
    } else {
      setSelectedGenreName('');
    }
  }, [genre, allGenres]);

  const interleave = (arr1: any[], arr2: any[]): any[] => {
    const result = [];
    const len = Math.max(arr1.length, arr2.length);
    for (let i = 0; i < len; i++) {
        if (arr1[i]) result.push(arr1[i]);
        if (arr2[i]) result.push(arr2[i]);
    }
    return result;
  };

  const fetchInitialData = useCallback(async () => {
      try {
        setLoading(true);

        const moviePromise = getDiscover('movie', 1, sort, genre || undefined);
        const tvPromise = getDiscover('tv', 1, sort, genre || undefined);
        
        const [moviesRes, tvShowsRes] = await Promise.all([moviePromise, tvPromise]);

        const moviesWithType = moviesRes.results.map(m => ({ ...m, type: 'movie' as const }));
        const tvShowsWithType = tvShowsRes.results.map(t => ({ ...t, type: 'tv' as const }));
        
        const newContent = interleave(moviesWithType, tvShowsWithType);

        setContent(newContent);
        setPage(1);
      } catch (error) {
        console.error('Failed to fetch content:', error);
        addToast('An unexpected error occurred while loading content.', 'error');
      } finally {
        setLoading(false);
      }
  }, [sort, genre, addToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
        const nextPage = page + 1;

        const moviePromise = getDiscover('movie', nextPage, sort, genre || undefined);
        const tvPromise = getDiscover('tv', nextPage, sort, genre || undefined);

        const [moviesRes, tvShowsRes] = await Promise.all([moviePromise, tvPromise]);

        const moviesWithType = moviesRes.results.map(m => ({ ...m, type: 'movie' as const }));
        const tvShowsWithType = tvShowsRes.results.map(t => ({ ...t, type: 'tv' as const }));
        const newContent = interleave(moviesWithType, tvShowsWithType);
        
        setContent(prev => [...prev, ...newContent]);
        setPage(nextPage);
    } catch (error) {
        console.error('Failed to load more content:', error);
        addToast('An unexpected error occurred while loading more content.', 'error');
    } finally {
        setLoadingMore(false);
    }
  }, [loadingMore, page, sort, genre, addToast]);

  const loaderRef = useCallback(node => {
    if (loadingMore || content.length === 0) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            handleLoadMore();
        }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, handleLoadMore, content.length]);
  
  const handleSortChange = (newSort: string) => {
    if (sort === newSort) return;
    setSort(newSort);
  };

  return (
    <div className="space-y-8">
      <TelegramAd />
      <section>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
          {selectedGenreName ? (
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold border-l-4 border-light-accent dark:border-accent pl-4">
                {selectedGenreName}
              </h1>
              <Link to="/" className="flex items-center gap-1 text-sm bg-light-secondary dark:bg-secondary text-light-muted dark:text-muted px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-light-text dark:hover:text-white transition-colors" title="Clear genre filter">
                <XIcon className="h-4 w-4" />
                <span>Clear</span>
              </Link>
            </div>
          ) : (
            <h1 className="text-3xl font-bold border-l-4 border-light-accent dark:border-accent pl-4">Discover</h1>
          )}
          <SortFilter currentSort={sort} onSortChange={handleSortChange} />
        </div>

        {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {Array.from({ length: 12 }).map((_, index) => (
                    <MovieCardSkeleton key={index} />
                ))}
            </div>
        ) : content.length > 0 ? (
            <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 animate-fade-in">
                {content.map(item => (
                    <MovieCard key={`${item.type}-${item.id}`} item={item} type={item.type} />
                ))}
                </div>
                <div ref={loaderRef} className="h-10" />
                {loadingMore && <Spinner />}
            </>
        ) : (
            <p className="text-center text-light-muted dark:text-muted text-lg mt-10">No results match your current filters.</p>
        )}
      </section>
    </div>
  );
};

export default HomePage;