import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { storage } from './storage';

// ----------------------------------------------------------------------
// App-only preferences kept on this device: text size for the whole app, light/dark mode and
// the design style (neumorphism, glassmorphism, …).

export type ThemePreference = 'system' | 'light' | 'dark';

export const DESIGN_STYLES = ['neumorphism', 'glassmorphism', 'claymorphism', 'skeuomorphism', 'zephyr'] as const;
export type DesignStyle = (typeof DESIGN_STYLES)[number];

export const FONT_SIZE_MIN = 8;
export const FONT_SIZE_MAX = 16;
/** The size the app was designed at — scale 1. */
export const FONT_SIZE_DEFAULT = 14;

const FONT_KEY = 'pref.fontSize';
const THEME_KEY = 'pref.theme';
const STYLE_KEY = 'pref.designStyle';

type PreferencesValue = {
  /** False until the saved preferences have been read. */
  ready: boolean;
  fontSize: number;
  /** fontSize / FONT_SIZE_DEFAULT — multiply design sizes by this. */
  fontScale: number;
  themePreference: ThemePreference;
  designStyle: DesignStyle;
  setFontSize: (size: number) => void;
  setThemePreference: (pref: ThemePreference) => void;
  setDesignStyle: (style: DesignStyle) => void;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

const clampSize = (n: number) => Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(n)));

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [fontSize, setFontSizeState] = useState(FONT_SIZE_DEFAULT);
  const [themePreference, setThemeState] = useState<ThemePreference>('system');
  const [designStyle, setStyleState] = useState<DesignStyle>('neumorphism');

  useEffect(() => {
    Promise.all([storage.get(FONT_KEY), storage.get(THEME_KEY), storage.get(STYLE_KEY)])
      .then(([size, theme, style]) => {
        if (size && !Number.isNaN(Number(size))) setFontSizeState(clampSize(Number(size)));
        if (theme === 'light' || theme === 'dark' || theme === 'system') setThemeState(theme);
        if (DESIGN_STYLES.includes(style as DesignStyle)) setStyleState(style as DesignStyle);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const setFontSize = useCallback((size: number) => {
    const next = clampSize(size);
    setFontSizeState(next);
    storage.set(FONT_KEY, String(next)).catch(() => undefined);
  }, []);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemeState(pref);
    storage.set(THEME_KEY, pref).catch(() => undefined);
  }, []);

  const setDesignStyle = useCallback((style: DesignStyle) => {
    setStyleState(style);
    storage.set(STYLE_KEY, style).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      fontSize,
      fontScale: fontSize / FONT_SIZE_DEFAULT,
      themePreference,
      designStyle,
      setFontSize,
      setThemePreference,
      setDesignStyle,
    }),
    [ready, fontSize, themePreference, designStyle, setFontSize, setThemePreference, setDesignStyle]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}
