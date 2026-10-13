import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

import { http, endpoints } from './api';

// ----------------------------------------------------------------------
// A tiny SWR-style cache: every screen reading the same URL shares one copy,
// and a save refreshes every screen that shows it (plus the dashboard counts).

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();
const inflight = new Map<string, Promise<unknown>>();

function notify(url: string) {
  listeners.get(url)?.forEach((l) => l());
}

function subscribe(url: string, listener: () => void) {
  if (!listeners.has(url)) listeners.set(url, new Set());
  listeners.get(url)!.add(listener);
  return () => {
    listeners.get(url)?.delete(listener);
  };
}

export function setCache<T>(url: string, data: T) {
  cache.set(url, data);
  notify(url);
}

export function revalidate<T>(url: string): Promise<T> {
  if (!inflight.has(url)) {
    const p = http
      .get<T>(url)
      .then((data) => {
        setCache(url, data);
        return data;
      })
      .finally(() => inflight.delete(url));
    inflight.set(url, p);
  }
  return inflight.get(url) as Promise<T>;
}

export function clearCache() {
  cache.clear();
  listeners.forEach((_, url) => notify(url));
}

/** GET a resource and keep it in the shared cache. */
export function useResource<T>(url: string) {
  const data = useSyncExternalStore(
    useCallback((l) => subscribe(url, l), [url]),
    () => cache.get(url) as T | undefined
  );
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await revalidate(url);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setRefreshing(false);
    }
  }, [url]);

  useEffect(() => {
    if (cache.has(url)) return;
    revalidate(url).then(
      () => setError(null),
      (e) => setError(e as Error)
    );
  }, [url]);

  return { data, error, isLoading: data === undefined && !error, refreshing, refresh };
}

// ---------------------------------------------------------------------- mutations

/** Anything that changes website content also changes the dashboard counts. */
const touch = (url: string) =>
  Promise.all([revalidate(url), revalidate(endpoints.summary)]).catch(() => undefined);

export async function createItem<T>(url: string, body: Partial<T>) {
  const res = await http.post<T>(url, body);
  await touch(url);
  return res;
}

export async function updateItem<T>(url: string, id: number | string, body: Partial<T>) {
  const res = await http.put<T>(`${url}/${id}`, body);
  await touch(url);
  return res;
}

export async function deleteItem(url: string, id: number | string) {
  await http.delete(`${url}/${id}`);
  await touch(url);
}

export async function reorderItems<T>(url: string, ids: number[]) {
  setCache(url, await http.patch<T[]>(`${url}/reorder`, { ids }));
}

/** PUT a singleton (profile, settings). */
export async function saveSingleton<T>(url: string, body: Partial<T>) {
  const res = await http.put<T>(url, body);
  setCache(url, res);
  return res;
}
