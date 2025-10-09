
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { FavoriteItem } from '../types';
import { useToast } from '../hooks/useToast';

const FAVORITES_STORAGE_KEY = 'cineStreamFavorites';

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
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
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage", error);
      addToast('Could not load your favorites from local storage.', 'error');
    }
  }, [addToast]);

  const saveFavorites = useCallback((items: FavoriteItem[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
      setFavorites(items);
    } catch (error) {
      console.error("Failed to save favorites to localStorage", error);
      addToast('Could not save your changes. Your browser storage might be full.', 'error');
    }
  }, [addToast]);

  const addFavorite = useCallback((item: FavoriteItem) => {
    setFavorites(prevFavorites => {
      if (prevFavorites.some(fav => fav.id === item.id)) {
        return prevFavorites;
      }
      const newFavorites = [...prevFavorites, item];
      saveFavorites(newFavorites);
      const title = 'title' in item ? item.title : item.name;
      addToast(`Added "${title}" to favorites.`, 'success');
      return newFavorites;
    });
  }, [saveFavorites, addToast]);

  const removeFavorite = useCallback((id: number) => {
    setFavorites(prevFavorites => {
      const item = prevFavorites.find(fav => fav.id === id);
      const newFavorites = prevFavorites.filter(fav => fav.id !== id);
      saveFavorites(newFavorites);
      if (item) {
        const title = 'title' in item ? item.title : item.name;
        addToast(`Removed "${title}" from favorites.`, 'info');
      }
      return newFavorites;
    });
  }, [saveFavorites, addToast]);

  const isFavorite = useCallback((id: number): boolean => {
    return favorites.some(fav => fav.id === id);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};
