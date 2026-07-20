import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  fetchAuthSession,
  loginWithPassword,
  logoutSession,
  setCsrfToken,
} from '../utils/api';
import { AuthContext } from './auth-context-value';
import type { AuthContextValue } from './auth-context-value';
const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === 'true';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(!STATIC_MODE);
  const [authenticated, setAuthenticated] = useState(STATIC_MODE);
  const [username, setUsername] = useState<string | null>(null);

  const markSignedOut = useCallback(() => {
    setCsrfToken(null);
    setAuthenticated(false);
    setUsername(null);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (STATIC_MODE) return;
    let cancelled = false;

    void fetchAuthSession()
      .then((session) => {
        if (cancelled) return;
        setAuthenticated(session.authenticated);
        setUsername(session.username ?? null);
      })
      .catch(() => {
        if (!cancelled) markSignedOut();
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    const handleExpired = () => markSignedOut();
    window.addEventListener('hx-auth-expired', handleExpired);
    return () => {
      cancelled = true;
      window.removeEventListener('hx-auth-expired', handleExpired);
    };
  }, [markSignedOut]);

  const login = useCallback(async (nextUsername: string, password: string) => {
    const session = await loginWithPassword(nextUsername, password);
    setAuthenticated(session.authenticated);
    setUsername(session.username ?? nextUsername);
    setChecking(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } finally {
      markSignedOut();
    }
  }, [markSignedOut]);

  const value = useMemo<AuthContextValue>(() => ({
    checking,
    authenticated,
    username,
    login,
    logout,
  }), [authenticated, checking, login, logout, username]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
