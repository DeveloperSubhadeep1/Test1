import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { useToast } from '../hooks/useToast';
import { apiLogin, apiSendOtp, apiSignup, apiUpdateUserProfile } from '../services/api';

const SESSION_STORAGE_KEY = 'cineStreamSession';

interface UpdateDetailsPayload {
    customName?: string;
    dob?: string;
    gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    customAvatar?: string | null;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  sendOtp: (user: string, email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  verifyAndSignup: (user: string, otp: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfileDetails: (details: UpdateDetailsPayload) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => false,
  sendOtp: async () => ({ success: false, message: 'OTP function not ready.' }),
  verifyAndSignup: async () => ({ success: false, message: 'Signup function not ready.' }),
  logout: () => {},
  updateProfileDetails: async () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    try {
      const sessionUserJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionUserJson) {
        const sessionUser: UserProfile = JSON.parse(sessionUserJson);
        
        // Load custom avatar from localStorage and merge
        const avatarStorageKey = `cineStreamAvatar_${sessionUser._id}`;
        const customAvatar = localStorage.getItem(avatarStorageKey);
        sessionUser.customAvatar = customAvatar;
        
        setCurrentUser(sessionUser);
      }
    } catch (error) {
      console.error('Failed to load user session', error);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  const login = useCallback(async (username: string, pass: string): Promise<boolean> => {
    try {
      const userProfile = await apiLogin(username, pass);
      
      // Load custom avatar from localStorage and merge
      const avatarStorageKey = `cineStreamAvatar_${userProfile._id}`;
      const customAvatar = localStorage.getItem(avatarStorageKey);
      userProfile.customAvatar = customAvatar;

      setCurrentUser(userProfile);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProfile));
      
      addToast(`Welcome back, ${username}!`, 'success');
      return true;
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Login failed.', 'error');
      return false;
    }
  }, [addToast]);

  const sendOtp = useCallback(async (username: string, email: string, pass: string): Promise<{ success: boolean; message: string }> => {
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
       const result = await apiSendOtp(trimmedUsername, email, pass);
       return { success: true, message: result.message };
    } catch (error) {
       const message = error instanceof Error ? error.message : 'An unknown error occurred.';
       return { success: false, message };
    }
  }, []);

  const verifyAndSignup = useCallback(async (username: string, otp: string, pass: string): Promise<{ success: boolean; message: string }> => {
    try {
        await apiSignup(username, otp);
        addToast('Account created successfully! Logging you in...', 'success');
        const loginSuccess = await login(username, pass);
        if (loginSuccess) {
            return { success: true, message: 'Signup and login successful!' };
        } else {
            return { success: false, message: 'Account created, but auto-login failed. Please log in manually.' };
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message };
    }
  }, [addToast, login]);


  const logout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    addToast("You've been logged out.", 'info');
  }, [addToast]);
  
  const updateProfileDetails = useCallback(async (details: UpdateDetailsPayload): Promise<boolean> => {
    if (!currentUser) {
      addToast('You must be logged in to update your profile.', 'error');
      return false;
    }
    
    // Separate avatar from other details that go to the backend
    const { customAvatar, ...otherDetails } = details;
    
    try {
      // 1. Update non-avatar details on the backend
      const updatedUserFromApi = await apiUpdateUserProfile(otherDetails);
      
      // 2. Prepare the full updated user object for local state
      let finalUpdatedUser = { ...updatedUserFromApi, customAvatar: currentUser.customAvatar };

      // 3. Handle avatar update in localStorage
      if (customAvatar !== undefined) {
          const avatarStorageKey = `cineStreamAvatar_${currentUser._id}`;
          if (customAvatar === null) { // Signal to reset
              localStorage.removeItem(avatarStorageKey);
              finalUpdatedUser.customAvatar = null;
          } else {
              localStorage.setItem(avatarStorageKey, customAvatar);
              finalUpdatedUser.customAvatar = customAvatar;
          }
      }

      // 4. Update state and sessionStorage
      setCurrentUser(finalUpdatedUser);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(finalUpdatedUser));
      
      addToast('Profile updated successfully!', 'success');
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred.';
      addToast(`Failed to update profile: ${message}`, 'error');
      return false;
    }
  }, [currentUser, addToast]);


  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.username === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isAdmin, login, sendOtp, verifyAndSignup, logout, updateProfileDetails }}>
      {children}
    </AuthContext.Provider>
  );
};