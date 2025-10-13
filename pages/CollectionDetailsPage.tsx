import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Collection, MovieSummary, TVSummary } from '../types';
import { getCollectionDetails, removeItemFromCollection, deleteCollection } from '../services/api';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { useToast } from '../hooks/useToast';
import { AuthContext } from '../context/AuthContext';
import { CollectionContext } from '../context/CollectionContext';
import MovieCard from '../components/MovieCard';
import Spinner from '../components/Spinner';
import { LayersIcon, EditIcon, TrashIcon } from '../components/Icons';
import MovieCardSkeleton from '../components/MovieCardSkeleton';
import ConfirmationModal from '../components/ConfirmationModal';

const CollectionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const { fetchCollections } = useContext(CollectionContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const isOwner = currentUser && collection && currentUser._id === collection.userId;
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  usePageMetadata({
    title: collection?.name || 'Collection',
    description: collection?.description || `View this collection on CineStream.`,
    path: `/collection/${id}`,
  });

  const fetchCollectionData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getCollectionDetails(id);
      setCollection(data);
    } catch (error) {
      console.error('Failed to fetch collection details:', error);
      addToast('Could not load collection. It may be private or deleted.', 'error');
      navigate('/collections');
    } finally {
      setLoading(false);
    }
  }, [id, addToast, navigate]);

  useEffect(() => {
    fetchCollectionData();
  }, [fetchCollectionData]);

  const handleRemoveItem = async (tmdbId: number) => {
    if (!id || !isOwner) return;
    try {
      const updatedCollection = await removeItemFromCollection(id, tmdbId);
      setCollection(updatedCollection);
      await fetchCollections(); // Refresh context state
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to remove item.", 'error');
    }
  };

  const handleDeleteCollection = async () => {
    if (!id || !isOwner) return;
    try {
        await deleteCollection(id);
        addToast("Collection deleted successfully.", "info");
        await fetchCollections(); // Refresh context state
        navigate('/collections');
    } catch(error) {
        addToast(error instanceof Error ? error.message : "Failed to delete collection.", 'error');
    }
  };


  if (loading) {
     return (
        <div>
            <div className="animate-pulse mb-6">
                <div className="h-9 w-2/3 max-w-lg bg-light-secondary dark:bg-secondary rounded-md mb-3"></div>
                <div className="h-5 w-1/4 bg-light-secondary dark:bg-secondary rounded-md"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {Array.from({ length: 12 }).map((_, index) => (
                    <MovieCardSkeleton key={index} />
                ))}
            </div>
        </div>
     );
  }
  
  if (!collection) {
    return (
        <div className="text-center text-light-muted dark:text-muted text-lg mt-10 flex flex-col items-center">
            <LayersIcon className="h-16 w-16 mb-4" />
            <p className="font-bold text-xl">Collection Not Found</p>
            <p>This collection could not be loaded. It may be private or no longer exist.</p>
        </div>
    );
  }

  return (
    <div>
        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteCollection}
            title={`Delete "${collection.name}"`}
            message="Are you sure you want to delete this collection? This action cannot be undone."
        />
      <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold border-l-4 border-light-accent dark:border-accent pl-4">{collection.name}</h1>
            {collection.description && <p className="mt-2 text-light-muted dark:text-muted max-w-2xl">{collection.description}</p>}
            <div className="mt-2 flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${collection.isPublic ? 'bg-cyan/20 text-cyan' : 'bg-muted/20 text-muted'}`}>
                    {collection.isPublic ? 'Public' : 'Private'}
                </span>
            </div>
        </div>
        {isOwner && (
            <div className="flex-shrink-0 flex items-center gap-2">
                <button className="flex items-center gap-2 text-sm bg-light-secondary dark:bg-secondary text-light-muted dark:text-muted px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-light-text dark:hover:text-white transition-colors">
                    <EditIcon className="h-4 w-4" />
                    <span>Edit</span>
                </button>
                 <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center gap-2 text-sm bg-light-secondary dark:bg-secondary text-light-muted dark:text-muted px-3 py-1.5 rounded-full hover:bg-red-500/20 dark:hover:bg-red-500/20 hover:text-red-500 transition-colors"
                >
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete</span>
                </button>
            </div>
        )}
      </div>

      {collection.items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {collection.items.map(item => (
            <MovieCard 
                key={`${item.type}-${item.id}`} 
                // FIX: Corrected a TypeScript error when passing a CollectionItem to MovieCard. The spread operator on a discriminated union was causing type inference issues. Used a stronger type assertion (`as unknown as ...`) to resolve the type mismatch, as the resulting object is structurally correct for the MovieCard component.
                item={{ ...item, overview: '' } as unknown as (MovieSummary | TVSummary)}
                type={item.type}
                onRemove={isOwner ? handleRemoveItem : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-light-muted dark:text-muted text-lg mt-10 flex flex-col items-center">
            <LayersIcon className="h-16 w-16 mb-4" />
            <p className="font-bold text-xl">This Collection is Empty</p>
            <p>Add some movies and TV shows to get started.</p>
        </div>
      )}
    </div>
  );
};

export default CollectionDetailsPage;
