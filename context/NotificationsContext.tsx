import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Notification } from '../types';
import { useToast } from '../hooks/useToast';
import { getNotifications } from '../services/api';

const LAST_SEEN_NOTIFICATION_KEY = 'cineStreamLastSeenNotificationId';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: () => void;
}

export const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAsRead: () => {},
});

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedNotifications = await getNotifications();
      setNotifications(fetchedNotifications);

      const lastSeenId = localStorage.getItem(LAST_SEEN_NOTIFICATION_KEY);
      if (fetchedNotifications.length > 0) {
        if (!lastSeenId) {
          // If user has never seen any notification, all are unread
          setUnreadCount(fetchedNotifications.length);
        } else {
          const lastSeenIndex = fetchedNotifications.findIndex(n => n._id === lastSeenId);
          if (lastSeenIndex !== -1) {
            setUnreadCount(lastSeenIndex);
          } else {
            // If the last seen ID isn't in the new list, assume all are new
            setUnreadCount(fetchedNotifications.length);
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
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchNotifications]);
  

  const markAsRead = useCallback(() => {
    if (notifications.length > 0) {
      localStorage.setItem(LAST_SEEN_NOTIFICATION_KEY, notifications[0]._id);
      setUnreadCount(0);
    }
  }, [notifications]);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, markAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};