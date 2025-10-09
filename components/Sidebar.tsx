import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FilmIcon, HomeIcon, HeartIcon, BookmarkIcon, UserCogIcon, GridIcon } from './Icons';

interface SidebarProps {
  onLinkClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLinkClick }) => {

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-light-accent dark:bg-accent text-white'
        : 'text-light-muted dark:text-gray-300 hover:bg-light-secondary dark:hover:bg-secondary hover:text-light-text dark:hover:text-white'
    }`;

  return (
    <aside className="bg-light-primary dark:bg-primary text-light-text dark:text-white w-64 h-full flex flex-col p-4 border-r border-light-border dark:border-gray-800">
      <Link to="/" className="flex items-center space-x-2 text-xl font-bold mb-8 px-2" onClick={onLinkClick}>
        <FilmIcon className="h-8 w-8 text-light-accent dark:text-accent" />
        <span>CineStream</span>
      </Link>
      
      <nav className="flex-1 flex flex-col gap-2">
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
        <NavLink to="/admin" className={navLinkClass} onClick={onLinkClick}>
            <UserCogIcon className="h-5 w-5" />
            <span>Admin</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;