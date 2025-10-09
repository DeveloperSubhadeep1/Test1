
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FavoritesContext } from '../context/FavoritesContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import MovieCard from '../components/MovieCard';
import { HeartIcon } from '../components/Icons';

const FavoritesPage: React.FC = () => {
  const { favorites } = useContext(FavoritesContext);
  
  usePageMetadata({
    title: 'Your Favorites',
    description: 'View your saved favorite movies and TV shows on CineStream.',
    path: '/favorites',
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 border-l-4 border-accent pl-4">Your Favorites</h1>
      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {favorites.map(item => (
            <MovieCard key={`${item.type}-${item.id}`} item={item} type={item.type} />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted text-lg mt-10 flex flex-col items-center">
            <HeartIcon className="h-16 w-16 mb-4" />
            <p className="font-bold text-xl">No Favorites Yet</p>
            <p>Add movies and shows to your favorites to see them here.</p>
            <Link to="/" className="mt-4 bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors">
                Find Something to Watch
            </Link>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;