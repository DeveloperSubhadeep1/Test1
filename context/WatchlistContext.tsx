import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { WatchlistItem, ContentItem } from '../types';
import { useToast } from '../hooks/useToast';
import { AuthContext } from './AuthContext';
import { getWatchlist, addToWatchlist as apiAddToWatchlist, removeFromWatchlist as apiRemoveFromWatchlist } from '../services/api';

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
  const { currentUser } = useContext(AuthContext);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchWatchlist = async () => {
        if (currentUser) {
            try {
                const userWatchlist = await getWatchlist();
                setWatchlist(userWatchlist);
            } catch (error) {
                console.error("Failed to fetch watchlist", error);
                addToast("Could not load your watchlist.", 'error');
            }
        } else {
            setWatchlist([]);
        }
    };
    fetchWatchlist();
  }, [currentUser, addToast]);

  const addToWatchlist = useCallback(async (item: ContentItem) => {
    if (!currentUser) {
      addToast('You must be logged in to add to your watchlist.', 'error');
      return;
    }
    if (watchlist.some(watch => watch.id === item.id)) return;

    try {
        const newWatchlistItem = await apiAddToWatchlist(item);
        setWatchlist(prev => [...prev, newWatchlistItem]);
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
    if (!itemToRemove || !itemToRemove._id) return;
    
    try {
        await apiRemoveFromWatchlist(itemToRemove._id);
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
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isOnWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
};
