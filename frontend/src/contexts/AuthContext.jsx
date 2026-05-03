"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

// Pre-seeded test accounts for development
const TEST_ACCOUNTS = [
  {
    id: 'user-001',
    name: 'Test User',
    email: 'test@example.com',
    phone: '0412345678',
    licensePlate: '1ABC123',
    password: '123456',
  },
];

const LOCAL_STORAGE_KEY = 'smartparking_auth';
const USERS_STORAGE_KEY = 'smartparking_users';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until we check localStorage

  // On mount, restore user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // corrupted data — clear it
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  // Helper: get all registered users (test accounts + any registered users)
  const getAllUsers = useCallback(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      const registeredUsers = stored ? JSON.parse(stored) : [];
      return [...TEST_ACCOUNTS, ...registeredUsers];
    } catch {
      return [...TEST_ACCOUNTS];
    }
  }, []);

  // Helper: persist user session
  const persistUser = useCallback((user) => {
    // Store user without password
    const { password, ...safeUser } = user;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeUser));
    setCurrentUser(safeUser);
  }, []);

  /**
   * Login with email and password.
   * Returns { success, error?, user? }
   */
  const login = useCallback((email, password) => {
    const users = getAllUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    persistUser(user);
    return { success: true, user: currentUser };
  }, [getAllUsers, persistUser, currentUser]);

  /**
   * Register a new user.
   * Returns { success, error?, user? }
   */
  const register = useCallback((formData) => {
    const { name, email, phone, licensePlate, password } = formData;
    const users = getAllUsers();

    // Check for duplicate email
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
      licensePlate,
      password,
    };

    // Save to registered users list
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      const registeredUsers = stored ? JSON.parse(stored) : [];
      registeredUsers.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(registeredUsers));
    } catch {
      return { success: false, error: 'Failed to save account data' };
    }

    persistUser(newUser);
    return { success: true, user: currentUser };
  }, [getAllUsers, persistUser, currentUser]);

  /**
   * Log out the current user.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
