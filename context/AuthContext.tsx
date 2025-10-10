import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { useToast } from '../hooks/useToast';
import { apiLogin, apiSignup, apiUpdateProfile } from '../services/api';

const SESSION_STORAGE_KEY = 'cineStreamSession';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  signup: (user: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (newProfileData: Omit<UserProfile, 'username' | '_id'>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => false,
  signup: async () => ({ success: false, message: 'Signup function not ready.' }),
  logout: () => {},
  updateProfile: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    try {
      const sessionUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionUser) {
        setCurrentUser(JSON.parse(sessionUser));
      }
    } catch (error) {
      console.error('Failed to load user session', error);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  const login = useCallback(async (username: string, pass: string): Promise<boolean> => {
    try {
      const userProfile = await apiLogin(username, pass);
      setCurrentUser(userProfile);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProfile));
      addToast(`Welcome back, ${username}!`, 'success');
      return true;
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Login failed.', 'error');
      return false;
    }
  }, [addToast]);

  const signup = useCallback(async (username: string, pass: string): Promise<{ success: boolean; message: string }> => {
    if (!username || username.trim().length < 3) {
      return { success: false, message: 'Username must be at least 3 characters.' };
    }
    if (!pass || pass.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }
    const trimmedUsername = username.trim();
    if (trimmedUsername.toLowerCase() === 'admin') {
      return { success: false, message: 'This username is reserved.' };
    }

    try {
       const newUserProfile = await apiSignup(trimmedUsername, pass);
       setCurrentUser(newUserProfile);
       sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUserProfile));
       addToast('Account created successfully! You are now logged in.', 'success');
       return { success: true, message: 'Signup successful!' };
    } catch (error) {
       const message = error instanceof Error ? error.message : 'An unknown error occurred.';
       return { success: false, message };
    }
  }, [addToast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    addToast("You've been logged out.", 'info');
  }, [addToast]);
  
  const updateProfile = useCallback(async (newProfileData: Omit<UserProfile, 'username' | '_id'>) => {
    if (!currentUser) return;
    try {
        const updatedProfile = await apiUpdateProfile(currentUser._id, newProfileData);
        setCurrentUser(updatedProfile);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedProfile));
        addToast('Profile updated!', 'success');
    } catch (e) {
        addToast('Failed to save profile.', 'error');
    }
  }, [currentUser, addToast]);

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.username === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isAdmin, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
