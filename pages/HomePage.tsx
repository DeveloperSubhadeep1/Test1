
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getDiscover } from '../services/api';
import { MovieSummary, TVSummary } from '../types';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';
import MovieCard from '../components/MovieCard';
import Spinner from '../components/Spinner';
import TelegramPromo from '../components/TelegramPromo';

const SortFilter: React.FC<{
  currentSort: string;
  onSortChange: (newSort: string) => void;
}> = ({ currentSort, onSortChange }) => {
  const buttonClass = (sortType: string) => `px-4 py-1 text-sm font-semibold rounded-full transition-colors ${
      currentSort === sortType
          ? 'bg-accent text-white'
          : 'bg-secondary text-muted hover:bg-gray-700'
  }`;

  return (
    <div className="flex space-x-2 bg-primary p-1 rounded-full">
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

const HomePage: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState('popularity.desc');

  const observer = useRef<IntersectionObserver | null>(null);

  usePageMetadata({
    title: 'Discover Movies & TV Shows',
    description: 'Explore and discover the latest and greatest movies and TV shows. Find popular, top-rated content and get download links.',
    path: '/',
  });
  
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
        const [moviesRes, tvShowsRes] = await Promise.all([
          getDiscover('movie', 1, sort),
          getDiscover('tv', 1, sort)
        ]);
        
        const moviesWithType = moviesRes.results.map(m => ({ ...m, type: 'movie' as const }));
        const tvShowsWithType = tvShowsRes.results.map(t => ({ ...t, type: 'tv' as const }));
        
        setContent(interleave(moviesWithType, tvShowsWithType));
        setPage(1);
      } catch (error) {
        console.error('Failed to fetch content:', error);
        addToast('Could not load content. Please try again later.', 'error');
      } finally {
        setLoading(false);
      }
  }, [sort, addToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
        const nextPage = page + 1;
        const [moviesRes, tvShowsRes] = await Promise.all([
            getDiscover('movie', nextPage, sort),
            getDiscover('tv', nextPage, sort)
        ]);

        const moviesWithType = moviesRes.results.map(m => ({ ...m, type: 'movie' as const }));
        const tvShowsWithType = tvShowsRes.results.map(t => ({ ...t, type: 'tv' as const }));
        
        const newContent = interleave(moviesWithType, tvShowsWithType);
        
        setContent(prev => [...prev, ...newContent]);
        setPage(nextPage);
    } catch (error) {
        console.error('Failed to load more content:', error);
        addToast('Could not load more content. Please try again.', 'error');
    } finally {
        setLoadingMore(false);
    }
  }, [loadingMore, page, sort, addToast]);

  const loaderRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            handleLoadMore();
        }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, handleLoadMore]);
  
  const handleSortChange = (newSort: string) => {
    if (sort === newSort) return;
    setSort(newSort);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-12">
      <TelegramPromo />
      <section>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            <h1 className="text-3xl font-bold border-l-4 border-accent pl-4">Discover</h1>
            <SortFilter currentSort={sort} onSortChange={handleSortChange} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {content.map(item => (
            <MovieCard key={`${item.type}-${item.id}`} item={item} type={item.type} />
          ))}
        </div>
        <div ref={loaderRef} className="h-10" />
        {loadingMore && <Spinner />}
      </section>
    </div>
  );
};

export default HomePage;
