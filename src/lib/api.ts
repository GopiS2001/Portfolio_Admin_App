import Constants from 'expo-constants';

// ----------------------------------------------------------------------

/**
 * Where the NestJS API lives (without /api).
 * 1. EXPO_PUBLIC_SERVER_URL in App/.env, if set
 * 2. otherwise port 4000 on the computer running `expo start` — the phone already reaches it
 *    over Wi-Fi, so this works in Expo Go without any setup (and follows your LAN IP when it changes).
 *    With `--tunnel` the dev server address is a public tunnel host, so use the computer's
 *    LAN IP that app.config.js read at start-up instead.
 * The sign-in screen can override it; that choice is saved on the phone.
 */
function detectServerUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_SERVER_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  const isLocal = !!devHost && (/^\d+\.\d+\.\d+\.\d+$/.test(devHost) || devHost === 'localhost');
  const lanIp = Constants.expoConfig?.extra?.lanIp as string | undefined;
  return `http://${(isLocal ? devHost : lanIp) || devHost || 'localhost'}:4000`;
}

export const DEFAULT_SERVER_URL = detectServerUrl();

let serverUrl = DEFAULT_SERVER_URL;

// Access token (15 min) lives in memory only. The refresh token is in SecureStore (see auth.tsx).
let token: string | null = null;
let tokenExpiresAt = 0;
let refresher: (() => Promise<boolean>) | null = null;
let onUnauthorized: (() => void) | null = null;

/** Refresh this long before the access token expires. */
const REFRESH_MARGIN_MS = 60_000;

export const getServerUrl = () => serverUrl;
export const setServerUrl = (url: string) => {
  serverUrl = url.trim().replace(/\/$/, '') || DEFAULT_SERVER_URL;
};
export const setToken = (value: string | null, expiresAt = 0) => {
  token = value;
  tokenExpiresAt = expiresAt;
};
/** auth.tsx registers how to get a new access token; resolves false when the session is over. */
export const setRefreshHandler = (handler: (() => Promise<boolean>) | null) => {
  refresher = handler;
};
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

/** Public website for "Open website" / "Preview": EXPO_PUBLIC_WEBSITE_URL, else port 3000 on the API host. */
export const websiteUrl = (anchor?: string) => {
  const configured = process.env.EXPO_PUBLIC_WEBSITE_URL?.replace(/\/$/, '');
  const url = new URL(serverUrl);
  const base = configured || `${url.protocol}//${url.hostname}:3000`;
  return `${base}${anchor ? `/#${anchor}` : ''}`;
};

/**
 * Uploads are stored with the API's PUBLIC_URL (http://localhost:4000 by default),
 * which on the phone means the phone itself. Point those at the API host instead.
 */
export function resolveFileUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
    return url.replace(/^https?:\/\/[^/]+/, serverUrl);
  }
  if (url.startsWith('/uploads/')) return `${serverUrl}${url}`;
  if (url.startsWith('/')) return `${websiteUrl()}${url}`;
  return url;
}

/**
 * For showing an image: also turns a Google Drive share link (which opens a web page) into
 * Drive's direct image address. The file must be shared with "Anyone with the link".
 */
const DRIVE_FILE = /^https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/;
export function resolveImageUrl(url?: string | null) {
  const resolved = resolveFileUrl(url);
  const match = resolved?.match(DRIVE_FILE);
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800` : resolved;
}

// ----------------------------------------------------------------------

export const endpoints = {
  summary: '/api/dashboard/summary',
  snapshot: '/api/site/snapshot',
  health: '/api/health',
  profile: '/api/profile',
  settings: '/api/settings',
  sections: '/api/sections',
  stats: '/api/stats',
  aboutParagraphs: '/api/about-paragraphs',
  highlights: '/api/highlights',
  skillGroups: '/api/skill-groups',
  marquee: '/api/marquee',
  experiences: '/api/experiences',
  projects: '/api/projects',
  messages: '/api/messages',
  uploads: '/api/uploads',
  account: '/api/auth/account',
  password: '/api/auth/password',
  me: '/api/auth/me',
  signIn: '/api/auth/sign-in',
  refresh: '/api/auth/refresh',
  signOut: '/api/auth/sign-out',
} as const;

// ----------------------------------------------------------------------

/** HTTP error with the status and the API's auth code (e.g. SESSION_REVOKED). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
  }
}

const isAuthCall = (path: string) =>
  path === endpoints.signIn || path === endpoints.refresh || path === endpoints.signOut;

async function request<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
  // Refresh shortly before the access token expires instead of waiting for a 401
  if (token && refresher && !isAuthCall(path) && Date.now() > tokenExpiresAt - REFRESH_MARGIN_MS) {
    await refresher().catch(() => false);
  }

  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${serverUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(isForm ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token && !isAuthCall(path) ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: isForm ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`Cannot reach the API at ${serverUrl}. Is the backend running?`);
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    // Access token expired or refused: get a new one and retry once
    if (res.status === 401 && !isAuthCall(path) && !retried && refresher) {
      const ok = await refresher().catch(() => false);
      if (ok) return request<T>(method, path, body, true);
    }
    if (res.status === 401 && !isAuthCall(path) && token) onUnauthorized?.();
    // Nest validation errors come back as an array of messages
    const raw = data?.message;
    throw new ApiError(
      (Array.isArray(raw) ? raw.join(', ') : raw) || `Request failed (${res.status})`,
      res.status,
      data?.code
    );
  }
  return data as T;
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

/** Upload a file picked on the phone. Returns its public URL. */
export async function uploadFile(file: { uri: string; name: string; mimeType?: string }) {
  const form = new FormData();
  // React Native's FormData takes { uri, name, type } for files
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  } as unknown as Blob);
  const res = await http.post<{ url: string }>(endpoints.uploads, form);
  return res.url;
}
