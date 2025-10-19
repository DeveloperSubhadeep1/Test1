import React, { useContext, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { WatchlistContext } from '../context/WatchlistContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import MovieCard from '../components/MovieCard';
import SortDropdown from '../components/SortDropdown';
import { BookmarkIcon } from '../components/Icons';
import { WatchlistItem } from '../types';
import MovieCardSkeleton from '../components/MovieCardSkeleton';

const WatchlistPage: React.FC = () => {
  const { watchlist, loading } = useContext(WatchlistContext);
  const [sortOption, setSortOption] = useState('dateAdded_desc');
  
  usePageMetadata({
    title: 'Your Watchlist',
    description: 'View movies and TV shows you have saved to watch later on CineStream.',
    path: '/watchlist',
  });

  const sortedWatchlist = useMemo(() => {
    const sorted = [...watchlist];
    const [key, direction] = sortOption.split('_');

    sorted.sort((a: WatchlistItem, b: WatchlistItem) => {
      let comparison = 0;
      switch (key) {
        case 'title':
          const titleA = 'title' in a ? a.title : a.name;
          const titleB = 'title' in b ? b.title : b.name;
          comparison = titleA.localeCompare(titleB);
          break;
        case 'rating':
          comparison = b.vote_average - a.vote_average;
          break;
        case 'dateAdded':
          comparison = (b.dateAdded || 0) - (a.dateAdded || 0);
          break;
        default:
          return 0;
      }
      return direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [watchlist, sortOption]);

  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <div className="h-9 w-64 bg-light-secondary dark:bg-secondary rounded-md animate-pulse"></div>
          <div className="h-9 w-56 bg-light-secondary dark:bg-secondary rounded-md animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {Array.from({ length: 12 }).map((_, index) => (
            <MovieCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold border-l-4 border-light-accent dark:border-accent pl-4">Your Watchlist</h1>
        {watchlist.length > 0 && (
          <SortDropdown sortOption={sortOption} onSortChange={setSortOption} />
        )}
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 animate-fade-in">
          {sortedWatchlist.map(item => (
            <MovieCard key={`${item.type}-${item.id}`} item={item} type={item.type} />
          ))}
        </div>
      ) : (
        <div className="text-center text-light-muted dark:text-muted text-lg mt-10 flex flex-col items-center">
            <BookmarkIcon className="h-16 w-16 mb-4" />
            <p className="font-bold text-xl">Your Watchlist is Empty</p>
            <p>Add movies and shows to your watchlist to see them here.</p>
            <Link to="/" className="mt-4 bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors">
                Find Something to Watch
            </Link>
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;