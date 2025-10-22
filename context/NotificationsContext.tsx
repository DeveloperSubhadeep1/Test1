import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Notification } from '../types';
import { useToast } from '../hooks/useToast';
import { getNotifications } from '../services/api';

const LAST_SEEN_NOTIFICATION_KEY = 'cineStreamLastSeenNotificationId';
const DISMISSED_NOTIFICATIONS_KEY = 'cineStreamDismissedNotifications';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: () => void;
  dismissNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  fetchNotifications: () => Promise<void>;
}

export const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAsRead: () => {},
  dismissNotification: () => {},
  clearAllNotifications: () => {},
  fetchNotifications: async () => {},
});

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const getDismissedIds = (): string[] => {
    try {
      const stored = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      localStorage.removeItem(DISMISSED_NOTIFICATIONS_KEY);
      return [];
    }
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedNotifications = await getNotifications();
      const dismissedIds = getDismissedIds();
      const visibleNotifications = fetchedNotifications.filter(n => !dismissedIds.includes(n._id));
      
      setNotifications(visibleNotifications);

      const lastSeenId = localStorage.getItem(LAST_SEEN_NOTIFICATION_KEY);
      if (visibleNotifications.length > 0) {
        if (!lastSeenId) {
          setUnreadCount(visibleNotifications.length);
        } else {
          const lastSeenIndex = visibleNotifications.findIndex(n => n._id === lastSeenId);
          if (lastSeenIndex !== -1) {
            setUnreadCount(lastSeenIndex);
          } else {
            setUnreadCount(visibleNotifications.length);
          }
        }
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      addToast("Could not load notifications.", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60 * 1000); // Refresh every 1 minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);
  

  const markAsRead = useCallback(() => {
    if (notifications.length > 0) {
      localStorage.setItem(LAST_SEEN_NOTIFICATION_KEY, notifications[0]._id);
      setUnreadCount(0);
    }
  }, [notifications]);

  const dismissNotification = useCallback((notificationId: string) => {
    const dismissedIds = getDismissedIds();
    const newDismissedIds = [...dismissedIds, notificationId];
    localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(newDismissedIds));
    
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    const currentIds = notifications.map(n => n._id);
    if (currentIds.length === 0) return;

    const dismissedIds = getDismissedIds();
    const newDismissedIds = [...new Set([...dismissedIds, ...currentIds])];
    localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(newDismissedIds));
    
    if (notifications.length > 0) {
      localStorage.setItem(LAST_SEEN_NOTIFICATION_KEY, notifications[0]._id);
    }

    setNotifications([]);
    setUnreadCount(0);
  }, [notifications]);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, markAsRead, dismissNotification, clearAllNotifications, fetchNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};