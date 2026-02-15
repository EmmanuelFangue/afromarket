'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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

  useEffect(() => {
    restoreSession();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  async function restoreSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }

      const tokens: AuthTokens = JSON.parse(stored);

      if (Date.now() >= tokens.expiresAt) {
        try {
          const newTokens = await authApi.refreshAccessToken(tokens.refreshToken);
          saveTokens(newTokens);
          const refreshedUser = parseUserFromToken(newTokens.accessToken);
          setUser(refreshedUser);
          scheduleTokenRefresh(newTokens.expiresAt);
        } catch (error) {
          console.error('Token refresh failed:', error);
          clearSession();
        }
      } else {
        const restoredUser = parseUserFromToken(tokens.accessToken);
        setUser(restoredUser);
        scheduleTokenRefresh(tokens.expiresAt);
      }
    } catch (error) {
      console.error('Session restoration failed:', error);
      clearSession();
    } finally {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
  }

  function parseUserFromToken(accessToken: string): User {
    const { decodeJwt } = require('jose');
    const decoded = decodeJwt(accessToken);

    return {
      id: decoded.sub as string,
      email: (decoded.email as string) || '',
      name: (decoded.name as string) || (decoded.preferred_username as string),
      roles: (decoded.realm_access as any)?.roles || []
    };
  }

  async function handleLogin(email: string, password: string) {
    const { tokens, user: loggedInUser } = await authApi.login({ email, password });
    saveTokens(tokens);
    setUser(loggedInUser);
    scheduleTokenRefresh(tokens.expiresAt);
  }

  async function handleLogout() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const tokens: AuthTokens = JSON.parse(stored);
        await authApi.logout(tokens.refreshToken);
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
