import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { Avatar, AVATAR_OPTIONS } from '../components/Avatars';

const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');
  const [loading, setLoading] = useState(false);

  usePageMetadata({
    title: 'Your Profile',
    description: 'Manage your username and avatar on CineStream.',
    path: '/profile',
  });

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setSelectedAvatar(currentUser.avatarId);
    }
  }, [currentUser]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || selectedAvatar === currentUser.avatarId) {
      return; // No changes to save
    }

    setLoading(true);
    await updateProfile({ avatarId: selectedAvatar });
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 border-l-4 border-light-accent dark:border-accent pl-4">Your Profile</h1>
      <div className="bg-light-secondary dark:bg-secondary p-8 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-light-muted dark:text-muted mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
              disabled // Username changes are complex and not supported in this setup for simplicity.
            />
             <p className="text-xs text-light-muted dark:text-muted mt-1">Username cannot be changed.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-light-muted dark:text-muted mb-2">
              Choose Your Avatar
            </label>
            <div className="flex flex-wrap gap-4">
              {AVATAR_OPTIONS.map((avatarId) => (
                <button
                  type="button"
                  key={avatarId}
                  onClick={() => setSelectedAvatar(avatarId)}
                  className={`rounded-full p-1 transition-all duration-200 ${
                    selectedAvatar === avatarId ? 'ring-2 ring-light-accent dark:ring-accent' : 'ring-2 ring-transparent hover:ring-light-muted dark:hover:ring-muted'
                  }`}
                  aria-label={`Select avatar ${avatarId}`}
                  disabled={loading}
                >
                  <Avatar avatarId={avatarId} className="h-16 w-16" />
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-light-accent dark:bg-accent text-white font-bold py-3 px-4 rounded-md hover:bg-blue-500 transition-colors disabled:bg-gray-500"
              disabled={loading || (currentUser && selectedAvatar === currentUser.avatarId)}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
