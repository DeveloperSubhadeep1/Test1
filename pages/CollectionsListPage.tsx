import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CollectionContext } from '../context/CollectionContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { LayersIcon } from '../components/Icons';
import MovieCardSkeleton from '../components/MovieCardSkeleton';
import { TMDB_IMAGE_BASE_URL_SMALL } from '../constants';

const CollectionsListPage: React.FC = () => {
  const { collections, loading } = useContext(CollectionContext);

  usePageMetadata({
    title: 'My Collections',
    description: 'View and manage your curated collections of movies and TV shows on CineStream.',
    path: '/collections',
  });

  if (loading) {
    return (
      <div>
        <div className="h-9 w-64 bg-light-secondary dark:bg-secondary rounded-md animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-light-secondary dark:bg-secondary rounded-lg shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 w-full bg-light-border dark:bg-gray-700"></div>
                <div className="p-4">
                    <div className="h-6 bg-light-border dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-light-border dark:bg-gray-700 rounded w-1/4"></div>
                </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold border-l-4 border-light-accent dark:border-accent pl-4">My Collections</h1>
        {/* Future: <button>Create New</button> */}
      </div>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {collections.map(collection => (
            <Link 
                to={`/collection/${collection._id}`} 
                key={collection._id}
                className="group bg-light-secondary dark:bg-secondary rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 block"
            >
                <div className="relative h-48 w-full flex items-end p-4 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9), transparent), url(${collection.items[0]?.poster_path ? TMDB_IMAGE_BASE_URL_SMALL + collection.items[0].poster_path : ''})`}}>
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-1 h-full w-full overflow-hidden opacity-30">
                        {collection.items.slice(0, 4).map((item, index) => (
                            <div key={item.id} className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.poster_path ? TMDB_IMAGE_BASE_URL_SMALL + item.poster_path : ''})`}}></div>
                        ))}
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-white group-hover:text-accent transition-colors">{collection.name}</h2>
                    </div>
                </div>
                <div className="p-4 flex justify-between items-center text-sm">
                    <p className="text-light-muted dark:text-muted">{collection.items.length} {collection.items.length === 1 ? 'item' : 'items'}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${collection.isPublic ? 'bg-cyan/20 text-cyan' : 'bg-muted/20 text-muted'}`}>
                        {collection.isPublic ? 'Public' : 'Private'}
                    </span>
                </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-light-muted dark:text-muted text-lg mt-10 flex flex-col items-center">
            <LayersIcon className="h-16 w-16 mb-4" />
            <p className="font-bold text-xl">No Collections Yet</p>
            <p>Create collections to organize your favorite content.</p>
            <Link to="/" className="mt-4 bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors">
                Find Something to Add
            </Link>
        </div>
      )}
    </div>
  );
};

export default CollectionsListPage;