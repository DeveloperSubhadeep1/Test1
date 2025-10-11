import React, { useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
// FIX: Removed LogOutIcon from this import as it's defined below.
import { FilmIcon, MenuIcon, SunIcon, MoonIcon, UserIcon } from './Icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Avatar } from './Avatars';

interface HeaderProps {
  onMenuClick: () => void;
}

// Added LogOutIcon to Icons.tsx, but will embed it here for simplicity of change
const LogOutIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { currentUser, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            
            {currentUser ? (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) => `flex items-center gap-2 p-1.5 rounded-full transition-colors ${
                    isActive ? 'bg-light-secondary dark:bg-primary' : 'hover:bg-light-secondary dark:hover:bg-primary'
                  }`}
                  aria-label="View Profile"
                >
                  <Avatar 
                    avatar={currentUser.avatar}
                    customAvatar={currentUser.customAvatar}
                    className="h-8 w-8 rounded-full" 
                  />
                  <span className="hidden lg:inline text-light-text dark:text-white font-medium pr-2">{currentUser.username}</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-light-muted dark:text-gray-400 hover:text-light-text dark:hover:text-white hover:bg-light-secondary dark:hover:bg-primary transition-colors"
                  aria-label="Logout"
                >
                    <LogOutIcon className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                {/* Mobile: User icon linking to login */}
                <Link
                  to="/login"
                  className="sm:hidden p-2 rounded-full text-light-muted dark:text-gray-400 hover:text-light-text dark:hover:text-white hover:bg-light-secondary dark:hover:bg-primary transition-colors"
                  aria-label="Login or Sign up"
                >
                  <UserIcon className="h-5 w-5" />
                </Link>
          
                {/* Desktop: Full Log In / Sign Up buttons */}
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="px-4 py-1.5 text-sm font-semibold rounded-full bg-light-secondary dark:bg-secondary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      Log In
                  </Link>
                  <Link to="/signup" className="px-4 py-1.5 text-sm font-semibold rounded-full bg-light-accent dark:bg-accent text-white hover:opacity-90 transition-opacity">
                      Sign Up
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
