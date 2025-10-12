import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { HistoryItem, ContentItem } from '../types';
import { useToast } from '../hooks/useToast';
import { AuthContext } from './AuthContext';
import { getHistory, addToHistory as apiAddToHistory, clearHistory as apiClearHistory } from '../services/api';

interface HistoryContextType {
  history: HistoryItem[];
  loading: boolean;
  addToHistory: (item: ContentItem) => void;
  clearHistory: () => void;
}

export const HistoryContext = createContext<HistoryContextType>({
  history: [],
  loading: true,
  addToHistory: () => {},
  clearHistory: () => {},
});

interface HistoryProviderProps {
  children: ReactNode;
}

export const HistoryProvider: React.FC<HistoryProviderProps> = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
        if (currentUser) {
            setLoading(true);
            try {
                const userHistory = await getHistory();
                setHistory(userHistory);
            } catch (error) {
                console.error("Failed to fetch history", error);
                addToast("Could not load your viewing history.", 'error');
            } finally {
                setLoading(false);
            }
        } else {
            setHistory([]);
            setLoading(false);
        }
    };
    fetchHistory();
  }, [currentUser, addToast]);

  const addToHistory = useCallback(async (item: ContentItem) => {
    if (!currentUser) {
      return;
    }

    try {
      const newHistoryItem = await apiAddToHistory(item);
      // Add to the beginning of the list and remove duplicates, keeping the newest one
      setHistory(prev => [newHistoryItem, ...prev.filter(h => h.id !== item.id)]);
    } catch (error) {
      console.error("Failed to add to history", error);
    }
  }, [currentUser]);

  const clearHistory = useCallback(async () => {
    if (!currentUser || history.length === 0) return;
    
    try {
        await apiClearHistory();
        setHistory([]);
        addToast(`Your viewing history has been cleared.`, 'info');
    } catch (error) {
        console.error("Failed to clear history", error);
        addToast("Could not clear your history.", 'error');
    }
  }, [currentUser, history.length, addToast]);

  return (
    <HistoryContext.Provider value={{ history, loading, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};