import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { onUnauthorized, resetCsrfToken } from '../api/client';

const AuthContext = createContext(null);

/**
 * Holds the logged-in user (or null). The session itself lives in the server's HTTP session
 * cookie; this context only mirrors it so components can render accordingly.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // Restores an existing session (and picks up a CSRF token from the response header)
    refresh().finally(() => setLoading(false));
    onUnauthorized(() => setUser(null));
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const loggedIn = await authApi.login(email, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      resetCsrfToken();
      // fetch a fresh CSRF token for the next login
      await refresh();
    }
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'ADMIN', login, logout, refresh }),
    [user, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
