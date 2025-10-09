import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserProfile } from '../types';
import { useToast } from '../hooks/useToast';

const PROFILE_STORAGE_KEY = 'cineStreamUserProfile';

interface ProfileContextType {
  profile: UserProfile | null;
  saveProfile: (profile: UserProfile) => void;
}

export const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  saveProfile: () => {},
});

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        // Set a default profile if none exists for a new user
        const defaultProfile: UserProfile = { username: 'Guest', avatarId: 'avatar1' };
        setProfile(defaultProfile);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfile));
      }
    } catch (error) {
      console.error("Failed to load profile from localStorage", error);
      addToast('Could not load your profile.', 'error');
    }
  }, [addToast]);

  const saveProfile = useCallback((newProfile: UserProfile) => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
      addToast('Profile saved successfully!', 'success');
    } catch (error) {
      console.error("Failed to save profile to localStorage", error);
      addToast('Could not save your profile. Storage might be full.', 'error');
    }
  }, [addToast]);

  return (
    <ProfileContext.Provider value={{ profile, saveProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
