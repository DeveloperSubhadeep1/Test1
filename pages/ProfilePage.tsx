import React, { useContext, useState, useEffect } from 'react';
import { ProfileContext } from '../context/ProfileContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { UserProfile } from '../types';
import { Avatar, AVATAR_OPTIONS } from '../components/Avatars';

const ProfilePage: React.FC = () => {
  const { profile, saveProfile } = useContext(ProfileContext);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');

  usePageMetadata({
    title: 'Your Profile',
    description: 'Manage your username and avatar on CineStream.',
    path: '/profile',
  });

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setSelectedAvatar(profile.avatarId);
    }
  }, [profile]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      const newProfile: UserProfile = {
        username: trimmedUsername,
        avatarId: selectedAvatar,
      };
      saveProfile(newProfile);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 border-l-4 border-accent pl-4">Your Profile</h1>
      <div className="bg-secondary p-8 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-muted mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-primary border border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent"
              required
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Choose Your Avatar
            </label>
            <div className="flex flex-wrap gap-4">
              {AVATAR_OPTIONS.map((avatarId) => (
                <button
                  type="button"
                  key={avatarId}
                  onClick={() => setSelectedAvatar(avatarId)}
                  className={`rounded-full p-1 transition-all duration-200 ${
                    selectedAvatar === avatarId ? 'ring-2 ring-accent' : 'ring-2 ring-transparent hover:ring-muted'
                  }`}
                  aria-label={`Select avatar ${avatarId}`}
                >
                  <Avatar avatarId={avatarId} className="h-16 w-16" />
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-accent text-white font-bold py-3 px-4 rounded-md hover:bg-blue-500 transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
