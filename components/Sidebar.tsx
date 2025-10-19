import React, { useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FilmIcon, HomeIcon, HeartIcon, BookmarkIcon, UserCogIcon, GridIcon, XIcon, LayersIcon, LinkIcon } from './Icons';
import { Avatar } from './Avatars';

interface SidebarProps {
  onLinkClick?: () => void;
  onClose?: () => void;
}

// FIX: Corrected the malformed viewBox attribute which caused a JSX parsing error.
const LogOutIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const Sidebar: React.FC<SidebarProps> = ({ onLinkClick, onClose }) => {
  const { currentUser, isAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onLinkClick) onLinkClick();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-light-accent dark:bg-accent text-white'
        : 'text-light-muted dark:text-gray-300 hover:bg-light-secondary dark:hover:bg-secondary hover:text-light-text dark:hover:text-white'
    }`;
    
  return (
    <aside className="bg-light-primary dark:bg-primary text-light-text dark:text-white w-64 h-full flex flex-col p-4 border-r border-light-border dark:border-gray-800">
      <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold" onClick={onLinkClick}>
          <FilmIcon className="h-8 w-8 text-light-accent dark:text-accent" />
          <span>CineStream</span>
        </Link>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-light-muted dark:text-gray-400 hover:bg-light-secondary dark:hover:bg-secondary"
          aria-label="Close menu"
        >
            <XIcon className="h-6 w-6" />
        </button>
      </div>
      
      {/* User Profile / Auth Section */}
      <div className="mb-6 px-2"> 
        {currentUser ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-light-secondary dark:bg-secondary">
            <NavLink to="/profile" onClick={onLinkClick} className="flex items-center gap-3 flex-grow min-w-0">
              <Avatar 
                avatar={currentUser.avatar}
                className="h-9 w-9 rounded-full flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate text-light-text dark:text-white">{currentUser.username}</p>
              </div>
            </NavLink>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-light-muted dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0"
              title="Logout"
              aria-label="Logout"
            >
              <LogOutIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link to="/login" onClick={onLinkClick} className="block w-full text-center px-4 py-2 text-sm font-semibold rounded-full bg-light-secondary dark:bg-secondary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Log In
            </Link>
            <Link to="/signup" onClick={onLinkClick} className="block w-full text-center px-4 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-accent text-white hover:opacity-90 transition-opacity">
              Sign Up
            </Link>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex flex-col gap-2">
            <NavLink to="/" className={navLinkClass} end onClick={onLinkClick}>
                <HomeIcon className="h-5 w-5" />
                <span>Home</span>
            </NavLink>
            <NavLink to="/genres" className={navLinkClass} onClick={onLinkClick}>
                <GridIcon className="h-5 w-5" />
                <span>Genres</span>
            </NavLink>
            <NavLink to="/favorites" className={navLinkClass} onClick={onLinkClick}>
                <HeartIcon className="h-5 w-5" />
                <span>Favorites</span>
            </NavLink>
            <NavLink to="/watchlist" className={navLinkClass} onClick={onLinkClick}>
                <BookmarkIcon className="h-5 w-5" />
                <span>Watchlist</span>
            </NavLink>
            <NavLink to="/collections" className={navLinkClass} onClick={onLinkClick}>
                <LayersIcon className="h-5 w-5" />
                <span>My Collections</span>
            </NavLink>
            
            <div className="px-4 pt-4 pb-2">
                <h5 className="text-xs font-semibold text-muted uppercase tracking-wider">Tools</h5>
            </div>
             <NavLink to="/url-parser" className={navLinkClass} onClick={onLinkClick}>
                <LinkIcon className="h-5 w-5" />
                <span>URL Parser</span>
            </NavLink>
            
            {isAdmin && (
              <>
                <div className="px-4 pt-4 pb-2">
                    <h5 className="text-xs font-semibold text-muted uppercase tracking-wider">Admin</h5>
                </div>
                <NavLink to="/admin" className={navLinkClass} onClick={onLinkClick}>
                    <UserCogIcon className="h-5 w-5" />
                    <span>Dashboard</span>
                </NavLink>
              </>
            )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;