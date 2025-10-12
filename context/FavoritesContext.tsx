import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { FavoriteItem, ContentItem } from '../types';
import { useToast } from '../hooks/useToast';
import { AuthContext } from './AuthContext';

interface FavoritesContextType {
  favorites: FavoriteItem[];
  loading: boolean;
  addFavorite: (item: ContentItem) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

export const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  loading: true,
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
});

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const getStorageKey = useCallback(() => {
    return currentUser ? `cineStreamFavorites_${currentUser._id}` : null;
  }, [currentUser]);

  useEffect(() => {
    setLoading(true);
    if (isAuthenticated && currentUser) {
      try {
        const storageKey = getStorageKey();
        if (storageKey) {
          const storedFavorites = localStorage.getItem(storageKey);
          if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
          } else {
            setFavorites([]);
          }
        }
      } catch (error) {
        console.error("Failed to load favorites from localStorage", error);
        addToast("Could not load your local favorites.", 'error');
        setFavorites([]);
      }
    } else {
      // Clear favorites on logout
      setFavorites([]);
    }
    setLoading(false);
  }, [currentUser, isAuthenticated, addToast, getStorageKey]);

  const addFavorite = useCallback(async (item: ContentItem) => {
    if (!currentUser) return;
    if (favorites.some(fav => fav.id === item.id)) return;
    
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const newFavorite: FavoriteItem = { ...item, dateAdded: Date.now() };
      const newFavorites = [...favorites, newFavorite];
      setFavorites(newFavorites);
      localStorage.setItem(storageKey, JSON.stringify(newFavorites));
      const title = 'title' in item ? item.title : item.name;
      addToast(`Added "${title}" to favorites.`, 'success');
    } catch (error) {
      console.error("Failed to save favorite", error);
      addToast("Could not save to favorites in local storage.", 'error');
    }
  }, [currentUser, favorites, addToast, getStorageKey]);

  const removeFavorite = useCallback(async (tmdbId: number) => {
    if (!currentUser) return;
    
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    const itemToRemove = favorites.find(fav => fav.id === tmdbId);
    if (!itemToRemove) return;

    try {
      const newFavorites = favorites.filter(fav => fav.id !== tmdbId);
      setFavorites(newFavorites);
      localStorage.setItem(storageKey, JSON.stringify(newFavorites));
      const title = 'title' in itemToRemove ? itemToRemove.title : itemToRemove.name;
      addToast(`Removed "${title}" from favorites.`, 'info');
    } catch (error) {
      console.error("Failed to remove favorite", error);
      addToast("Could not remove from favorites in local storage.", 'error');
    }
  }, [currentUser, favorites, addToast, getStorageKey]);

  const isFavorite = useCallback((id: number): boolean => {
    return favorites.some(fav => fav.id === id);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, loading, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};