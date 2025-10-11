import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { useToast } from '../hooks/useToast';
import { apiLogin, apiSendOtp, apiSignup, apiUpdateProfile } from '../services/api';

const SESSION_STORAGE_KEY = 'cineStreamSession';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  sendOtp: (user: string, email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  verifyAndSignup: (user: string, otp: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (newProfileData: Omit<UserProfile, 'username' | '_id' | 'email'>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => false,
  sendOtp: async () => ({ success: false, message: 'OTP function not ready.' }),
  verifyAndSignup: async () => ({ success: false, message: 'Signup function not ready.' }),
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
  
  const updateProfile = useCallback(async (newProfileData: Omit<UserProfile, 'username' | '_id' | 'email'>) => {
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
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isAdmin, login, sendOtp, verifyAndSignup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};