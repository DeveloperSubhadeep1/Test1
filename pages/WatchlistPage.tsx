import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { WatchlistContext } from '../context/WatchlistContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import MovieCard from '../components/MovieCard';
import { BookmarkIcon } from '../components/Icons';

const WatchlistPage: React.FC = () => {
  const { watchlist } = useContext(WatchlistContext);
  
  usePageMetadata({
    title: 'Your Watchlist',
    description: 'View movies and TV shows you have saved to watch later on CineStream.',
    path: '/watchlist',
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 border-l-4 border-accent pl-4">Your Watchlist</h1>
      {watchlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {watchlist.map(item => (
            <MovieCard key={`${item.type}-${item.id}`} item={item} type={item.type} />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted text-lg mt-10 flex flex-col items-center">
            <BookmarkIcon className="h-16 w-16 mb-4" />
            <p className="font-bold text-xl">Your Watchlist is Empty</p>
            <p>Add movies and shows to your watchlist to see them here.</p>
            <Link to="/" className="mt-4 bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors">
                Find Something to Watch
            </Link>
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;