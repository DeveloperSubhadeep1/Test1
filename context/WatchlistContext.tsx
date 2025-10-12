import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { WatchlistItem, ContentItem } from '../types';
import { useToast } from '../hooks/useToast';
import { AuthContext } from './AuthContext';

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  loading: boolean;
  addToWatchlist: (item: ContentItem) => void;
  removeFromWatchlist: (id: number) => void;
  isOnWatchlist: (id: number) => boolean;
}

export const WatchlistContext = createContext<WatchlistContextType>({
  watchlist: [],
  loading: true,
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  isOnWatchlist: () => false,
});

interface WatchlistProviderProps {
  children: ReactNode;
}

export const WatchlistProvider: React.FC<WatchlistProviderProps> = ({ children }) => {
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const getStorageKey = useCallback(() => {
    return currentUser ? `cineStreamWatchlist_${currentUser._id}` : null;
  }, [currentUser]);

  useEffect(() => {
    setLoading(true);
    if (isAuthenticated && currentUser) {
      try {
        const storageKey = getStorageKey();
        if (storageKey) {
            const storedWatchlist = localStorage.getItem(storageKey);
            if (storedWatchlist) {
                setWatchlist(JSON.parse(storedWatchlist));
            } else {
                setWatchlist([]);
            }
        }
      } catch (error) {
        console.error("Failed to fetch watchlist from localStorage", error);
        addToast("Could not load your local watchlist.", 'error');
        setWatchlist([]);
      }
    } else {
      setWatchlist([]);
    }
    setLoading(false);
  }, [currentUser, isAuthenticated, addToast, getStorageKey]);

  const addToWatchlist = useCallback(async (item: ContentItem) => {
    if (!currentUser) return;
    if (watchlist.some(watch => watch.id === item.id)) return;

    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
        const newWatchlistItem: WatchlistItem = { ...item, dateAdded: Date.now() };
        const newWatchlist = [...watchlist, newWatchlistItem];
        setWatchlist(newWatchlist);
        localStorage.setItem(storageKey, JSON.stringify(newWatchlist));
        const title = 'title' in item ? item.title : item.name;
        addToast(`Added "${title}" to your watchlist.`, 'success');
    } catch (error) {
        console.error("Failed to add to watchlist", error);
        addToast("Could not add to local watchlist.", 'error');
    }
  }, [currentUser, watchlist, addToast, getStorageKey]);

  const removeFromWatchlist = useCallback(async (tmdbId: number) => {
    if (!currentUser) return;
    
    const storageKey = getStorageKey();
    if (!storageKey) return;

    const itemToRemove = watchlist.find(watch => watch.id === tmdbId);
    if (!itemToRemove) return;
    
    try {
        const newWatchlist = watchlist.filter(watch => watch.id !== tmdbId);
        setWatchlist(newWatchlist);
        localStorage.setItem(storageKey, JSON.stringify(newWatchlist));
        const title = 'title' in itemToRemove ? itemToRemove.title : itemToRemove.name;
        addToast(`Removed "${title}" from your watchlist.`, 'info');
    } catch (error) {
        console.error("Failed to remove from watchlist", error);
        addToast("Could not remove from local watchlist.", 'error');
    }
  }, [currentUser, watchlist, addToast, getStorageKey]);

  const isOnWatchlist = useCallback((id: number): boolean => {
    return watchlist.some(watch => watch.id === id);
  }, [watchlist]);

  return (
    <WatchlistContext.Provider value={{ watchlist, loading, addToWatchlist, removeFromWatchlist, isOnWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
};