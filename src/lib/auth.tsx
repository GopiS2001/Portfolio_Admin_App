import * as SecureStore from 'expo-secure-store';
import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { clearCache } from './store';
import {
  http,
  setToken,
  endpoints,
  setServerUrl,
  getServerUrl,
  DEFAULT_SERVER_URL,
  setUnauthorizedHandler,
} from './api';

// ----------------------------------------------------------------------

const TOKEN_KEY = 'accessToken';
const SERVER_KEY = 'serverUrl';

/** SecureStore on the phone; localStorage in the web preview (SecureStore has no web support). */
const storage = {
  get: async (key: string) => {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  set: async (key: string, value: string) => {
    if (Platform.OS === 'web') return globalThis.localStorage?.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  remove: async (key: string) => {
    if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

export type User = { id: number; email: string; displayName: string; role?: string };

type AuthContextValue = {
  user: User | null;
  /** True until the saved session has been checked. */
  loading: boolean;
  serverUrl: string;
  signIn: (email: string, password: string, serverUrl: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverUrl, setServerUrlState] = useState(DEFAULT_SERVER_URL);

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
    clearCache();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await http.get<{ user: User }>(endpoints.me);
    setUser(res.user);
  }, []);

  // Restore the saved server + session on launch
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
    (async () => {
      try {
        const savedServer = await SecureStore.getItemAsync(SERVER_KEY);
        if (savedServer) {
          setServerUrl(savedServer);
          setServerUrlState(getServerUrl());
        }
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (saved) {
          setToken(saved);
          await refreshUser();
        }
      } catch {
        // Expired token or API offline — show the sign-in screen
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, [refreshUser, signOut]);

  const signIn = useCallback(
    async (email: string, password: string, server: string) => {
      setServerUrl(server);
      setServerUrlState(getServerUrl());
      await SecureStore.setItemAsync(SERVER_KEY, getServerUrl());

      const { accessToken } = await http.post<{ accessToken: string }>(endpoints.signIn, {
        email: email.trim(),
        password,
      });
      if (!accessToken) throw new Error('Access token not found in response');
      setToken(accessToken);
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      await refreshUser();
    },
    [refreshUser]
  );

  const value = useMemo(
    () => ({ user, loading, serverUrl, signIn, signOut, refreshUser }),
    [user, loading, serverUrl, signIn, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
