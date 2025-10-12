import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { WatchlistItem, ContentItem } from '../types';
import { useToast } from '../hooks/useToast';
import { AuthContext } from './AuthContext';
import { getWatchlist, addToWatchlist as apiAddToWatchlist, removeFromWatchlist as apiRemoveFromWatchlist } from '../services/api';

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

  useEffect(() => {
    const fetchWatchlist = async () => {
        if (isAuthenticated && currentUser) {
            setLoading(true);
            try {
                const userWatchlist = await getWatchlist();
                setWatchlist(userWatchlist);
            } catch (error) {
                console.error("Failed to fetch watchlist", error);
                addToast("Could not load your watchlist.", 'error');
            } finally {
                setLoading(false);
            }
        } else {
            setWatchlist([]);
            setLoading(false);
        }
    };
    fetchWatchlist();
  }, [currentUser, isAuthenticated, addToast]);

  const addToWatchlist = useCallback(async (item: ContentItem) => {
    if (!currentUser) return;
    if (watchlist.some(watch => watch.id === item.id)) return;

    try {
        const newWatchlistItem = await apiAddToWatchlist(item);
        setWatchlist(prev => [newWatchlistItem, ...prev]);
        const title = 'title' in item ? item.title : item.name;
        addToast(`Added "${title}" to your watchlist.`, 'success');
    } catch (error) {
        console.error("Failed to add to watchlist", error);
        addToast("Could not add to watchlist.", 'error');
    }
  }, [currentUser, watchlist, addToast]);

  const removeFromWatchlist = useCallback(async (tmdbId: number) => {
    if (!currentUser) return;

    const itemToRemove = watchlist.find(watch => watch.id === tmdbId);
    if (!itemToRemove) return;
    
    try {
        await apiRemoveFromWatchlist(tmdbId);
        setWatchlist(prev => prev.filter(watch => watch.id !== tmdbId));
        const title = 'title' in itemToRemove ? itemToRemove.title : itemToRemove.name;
        addToast(`Removed "${title}" from your watchlist.`, 'info');
    } catch (error) {
        console.error("Failed to remove from watchlist", error);
        addToast("Could not remove from watchlist.", 'error');
    }
  }, [currentUser, watchlist, addToast]);

  const isOnWatchlist = useCallback((id: number): boolean => {
    return watchlist.some(watch => watch.id === id);
  }, [watchlist]);

  return (
    <WatchlistContext.Provider value={{ watchlist, loading, addToWatchlist, removeFromWatchlist, isOnWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
};