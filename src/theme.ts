import type { MD3Theme } from 'react-native-paper';
import type { Theme as NavigationTheme } from 'expo-router';

import { useTheme, MD3DarkTheme, configureFonts, MD3LightTheme } from 'react-native-paper';

// ----------------------------------------------------------------------
// Material 3 theme for React Native Paper in a neumorphic (soft UI) style: every surface shares
// one base colour and gets its depth from paired light/dark shadows (see `neu`). Emerald brand,
// Plus Jakarta Sans, light + dark. Every screen reads colours from here.

export const FONT = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

// The weight lives in the font file, so the style weight stays "normal" (no faux bold on Android).
const f = (fontFamily: string, fontSize: number, lineHeight: number, letterSpacing = 0) => ({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  fontWeight: 'normal' as const,
});

const fonts = configureFonts({
  config: {
    displayLarge: f(FONT.extrabold, 52, 60, -1),
    displayMedium: f(FONT.extrabold, 42, 50, -0.5),
    displaySmall: f(FONT.extrabold, 34, 42, -0.5),
    headlineLarge: f(FONT.bold, 30, 38, -0.4),
    headlineMedium: f(FONT.bold, 26, 34, -0.3),
    headlineSmall: f(FONT.bold, 22, 30, -0.2),
    titleLarge: f(FONT.bold, 20, 28, -0.1),
    titleMedium: f(FONT.semibold, 16, 24),
    titleSmall: f(FONT.semibold, 14, 20),
    labelLarge: f(FONT.semibold, 14, 20, 0.1),
    labelMedium: f(FONT.semibold, 12, 16, 0.3),
    labelSmall: f(FONT.semibold, 11, 16, 0.4),
    bodyLarge: f(FONT.regular, 16, 24),
    bodyMedium: f(FONT.regular, 14, 21),
    bodySmall: f(FONT.regular, 12, 17),
  },
});
fonts.default = { fontFamily: FONT.regular, fontWeight: 'normal', letterSpacing: 0 };

// ---------------------------------------------------------------------- semantic tones

export type Tone = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';
type ToneColors = { bg: string; fg: string; main: string };

const MAINS = {
  primary: '#00A76F',
  info: '#00B8D9',
  success: '#22C55E',
  warning: '#FFAB00',
  error: '#FF5630',
};

const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

function buildTones(dark: boolean): Record<Tone, ToneColors> {
  const text = dark
    ? { primary: '#5BE49B', info: '#61F3F3', success: '#77ED8B', warning: '#FFD666', error: '#FFAC82' }
    : { primary: '#007867', info: '#006C9C', success: '#118D57', warning: '#B76E00', error: '#B71D18' };
  const tone = (k: keyof typeof MAINS): ToneColors => ({
    main: MAINS[k],
    bg: alpha(MAINS[k], dark ? 0.18 : 0.14),
    fg: text[k],
  });
  return {
    default: {
      main: '#919EAB',
      bg: alpha('#919EAB', dark ? 0.2 : 0.16),
      fg: dark ? '#C4CDD5' : '#637381',
    },
    primary: tone('primary'),
    info: tone('info'),
    success: tone('success'),
    warning: tone('warning'),
    error: tone('error'),
  };
}

// ---------------------------------------------------------------------- gradient tiles

/** Two-stop gradients for icon tiles and feature cards (same in light and dark). */
export const TILES = {
  emerald: ['#5BE49B', '#00A76F'],
  teal: ['#4FD1C5', '#0E8C83'],
  sky: ['#7DD3FC', '#0284C7'],
  violet: ['#C4B5FD', '#7C3AED'],
  amber: ['#FCD34D', '#F59E0B'],
  rose: ['#FDA4AF', '#E11D48'],
  slate: ['#94A3B8', '#475569'],
} as const satisfies Record<string, readonly [string, string]>;

export type TileKey = keyof typeof TILES;

// ---------------------------------------------------------------------- themes

export type AppTheme = MD3Theme & {
  custom: {
    tones: Record<Tone, ToneColors>;
    /** Soft panel behind previews and empty states (the base colour). */
    neutral: string;
    divider: string;
    /** Neumorphic shadow pair: highlight (top-left) and shade (bottom-right). */
    neu: { light: string; dark: string };
  };
};

const LIGHT_BASE = '#E4E9F0';
const DARK_BASE = '#232A32';

export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  roundness: 4,
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007867',
    onPrimary: '#FFFFFF',
    primaryContainer: '#C8FAD6',
    onPrimaryContainer: '#004B50',
    secondary: '#3E5C55',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DDF3EA',
    onSecondaryContainer: '#0F2E27',
    tertiary: '#5B4FD6',
    tertiaryContainer: '#E7E3FF',
    onTertiaryContainer: '#22186E',
    background: LIGHT_BASE,
    onBackground: '#253040',
    surface: LIGHT_BASE,
    onSurface: '#253040',
    surfaceVariant: '#DAE0E8',
    onSurfaceVariant: '#64748B',
    outline: '#BFC9D4',
    outlineVariant: '#D3DAE3',
    error: '#D92D20',
    errorContainer: '#FFE4DE',
    onErrorContainer: '#7A0916',
    inverseSurface: '#253040',
    inverseOnSurface: LIGHT_BASE,
    inversePrimary: '#5BE49B',
    elevation: {
      level0: 'transparent',
      level1: LIGHT_BASE,
      level2: LIGHT_BASE,
      level3: LIGHT_BASE,
      level4: LIGHT_BASE,
      level5: LIGHT_BASE,
    },
  },
  custom: {
    tones: buildTones(false),
    neutral: LIGHT_BASE,
    divider: 'rgba(145, 158, 171, 0.28)',
    neu: { light: 'rgba(255, 255, 255, 0.95)', dark: 'rgba(148, 163, 186, 0.6)' },
  },
};

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  roundness: 4,
  fonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#5BE49B',
    onPrimary: '#00382A',
    primaryContainer: '#0B4F3E',
    onPrimaryContainer: '#C8FAD6',
    secondary: '#A9CEC2',
    onSecondary: '#11352C',
    secondaryContainer: '#22413A',
    onSecondaryContainer: '#DDF3EA',
    tertiary: '#C4BDFF',
    tertiaryContainer: '#3B3196',
    onTertiaryContainer: '#E7E3FF',
    background: DARK_BASE,
    onBackground: '#E6EBF0',
    surface: DARK_BASE,
    onSurface: '#E6EBF0',
    surfaceVariant: '#2A323B',
    onSurfaceVariant: '#9AA8B5',
    outline: '#3E4955',
    outlineVariant: '#323B45',
    error: '#FF8A73',
    errorContainer: '#5C1A10',
    onErrorContainer: '#FFDAD2',
    inverseSurface: '#E6EBF0',
    inverseOnSurface: DARK_BASE,
    inversePrimary: '#007867',
    elevation: {
      level0: 'transparent',
      level1: DARK_BASE,
      level2: DARK_BASE,
      level3: DARK_BASE,
      level4: DARK_BASE,
      level5: DARK_BASE,
    },
  },
  custom: {
    tones: buildTones(true),
    neutral: DARK_BASE,
    divider: 'rgba(0, 0, 0, 0.35)',
    neu: { light: 'rgba(255, 255, 255, 0.055)', dark: 'rgba(0, 0, 0, 0.5)' },
  },
};

export const useAppTheme = () => useTheme<AppTheme>();

// ---------------------------------------------------------------------- neumorphism

/**
 * Soft-UI depth for a view on the base colour: `raised` pushes it out of the page, `inset`
 * presses it in. `depth` is the shadow offset in px (blur is twice that). Spread it into a
 * style; set `backgroundColor` after it for a tinted surface.
 */
export function neu(theme: AppTheme, kind: 'raised' | 'inset' = 'raised', depth = 6) {
  const { light, dark } = theme.custom.neu;
  const pre = kind === 'inset' ? 'inset ' : '';
  const blur = depth * 2;
  return {
    backgroundColor: theme.colors.background,
    boxShadow: `${pre}${depth}px ${depth}px ${blur}px ${dark}, ${pre}${-depth}px ${-depth}px ${blur}px ${light}`,
  };
}

/** The theme with every text style scaled (the app's text-size preference). */
export function withFontScale(theme: AppTheme, scale: number): AppTheme {
  if (scale === 1) return theme;
  const fontsScaled = Object.fromEntries(
    Object.entries(theme.fonts).map(([variant, style]) => {
      const s = style as { fontSize?: number; lineHeight?: number };
      return [
        variant,
        s.fontSize
          ? { ...s, fontSize: Math.round(s.fontSize * scale * 10) / 10, lineHeight: s.lineHeight && Math.round(s.lineHeight * scale) }
          : s,
      ];
    })
  ) as AppTheme['fonts'];
  return { ...theme, fonts: fontsScaled };
}

/** Headers, tab bar and screen backgrounds follow the Paper theme. */
export function navigationTheme(theme: AppTheme, base: NavigationTheme): NavigationTheme {
  return {
    ...base,
    dark: theme.dark,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.custom.divider,
      notification: theme.colors.error,
    },
    fonts: {
      regular: { fontFamily: FONT.regular, fontWeight: 'normal' },
      medium: { fontFamily: FONT.semibold, fontWeight: 'normal' },
      bold: { fontFamily: FONT.bold, fontWeight: 'normal' },
      heavy: { fontFamily: FONT.extrabold, fontWeight: 'normal' },
    },
  };
}
