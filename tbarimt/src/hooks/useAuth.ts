import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/api';
import { STORAGE_KEYS } from '@/constants';
import type { User } from '@/types';

interface UseAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isJournalist: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TOKEN) : null;
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await getCurrentUser();
      if (response.user) {
        setUser(response.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Try to load user from localStorage first
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // Invalid JSON, ignore
        }
      }
    }

    loadUser();
  }, []);

  const refreshUser = async () => {
    await loadUser();
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    isJournalist: user?.role === 'journalist',
    isAdmin: user?.role === 'admin',
    refreshUser,
    logout,
  };
}

