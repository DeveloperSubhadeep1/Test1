
import React, { createContext, useState, ReactNode, useEffect } from 'react';

const AUTH_STORAGE_KEY = 'cineStreamAdminAuth';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize state from localStorage to persist login across sessions
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      return storedAuth ? JSON.parse(storedAuth) : false;
    } catch {
      // If parsing fails, default to logged out state
      return false;
    }
  });

  // Effect to update localStorage whenever the authentication state changes
  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(isAuthenticated));
    } catch (error) {
      console.error("Failed to save auth state to localStorage", error);
    }
  }, [isAuthenticated]);

  // This is a mock login. In a real app, this would involve an API call.
  // Using simple hardcoded credentials for demonstration.
  const login = (user: string, pass:string): boolean => {
    if (user === 'admin' && pass === 'password') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
