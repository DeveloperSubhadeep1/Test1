import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { Collection, CollectionItem, TVSummary } from '../types';
import { useToast } from '../hooks/useToast';
import { AuthContext } from './AuthContext';
import { 
  getMyCollections, 
  createCollection as apiCreateCollection, 
  deleteCollection as apiDeleteCollection,
  addItemToCollection as apiAddItem,
  removeItemFromCollection as apiRemoveItem,
  updateCollection as apiUpdateCollection
} from '../services/api';

interface CollectionContextType {
  collections: Collection[];
  loading: boolean;
  fetchCollections: () => Promise<void>;
  createCollection: (data: { name: string; description?: string; isPublic: boolean }) => Promise<Collection | null>;
  deleteCollection: (id: string) => Promise<void>;
  updateCollection: (id: string, data: { name?: string; description?: string; isPublic?: boolean }) => Promise<void>;
  addItemToCollection: (collectionId: string, item: CollectionItem) => Promise<void>;
  removeItemFromCollection: (collectionId: string, tmdbId: number) => Promise<void>;
}

export const CollectionContext = createContext<CollectionContextType>({
  collections: [],
  loading: true,
  fetchCollections: async () => {},
  createCollection: async () => null,
  deleteCollection: async () => {},
  updateCollection: async () => {},
  addItemToCollection: async () => {},
  removeItemFromCollection: async () => {},
});

interface CollectionProviderProps {
  children: ReactNode;
}

export const CollectionProvider: React.FC<CollectionProviderProps> = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchCollections = useCallback(async () => {
    if (currentUser) {
      setLoading(true);
      try {
        const userCollections = await getMyCollections();
        setCollections(userCollections);
      } catch (error) {
        console.error("Failed to fetch collections", error);
        addToast("Could not load your collections.", 'error');
      } finally {
        setLoading(false);
      }
    } else {
      setCollections([]);
      setLoading(false);
    }
  }, [currentUser, addToast]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = useCallback(async (data: { name: string; description?: string; isPublic: boolean }): Promise<Collection | null> => {
    if (!currentUser) return null;
    try {
      const newCollection = await apiCreateCollection(data);
      setCollections(prev => [newCollection, ...prev]);
      addToast(`Collection "${data.name}" created.`, 'success');
      return newCollection;
    } catch (error) {
      console.error("Failed to create collection", error);
      addToast(error instanceof Error ? error.message : "Could not create collection.", 'error');
      return null;
    }
  }, [currentUser, addToast]);

  const deleteCollection = useCallback(async (id: string) => {
    if (!currentUser) return;
    try {
      await apiDeleteCollection(id);
      setCollections(prev => prev.filter(c => c._id !== id));
      addToast(`Collection deleted.`, 'info');
    } catch (error) {
      console.error("Failed to delete collection", error);
      addToast("Could not delete collection.", 'error');
    }
  }, [currentUser, addToast]);

  const updateCollection = useCallback(async (id: string, data: { name?: string; description?: string; isPublic?: boolean }) => {
    if (!currentUser) return;
    try {
      const updatedCollection = await apiUpdateCollection(id, data);
      setCollections(prev => prev.map(c => c._id === id ? updatedCollection : c));
      addToast(`Collection updated.`, 'success');
    } catch (error) {
      console.error("Failed to update collection", error);
      addToast("Could not update collection.", 'error');
    }
  }, [currentUser, addToast]);

  const addItemToCollection = useCallback(async (collectionId: string, item: CollectionItem) => {
    if (!currentUser) return;
    try {
      const updatedCollection = await apiAddItem(collectionId, item);
      setCollections(prev => prev.map(c => c._id === collectionId ? updatedCollection : c));
      // FIX: The `in` operator type guard does not correctly narrow the type in the `else` branch for a discriminated union that uses `Omit`.
      // Using a type assertion via `unknown` allows us to safely access the `name` property, as we know it will be present on TV items.
      const title = 'title' in item ? item.title : (item as unknown as TVSummary).name;
      addToast(`Added "${title}" to collection.`, 'success');
    } catch (error) {
       console.error("Failed to add item to collection", error);
       addToast(error instanceof Error ? error.message : "Could not add item.", 'error');
    }
  }, [currentUser, addToast]);
  
  const removeItemFromCollection = useCallback(async (collectionId: string, tmdbId: number) => {
    if (!currentUser) return;
    try {
      const updatedCollection = await apiRemoveItem(collectionId, tmdbId);
      setCollections(prev => prev.map(c => c._id === collectionId ? updatedCollection : c));
      addToast(`Item removed from collection.`, 'info');
    } catch (error) {
      console.error("Failed to remove item from collection", error);
      addToast("Could not remove item.", 'error');
    }
  }, [currentUser, addToast]);

  return (
    <CollectionContext.Provider value={{ 
      collections, 
      loading, 
      fetchCollections,
      createCollection, 
      deleteCollection,
      updateCollection,
      addItemToCollection,
      removeItemFromCollection 
    }}>
      {children}
    </CollectionContext.Provider>
  );
};
