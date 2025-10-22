import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NotificationsContext } from '../context/NotificationsContext';
import { BellIcon, FilmIcon, XIcon } from './Icons';
import { generateSlug } from '../utils';

const Notifications: React.FC = () => {
  const { notifications, unreadCount, markAsRead, dismissNotification, clearAllNotifications } = useContext(NotificationsContext);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      markAsRead();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        className="group relative p-2 rounded-full text-light-muted dark:text-gray-400 hover:text-light-text dark:hover:text-white hover:bg-light-secondary dark:hover:bg-primary transition-colors"
        aria-label="View notifications"
      >
        <BellIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 transform -translate-y-1/4 translate-x-1/4">
             <span className="absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75 animate-ping"></span>
             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-30 w-80 mt-2 right-0 origin-top-right glass-panel rounded-lg shadow-lg animate-fade-in">
          <div className="p-3 border-b border-glass-border">
            <h4 className="font-bold text-white text-sm">Notifications</h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <ul>
                {notifications.map(notif => {
                  const slug = generateSlug(notif.title);
                  return (
                    <li key={notif._id} className="group/item flex items-center justify-between p-3 hover:bg-cyan/10 transition-colors">
                      <Link
                        to={`/${notif.type}/${notif.tmdb_id}-${slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 flex-grow min-w-0"
                      >
                        <div className="flex-shrink-0 bg-secondary p-1.5 rounded-full">
                           <FilmIcon className="h-4 w-4 text-cyan" />
                        </div>
                        <p className="text-sm text-gray-300 truncate">
                           Link added for <span className="font-bold text-white">{notif.title}</span>
                        </p>
                      </Link>
                       <button 
                        onClick={(e) => { e.stopPropagation(); dismissNotification(notif._id); }} 
                        className="p-1 rounded-full text-muted opacity-0 group-hover/item:opacity-100 hover:bg-secondary hover:text-white flex-shrink-0 ml-2"
                        aria-label="Dismiss notification"
                        title="Dismiss"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-4 text-center text-sm text-muted">No new notifications.</p>
            )}
          </div>
          {notifications.length > 0 && (
              <div className="p-2 border-t border-glass-border text-center">
                  <button onClick={clearAllNotifications} className="w-full text-xs text-muted hover:text-cyan p-1 rounded-md transition-colors">Clear All</button>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;