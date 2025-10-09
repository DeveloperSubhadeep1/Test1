
import React, { useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import SearchBar from './SearchBar';
import { FilmIcon, UserIcon } from './Icons';
import { ProfileContext } from '../context/ProfileContext';
import { Avatar } from './Avatars';


const Header: React.FC = () => {
  const { profile } = useContext(ProfileContext);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-secondary text-white' : 'text-muted hover:bg-secondary hover:text-white'
    }`;

  return (
    <header className="bg-secondary/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-white text-xl font-bold">
              <FilmIcon className="h-8 w-8 text-accent" />
              <span>CineStream</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-4">
              <NavLink to="/" className={navLinkClass}>Home</NavLink>
              <NavLink to="/favorites" className={navLinkClass}>Favorites</NavLink>
              <NavLink to="/watchlist" className={navLinkClass}>Watchlist</NavLink>
              <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-full max-w-xs">
              <SearchBar />
            </div>
            <NavLink
              to="/profile"
              className={({ isActive }) => `flex items-center gap-2 p-1.5 rounded-full transition-colors ${
                isActive ? 'bg-secondary' : 'hover:bg-secondary'
              }`}
              aria-label="View Profile"
            >
              {profile ? (
                <Avatar avatarId={profile.avatarId} className="h-8 w-8 rounded-full" />
              ) : (
                <UserIcon className="h-8 w-8 text-muted" />
              )}
              <span className="hidden lg:inline text-white font-medium pr-2">{profile?.username || 'Profile'}</span>
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;