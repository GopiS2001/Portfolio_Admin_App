import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRef, useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { clearCache } from './store';
import {
  http,
  ApiError,
  setToken,
  endpoints,
  setServerUrl,
  getServerUrl,
  DEFAULT_SERVER_URL,
  setRefreshHandler,
  setUnauthorizedHandler,
} from './api';

// ----------------------------------------------------------------------
// Session: a 15-minute access token kept in memory, and a 7-day refresh token kept in the
// device's secure storage (Keychain / Keystore). Reopening the app exchanges the refresh
// token for a new access token, so you stay signed in. You're sent back to sign-in only when
// the refresh token expires, the session is revoked (e.g. from the dashboard), or you sign out.

const REFRESH_KEY = 'refreshToken';
/** Pre-session builds stored a long-lived access token here — removed on launch. */
const LEGACY_TOKEN_KEY = 'accessToken';
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

type TokenResponse = {
  accessToken: string;
  accessTokenExpiresAt: number;
  /** Null when the server didn't rotate (the stored token is still current). */
  refreshToken: string | null;
  user: User;
};

export type SessionEndReason = 'expired' | 'revoked' | null;

type AuthContextValue = {
  user: User | null;
  /** True until the saved session has been checked. */
  loading: boolean;
  serverUrl: string;
  /** Why the last session ended on its own (shown on the sign-in screen). */
  endReason: SessionEndReason;
  signIn: (email: string, password: string, serverUrl: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverUrl, setServerUrlState] = useState(DEFAULT_SERVER_URL);
  const [endReason, setEndReason] = useState<SessionEndReason>(null);
  const inflight = useRef<Promise<boolean> | null>(null);

  /** Forget the session on this device (server-side revoke happens in signOut). */
  const clearLocal = useCallback(async (reason: SessionEndReason) => {
    setToken(null);
    setUser(null);
    setEndReason(reason);
    clearCache();
    await storage.remove(REFRESH_KEY);
  }, []);

  const applyTokens = useCallback(async (res: TokenResponse) => {
    setToken(res.accessToken, res.accessTokenExpiresAt);
    if (res.refreshToken) await storage.set(REFRESH_KEY, res.refreshToken);
    setUser(res.user);
  }, []);

  /**
   * New access token from the stored refresh token (one request at a time).
   * false = the session is over (expired / revoked) and has been cleared;
   * throws on network errors so an unreachable API never signs you out.
   */
  const refresh = useCallback(() => {
    if (!inflight.current) {
      inflight.current = (async () => {
        const stored = await storage.get(REFRESH_KEY);
        if (!stored) return false;
        try {
          await applyTokens(await http.post<TokenResponse>(endpoints.refresh, { refreshToken: stored }));
          return true;
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            await clearLocal(error.code === 'SESSION_REVOKED' ? 'revoked' : 'expired');
            return false;
          }
          throw error;
        }
      })().finally(() => {
        inflight.current = null;
      });
    }
    return inflight.current;
  }, [applyTokens, clearLocal]);

  const signOut = useCallback(async () => {
    const stored = await storage.get(REFRESH_KEY);
    try {
      if (stored) await http.post(endpoints.signOut, { refreshToken: stored });
    } catch {
      // Unreachable API: still sign out on this device
    }
    await clearLocal(null);
  }, [clearLocal]);

  const refreshUser = useCallback(async () => {
    const res = await http.get<{ user: User }>(endpoints.me);
    setUser(res.user);
  }, []);

  // Restore the saved server + session on launch
  useEffect(() => {
    setRefreshHandler(refresh);
    setUnauthorizedHandler(() => {
      clearLocal('expired');
    });
    (async () => {
      try {
        await storage.remove(LEGACY_TOKEN_KEY);
        const savedServer = await storage.get(SERVER_KEY);
        if (savedServer) {
          setServerUrl(savedServer);
          setServerUrlState(getServerUrl());
        }
        await refresh();
      } catch {
        // API offline: show sign-in but keep the refresh token for the next launch
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      setRefreshHandler(null);
      setUnauthorizedHandler(null);
    };
  }, [refresh, clearLocal]);

  const signIn = useCallback(
    async (email: string, password: string, server: string) => {
      setServerUrl(server);
      setServerUrlState(getServerUrl());
      // Only remember a server you typed in. The detected one follows your computer's IP,
      // so saving it would pin an old address after the IP changes.
      if (getServerUrl() === DEFAULT_SERVER_URL) await storage.remove(SERVER_KEY);
      else await storage.set(SERVER_KEY, getServerUrl());

      const res = await http.post<TokenResponse>(endpoints.signIn, {
        email: email.trim(),
        password,
        client: 'native',
      });
      if (!res.accessToken || !res.refreshToken) throw new Error('Sign-in response is missing tokens');
      setEndReason(null);
      await applyTokens(res);
    },
    [applyTokens]
  );

  const value = useMemo(
    () => ({ user, loading, serverUrl, endReason, signIn, signOut, refreshUser }),
    [user, loading, serverUrl, endReason, signIn, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
