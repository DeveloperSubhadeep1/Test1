
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { WatchlistItem, ContentItem } from '../types';
import { useToast } from '../hooks/useToast';

const WATCHLIST_STORAGE_KEY = 'cineStreamWatchlist';

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  addToWatchlist: (item: ContentItem) => void;
  removeFromWatchlist: (id: number) => void;
  isOnWatchlist: (id: number) => boolean;
}

export const WatchlistContext = createContext<WatchlistContextType>({
  watchlist: [],
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  isOnWatchlist: () => false,
});

interface WatchlistProviderProps {
  children: ReactNode;
}

export const WatchlistProvider: React.FC<WatchlistProviderProps> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    try {
      const storedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (storedWatchlist) {
        const parsedWatchlist: WatchlistItem[] = JSON.parse(storedWatchlist).map((item: any, index: number) => ({
            ...item,
            dateAdded: item.dateAdded || (Date.now() - index * 60000) // Gracefully handle old data
        }));
        setWatchlist(parsedWatchlist);
      }
    } catch (error) {
      console.error("Failed to load watchlist from localStorage", error);
      addToast('Could not load your watchlist from local storage.', 'error');
    }
  }, [addToast]);

  const saveWatchlist = useCallback((items: WatchlistItem[]) => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
      setWatchlist(items);
    } catch (error) {
      console.error("Failed to save watchlist to localStorage", error);
      addToast('Could not save your changes. Your browser storage might be full.', 'error');
    }
  }, [addToast]);

  const addToWatchlist = useCallback((item: ContentItem) => {
    setWatchlist(prevWatchlist => {
      if (prevWatchlist.some(watch => watch.id === item.id)) {
        return prevWatchlist;
      }
      const newWatchlistItem: WatchlistItem = { ...item, dateAdded: Date.now() };
      const newWatchlist = [...prevWatchlist, newWatchlistItem];
      saveWatchlist(newWatchlist);
      const title = 'title' in item ? item.title : item.name;
      addToast(`Added "${title}" to your watchlist.`, 'success');
      return newWatchlist;
    });
  }, [saveWatchlist, addToast]);

  const removeFromWatchlist = useCallback((id: number) => {
    setWatchlist(prevWatchlist => {
      const item = prevWatchlist.find(watch => watch.id === id);
      const newWatchlist = prevWatchlist.filter(watch => watch.id !== id);
      saveWatchlist(newWatchlist);
      if (item) {
        const title = 'title' in item ? item.title : item.name;
        addToast(`Removed "${title}" from your watchlist.`, 'info');
      }
      return newWatchlist;
    });
  }, [saveWatchlist, addToast]);

  const isOnWatchlist = useCallback((id: number): boolean => {
    return watchlist.some(watch => watch.id === id);
  }, [watchlist]);

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isOnWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
};
