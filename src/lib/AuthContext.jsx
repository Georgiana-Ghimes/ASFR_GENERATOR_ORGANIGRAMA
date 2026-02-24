import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Poll user status every 10 seconds to check if account is still active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await apiClient.me();
      } catch (error) {
        // If account is disabled or unauthorized, logout
        if (error.message.includes('dezactivat') || error.message.includes('disabled')) {
          logout();
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [user]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }

      // Check if token has expired (24 hours)
      const loginTime = localStorage.getItem('login_time');
      if (loginTime) {
        const elapsed = Date.now() - parseInt(loginTime);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (elapsed > twentyFourHours) {
          logout();
          setIsLoadingAuth(false);
          return;
        }
      }

      const userData = await apiClient.me();
      setUser(userData);
      setAuthError(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthError({ type: 'auth_required' });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('login_time');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password, turnstileToken) => {
    try {
      await apiClient.login(email, password, turnstileToken);
      // Save login timestamp
      localStorage.setItem('login_time', Date.now().toString());
      await checkAuth();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    apiClient.setToken(null);
    localStorage.removeItem('login_time');
    setUser(null);
    window.location.href = '/login';
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        login,
        logout,
        navigateToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
