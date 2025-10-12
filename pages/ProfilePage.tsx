import React, { useContext, useState, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { WatchlistContext } from '../context/WatchlistContext';
import { HistoryContext } from '../context/HistoryContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { Avatar } from '../components/Avatars';
import { EditIcon, UserIcon, HeartIcon, BookmarkIcon, ClockIcon, TrashIcon } from '../components/Icons';
import MovieCard from '../components/MovieCard';
import ProfileEditModal from '../components/ProfileEditModal';

type ActivityTab = 'favorites' | 'watchlist' | 'history';

const ProfilePage: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const { favorites, loading: favoritesLoading } = useContext(FavoritesContext);
  const { watchlist, loading: watchlistLoading } = useContext(WatchlistContext);
  const { history, clearHistory, loading: historyLoading } = useContext(HistoryContext);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActivityTab>('favorites');

  usePageMetadata({
    title: currentUser?.customName || currentUser?.username || 'Your Profile',
    description: 'Manage your profile, view your favorites, watchlist, and history on CineStream.',
    path: '/profile',
  });

  const calculateAge = (dob: string | undefined): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const age = useMemo(() => calculateAge(currentUser?.dob), [currentUser?.dob]);

  if (!currentUser) {
    return null; // Or a loading state
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'favorites':
        return favorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {favorites.map(item => <MovieCard key={`${item.type}-${item.id}`} item={item} type={item.type} />)}
          </div>
        ) : <EmptyState icon={<HeartIcon className="h-12 w-12 mb-4" />} message="No Favorites Yet" />;
      case 'watchlist':
        return watchlist.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {watchlist.map(item => <MovieCard key={`${item.type}-${item.id}`} item={item} type={item.type} />)}
          </div>
        ) : <EmptyState icon={<BookmarkIcon className="h-12 w-12 mb-4" />} message="Your Watchlist is Empty" />;
      case 'history':
        return history.length > 0 ? (
           <>
            <div className="text-right mb-4">
              <button onClick={clearHistory} className="flex items-center gap-2 text-sm bg-light-secondary dark:bg-secondary text-light-muted dark:text-muted px-3 py-1.5 rounded-full hover:bg-red-500/20 dark:hover:bg-red-500/20 hover:text-red-500 transition-colors ml-auto">
                <TrashIcon className="h-4 w-4" />
                <span>Clear History</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {history.map(item => <MovieCard key={`${item.type}-${item.id}-${item.viewedAt}`} item={item} type={item.type} />)}
            </div>
           </>
        ) : <EmptyState icon={<ClockIcon className="h-12 w-12 mb-4" />} message="No Viewing History" />;
      default:
        return null;
    }
  };
  
  const TabButton: React.FC<{ tab: ActivityTab; label: string; count: number; icon: React.ReactNode }> = ({ tab, label, count, icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-bold transition-all duration-300 border-b-2 ${
        activeTab === tab
          ? 'text-light-accent dark:text-cyan border-light-accent dark:border-cyan'
          : 'text-light-muted dark:text-muted border-transparent hover:text-light-text dark:hover:text-white'
      }`}
    >
      {icon}
      {label} <span className="bg-light-secondary dark:bg-secondary px-2 py-0.5 rounded-full text-xs">{count}</span>
    </button>
  );

  const EmptyState: React.FC<{icon: React.ReactNode; message: string}> = ({ icon, message }) => (
      <div className="text-center text-light-muted dark:text-muted text-lg mt-10 py-10 flex flex-col items-center">
          {icon}
          <p className="font-bold text-xl">{message}</p>
      </div>
  );

  return (
    <>
      {isEditModalOpen && <ProfileEditModal onClose={() => setIsEditModalOpen(false)} />}
      
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar 
            avatar={currentUser.avatar}
            className="h-28 w-28 sm:h-36 sm:w-36 rounded-full flex-shrink-0 shadow-lg" 
          />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-light-text dark:text-white">{currentUser.customName || currentUser.username}</h1>
            <p className="text-light-muted dark:text-muted">@{currentUser.username}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-light-muted dark:text-muted mt-2">
              {age && <span>{age} years old</span>}
              {currentUser.gender && <span>{currentUser.gender}</span>}
              {currentUser.createdAt && <span>Joined {new Date(currentUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>}
            </div>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="mt-2 sm:mt-0 sm:ml-auto flex items-center justify-center gap-2 text-sm bg-light-secondary dark:bg-secondary text-light-muted dark:text-muted px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-light-text dark:hover:text-white transition-colors flex-shrink-0"
          >
            <EditIcon className="h-4 w-4" />
            Edit Profile
          </button>
        </header>
        
        <main>
            <div className="border-b border-light-border dark:border-gray-800 flex">
                <TabButton tab="favorites" label="Favorites" count={favorites.length} icon={<HeartIcon className="h-4 w-4" />} />
                <TabButton tab="watchlist" label="Watchlist" count={watchlist.length} icon={<BookmarkIcon className="h-4 w-4" />} />
                <TabButton tab="history" label="History" count={history.length} icon={<ClockIcon className="h-4 w-4" />} />
            </div>
            <div className="mt-6">
                {(favoritesLoading || watchlistLoading || historyLoading) && activeTab === 'favorites' ? <p>Loading...</p> : renderContent()}
            </div>
        </main>
      </div>
    </>
  );
};

export default ProfilePage;