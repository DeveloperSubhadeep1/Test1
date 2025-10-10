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

  return (
    <header className="bg-light-secondary/80 dark:bg-secondary/80 backdrop-blur-sm sticky top-0 z-40 border-b border-light-border dark:border-gray-800">
      <div className="container">
        <div className="flex items-center h-16 gap-4">
          {/* Left Section */}
          <div className="flex flex-1 items-center justify-start">
            <button
              onClick={onMenuClick}
              className="p-2 mr-2 rounded-md text-light-muted dark:text-gray-400 hover:text-light-text dark:hover:text-white hover:bg-light-secondary dark:hover:bg-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-light-accent dark:focus:ring-white"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2 text-light-text dark:text-white text-xl font-bold">
              <FilmIcon className="h-8 w-8 text-light-accent dark:text-accent" />
              <span className="hidden sm:inline">CineStream</span>
            </Link>
          </div>

          {/* Center Section: Search Bar */}
          <div className="w-full max-w-2xl">
            <SearchBar />
          </div>

          {/* Right Section */}
          <div className="flex flex-1 items-center justify-end gap-2">
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