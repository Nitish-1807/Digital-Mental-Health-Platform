import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

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
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          const response = await authAPI.getProfile();
          setUser(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          clearLocalAuth();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const clearLocalAuth = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: userData } = response;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token: newToken, user: newUser } = response;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      return { success: true, user: newUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const googleLogin = async (credential) => {
    try {
      const response = await authAPI.googleLogin(credential);
      const { token: newToken, user: userData } = response;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Google Authentication failed'
      };
    }
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('token')) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Failed to invalidate session on server:', error);
    } finally {
      clearLocalAuth();
    }
  };

  // Exposed so Onboarding can update user after completing flow
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    setUser: updateUser,
    token,
    loading,
    login,
    register,
    googleLogin,
    logout,
    isAuthenticated: !!token && !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
