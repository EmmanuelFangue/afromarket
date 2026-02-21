'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { decodeJwt } from 'jose';
import { User, AuthTokens, RegisterData } from '../lib/auth-types';
import * as authApi from '../lib/auth-api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'afromarket_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef(false);

  // Single safety timeout that only runs once
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      console.warn('[AuthProvider] Safety timeout - forcing isLoading to false');
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(safetyTimeout);
  }, []); // Empty deps - only run once

  // Restore session on mount
  useEffect(() => {
    if (!hasRestoredRef.current) {
      hasRestoredRef.current = true;
      restoreSession();
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  async function restoreSession() {
    console.log('[AuthContext] Starting session restoration...');
    try {
      if (typeof window === 'undefined') {
        console.log('[AuthContext] Server-side render, skipping restore');
        setIsLoading(false);
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        console.log('[AuthContext] No stored session found');
        setIsLoading(false);
        return;
      }

      const tokens: AuthTokens = JSON.parse(stored);
      console.log('[AuthContext] Found stored tokens, expires at:', new Date(tokens.expiresAt).toISOString());

      if (Date.now() >= tokens.expiresAt) {
        console.log('[AuthContext] Token expired, attempting refresh...');
        try {
          const newTokens = await authApi.refreshAccessToken(tokens.refreshToken);
          console.log('[AuthContext] Token refresh successful');
          saveTokens(newTokens);
          const refreshedUser = parseUserFromToken(newTokens.accessToken);
          setUser(refreshedUser);
          scheduleTokenRefresh(newTokens.expiresAt);
        } catch (error) {
          console.error('[AuthContext] Token refresh failed, clearing session:', error);
          clearSession();
          setUser(null);
        }
      } else {
        console.log('[AuthContext] Token still valid, restoring user');
        const restoredUser = parseUserFromToken(tokens.accessToken);
        setUser(restoredUser);
        scheduleTokenRefresh(tokens.expiresAt);
      }
    } catch (error) {
      console.error('[AuthContext] Session restoration failed:', error);
      clearSession();
      setUser(null);
    } finally {
      console.log('[AuthContext] Session restoration complete, isLoading = false');
      setIsLoading(false);
    }
  }

  function scheduleTokenRefresh(expiresAt: number) {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const refreshTime = expiresAt - 60000 - Date.now();

    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          if (typeof window === 'undefined') return;

          const stored = localStorage.getItem(STORAGE_KEY);
          if (!stored) return;

          const tokens: AuthTokens = JSON.parse(stored);
          const newTokens = await authApi.refreshAccessToken(tokens.refreshToken);
          saveTokens(newTokens);

          const refreshedUser = parseUserFromToken(newTokens.accessToken);
          setUser(refreshedUser);
          scheduleTokenRefresh(newTokens.expiresAt);
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          clearSession();
          setUser(null);
        }
      }, refreshTime);
    }
  }

  function saveTokens(tokens: AuthTokens) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    }
  }

  function clearSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
  }

  function parseUserFromToken(accessToken: string): User {
    const decoded = decodeJwt(accessToken);

    return {
      id: decoded.sub as string,
      email: (decoded.email as string) || '',
      name: (decoded.name as string) || (decoded.preferred_username as string),
      roles: (decoded.realm_access as any)?.roles || []
    };
  }

  async function syncUserToBackend(accessToken: string) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_MERCHANT_API_URL || 'http://localhost:5203';
      console.log('[AuthContext] Syncing user to backend:', backendUrl);
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.ok) {
        console.log('[AuthContext] User synced to backend database');
      } else {
        console.error('[AuthContext] Sync failed with status:', response.status);
      }
    } catch (error) {
      console.error('[AuthContext] Failed to sync user to backend:', error);
      // Don't throw - operation succeeded even if sync failed
    }
  }

  async function handleLogin(email: string, password: string) {
    const { tokens, user: loggedInUser } = await authApi.login({ email, password });
    saveTokens(tokens);
    setUser(loggedInUser);
    scheduleTokenRefresh(tokens.expiresAt);

    // Sync user to backend database
    await syncUserToBackend(tokens.accessToken);
  }

  async function handleLogout() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const tokens: AuthTokens = JSON.parse(stored);
          await authApi.logout(tokens.refreshToken);
        }
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearSession();
      setUser(null);
    }
  }

  async function handleRegister(data: RegisterData) {
    await authApi.register(data);
    await handleLogin(data.email, data.password);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        register: handleRegister
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
