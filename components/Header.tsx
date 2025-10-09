import React, { useContext } from 'react';
import { NavLink, Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import { FilmIcon, MenuIcon, SunIcon, MoonIcon } from './Icons';
import { ProfileContext } from '../context/ProfileContext';
import { ThemeContext } from '../context/ThemeContext';
import { Avatar } from './Avatars';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { profile } = useContext(ProfileContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-light-accent text-white dark:bg-accent'
        : 'text-light-muted dark:text-gray-300 hover:bg-light-secondary dark:hover:bg-secondary hover:text-light-text dark:hover:text-white'
    }`;

  return (
    <header className="bg-light-secondary/80 dark:bg-secondary/80 backdrop-blur-sm sticky top-0 z-40 border-b border-light-border dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="p-2 mr-2 rounded-md text-light-muted dark:text-gray-400 hover:text-light-text dark:hover:text-white hover:bg-light-secondary dark:hover:bg-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-light-accent dark:focus:ring-white md:hidden"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2 text-light-text dark:text-white text-xl font-bold">
              <FilmIcon className="h-8 w-8 text-light-accent dark:text-accent" />
              <span className="hidden sm:inline">CineStream</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex md:items-center md:space-x-4 md:ml-10">
              <NavLink to="/" className={navLinkClass} end>Home</NavLink>
              <NavLink to="/genres" className={navLinkClass}>Genres</NavLink>
              <NavLink to="/favorites" className={navLinkClass}>Favorites</NavLink>
              <NavLink to="/watchlist" className={navLinkClass}>Watchlist</NavLink>
              <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-xs lg:max-w-sm">
                <SearchBar />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-light-muted dark:text-gray-400 hover:text-light-text dark:hover:text-white hover:bg-light-secondary dark:hover:bg-primary transition-colors"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <MoonIcon className="h-5 w-5" />
              ) : (
                <SunIcon className="h-5 w-5" />
              )}
            </button>

            {/* Profile */}
            <NavLink
              to="/profile"
              className={({ isActive }) => `flex items-center gap-2 p-1.5 rounded-full transition-colors ${
                isActive ? 'bg-light-secondary dark:bg-primary' : 'hover:bg-light-secondary dark:hover:bg-primary'
              }`}
              aria-label="View Profile"
            >
              {profile && (
                <Avatar avatarId={profile.avatarId} className="h-8 w-8 rounded-full" />
              )}
              <span className="hidden lg:inline text-light-text dark:text-white font-medium pr-2">{profile?.username || 'Profile'}</span>
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;