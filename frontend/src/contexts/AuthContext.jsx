"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export const AuthContext = createContext();

const TOKEN_KEY = 'smartparking_token';
const USER_KEY = 'smartparking_auth';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(USER_KEY);
    if (token && stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const data = await api.post('/api/auth/login', { email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      const user = { id: data.user_id, email };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setCurrentUser(user);
      // fetch full profile in background to get name/phone
      api.get('/api/auth/me').then(profile => {
        const full = { id: data.user_id, name: profile.name, email: profile.email, phone: profile.phone };
        localStorage.setItem(USER_KEY, JSON.stringify(full));
        setCurrentUser(full);
      }).catch(() => {});
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const register = useCallback(async (formData) => {
    const { name, email, phone, password } = formData;
    try {
      const data = await api.post('/api/auth/register', { name, email, phone, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      const user = { id: data.user_id, name, email, phone };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setCurrentUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      isLoading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
