import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { FavoriteItem, ContentItem } from '../types';
import { useToast } from '../hooks/useToast';
import { AuthContext } from './AuthContext';
import { getFavorites, addFavorite as apiAddFavorite, removeFavorite as apiRemoveFavorite } from '../services/api';

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

  useEffect(() => {
    const fetchFavorites = async () => {
        if (isAuthenticated && currentUser) {
            setLoading(true);
            try {
                const userFavorites = await getFavorites();
                setFavorites(userFavorites);
            } catch (error) {
                console.error("Failed to fetch favorites", error);
                addToast("Could not load your favorites.", 'error');
            } finally {
                setLoading(false);
            }
        } else {
            // Clear favorites on logout
            setFavorites([]);
            setLoading(false);
        }
    };
    fetchFavorites();
  }, [currentUser, isAuthenticated, addToast]);

  const addFavorite = useCallback(async (item: ContentItem) => {
    if (!currentUser) return;
    if (favorites.some(fav => fav.id === item.id)) return;
    
    try {
      const newFavorite = await apiAddFavorite(item);
      setFavorites(prev => [newFavorite, ...prev]);
      const title = 'title' in item ? item.title : item.name;
      addToast(`Added "${title}" to favorites.`, 'success');
    } catch (error) {
      console.error("Failed to save favorite", error);
      addToast("Could not save to favorites.", 'error');
    }
  }, [currentUser, favorites, addToast]);

  const removeFavorite = useCallback(async (tmdbId: number) => {
    if (!currentUser) return;
    
    const itemToRemove = favorites.find(fav => fav.id === tmdbId);
    if (!itemToRemove) return;

    try {
      await apiRemoveFavorite(tmdbId);
      setFavorites(prev => prev.filter(fav => fav.id !== tmdbId));
      const title = 'title' in itemToRemove ? itemToRemove.title : itemToRemove.name;
      addToast(`Removed "${title}" from favorites.`, 'info');
    } catch (error) {
      console.error("Failed to remove favorite", error);
      addToast("Could not remove from favorites.", 'error');
    }
  }, [currentUser, favorites, addToast]);

  const isFavorite = useCallback((id: number): boolean => {
    return favorites.some(fav => fav.id === id);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, loading, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};