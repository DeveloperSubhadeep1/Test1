import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { useToast } from '../hooks/useToast';
import { apiLogin, apiSendOtp, apiSignup, apiUpdateUserProfile } from '../services/api';

const USER_STORAGE_KEY = 'cineStreamUser';

interface UpdateDetailsPayload {
    customName?: string;
    dob?: string | null;
    gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | '';
    avatar?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: string, pass: string, turnstileToken: string) => Promise<boolean>;
  sendOtp: (user: string, email: string, pass: string, turnstileToken: string) => Promise<{ success: boolean; message: string }>;
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
      const userJson = localStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        const sessionUser: UserProfile = JSON.parse(userJson);
        setCurrentUser(sessionUser);
      }
    } catch (error) {
      console.error('Failed to load user session', error);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  const login = useCallback(async (username: string, pass: string, turnstileToken: string): Promise<boolean> => {
    try {
      const userProfile = await apiLogin(username, pass, turnstileToken);
      setCurrentUser(userProfile);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
      
      addToast(`Welcome back, ${username}!`, 'success');
      return true;
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Login failed.', 'error');
      return false;
    }
  }, [addToast]);

  const sendOtp = useCallback(async (username: string, email: string, pass: string, turnstileToken: string): Promise<{ success: boolean; message: string }> => {
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
       const result = await apiSendOtp(trimmedUsername, email, pass, turnstileToken);
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
        // We don't need captcha for the auto-login step as the user has already been verified via OTP.
        const loginSuccess = await login(username, pass, 'verified_by_otp');
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
    localStorage.removeItem(USER_STORAGE_KEY);
    addToast("You've been logged out.", 'info');
  }, [addToast]);
  
  // Add a global listener to handle invalid sessions detected by the API service.
  useEffect(() => {
    const handleInvalidSession = () => {
      // Check if there's a session to prevent logging out multiple times
      // if several API calls fail at once.
      if (localStorage.getItem(USER_STORAGE_KEY)) {
        addToast("Your session has expired. Please log in again.", 'error');
        logout();
      }
    };

    window.addEventListener('invalid-session', handleInvalidSession);

    return () => {
      window.removeEventListener('invalid-session', handleInvalidSession);
    };
  }, [logout, addToast]);

  const updateProfileDetails = useCallback(async (details: UpdateDetailsPayload): Promise<boolean> => {
    if (!currentUser) {
      addToast('You must be logged in to update your profile.', 'error');
      return false;
    }
    
    try {
      // Send all details, including the new avatar ID, to the backend.
      const updatedUserFromApi = await apiUpdateUserProfile(details);

      // Update state and sessionStorage with the response from the server.
      setCurrentUser(updatedUserFromApi);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUserFromApi));
      
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