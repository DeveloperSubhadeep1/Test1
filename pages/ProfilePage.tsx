import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { Avatar } from '../components/Avatars';
import { useToast } from '../hooks/useToast';
import { EditIcon, XCircleIcon } from '../components/Icons';

const MAX_AVATAR_SIZE_MB = 10;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const ProfilePage: React.FC = () => {
  const { currentUser, saveCustomAvatar } = useContext(AuthContext);
  const { addToast } = useToast();
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  usePageMetadata({
    title: 'Your Profile',
    description: 'Manage your username and avatar on CineStream.',
    path: '/profile',
  });

  useEffect(() => {
    // Reset avatar preview if the current user changes (e.g., on logout/login)
    setNewAvatarPreview(null);
  }, [currentUser]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Invalid file type. Please select an image file.', 'error');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      addToast(`File is too large. Please select an image smaller than ${MAX_AVATAR_SIZE_MB}MB.`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAvatarPreview) return;

    setLoading(true);
    await saveCustomAvatar(newAvatarPreview);
    setNewAvatarPreview(null); // Clear the preview after saving
    setLoading(false);
    navigate('/');
  };

  const handleReset = async () => {
    setLoading(true);
    await saveCustomAvatar(null);
    setNewAvatarPreview(null);
    setLoading(false);
    navigate('/');
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (!currentUser) {
    return null; // Or a loading state
  }

  const hasCustomAvatar = !!(newAvatarPreview || currentUser.customAvatar);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 border-l-4 border-light-accent dark:border-accent pl-4">Your Profile</h1>
      <div className="bg-light-secondary dark:bg-secondary p-8 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar 
                avatar={currentUser.avatar}
                customAvatar={newAvatarPreview || currentUser.customAvatar}
                className="h-32 w-32 rounded-full" 
              />
              <button
                type="button"
                onClick={triggerFileSelect}
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Change avatar"
              >
                <EditIcon className="h-8 w-8 text-white" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
            />
             <p className="text-xs text-light-muted dark:text-muted">Click image to change. Max {MAX_AVATAR_SIZE_MB}MB.</p>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-light-muted dark:text-muted mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={currentUser.username || ''}
              className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
              disabled
            />
             <p className="text-xs text-light-muted dark:text-muted mt-1">Username cannot be changed.</p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
             {hasCustomAvatar && (
                 <button
                    type="button"
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 bg-light-muted/50 dark:bg-muted/50 text-white font-bold py-3 px-4 rounded-md hover:bg-light-muted/70 dark:hover:bg-muted/70 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    <XCircleIcon className="h-5 w-5" />
                    Reset to Default
                </button>
             )}
            <button
              type="submit"
              className="w-full bg-light-accent dark:bg-accent text-white font-bold py-3 px-4 rounded-md hover:bg-blue-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              disabled={loading || !newAvatarPreview}
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