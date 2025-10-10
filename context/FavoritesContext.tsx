import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { FavoriteItem, ContentItem } from '../types';
import { useToast } from '../hooks/useToast';
import { AuthContext } from './AuthContext';
import { getFavorites, addFavorite as apiAddFavorite, removeFavorite as apiRemoveFavorite } from '../services/api';

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addFavorite: (item: ContentItem) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

export const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
});

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (currentUser) {
        try {
          const userFavorites = await getFavorites();
          setFavorites(userFavorites);
        } catch (error) {
          console.error("Failed to fetch favorites", error);
          addToast("Could not load your favorites.", 'error');
        }
      } else {
        setFavorites([]);
      }
    };
    fetchFavorites();
  }, [currentUser, addToast]);

  const addFavorite = useCallback(async (item: ContentItem) => {
    if (!currentUser) {
      addToast('You must be logged in to add favorites.', 'error');
      return;
    }
    if (favorites.some(fav => fav.id === item.id)) return;
    
    try {
      const newFavorite = await apiAddFavorite(item);
      setFavorites(prev => [...prev, newFavorite]);
      const title = 'title' in item ? item.title : item.name;
      addToast(`Added "${title}" to favorites.`, 'success');
    } catch (error) {
      console.error("Failed to add favorite", error);
      addToast("Could not add to favorites.", 'error');
    }
  }, [currentUser, favorites, addToast]);

  const removeFavorite = useCallback(async (tmdbId: number) => {
    if (!currentUser) return;
    
    const itemToRemove = favorites.find(fav => fav.id === tmdbId);
    if (!itemToRemove || !itemToRemove._id) return;

    try {
      await apiRemoveFavorite(itemToRemove._id);
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
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};
