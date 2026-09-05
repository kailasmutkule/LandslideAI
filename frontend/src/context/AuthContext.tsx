import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, LoginCredentials } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const current = await dataService.getCurrentUser();
        setUser(current);
      } catch (err) {
        console.error('Failed to restore user auth session', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const loggedIn = await dataService.login(credentials);
      setUser(loggedIn);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('landslide_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
