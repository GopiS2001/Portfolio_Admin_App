import type { MD3Theme } from 'react-native-paper';
import type { Theme as NavigationTheme } from 'expo-router';

import { useTheme, MD3DarkTheme, configureFonts, MD3LightTheme } from 'react-native-paper';

// ----------------------------------------------------------------------
// Material 3 theme for React Native Paper: deep emerald brand (a richer take on the
// dashboard's green), Plus Jakarta Sans, light + dark. Every screen reads colours from here.

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

// ---------------------------------------------------------------------- themes

export type AppTheme = MD3Theme & {
  custom: {
    tones: Record<Tone, ToneColors>;
    /** Hero / login header gradient. */
    gradient: [string, string, string];
    /** Soft panel behind previews and empty states. */
    neutral: string;
    divider: string;
    cardShadow: string;
  };
};

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
    background: '#F5F7F8',
    onBackground: '#1C252E',
    surface: '#FFFFFF',
    onSurface: '#1C252E',
    surfaceVariant: '#EEF2F4',
    onSurfaceVariant: '#637381',
    outline: '#C4CDD5',
    outlineVariant: '#E5E9EC',
    error: '#D92D20',
    errorContainer: '#FFE4DE',
    onErrorContainer: '#7A0916',
    inverseSurface: '#1C252E',
    inverseOnSurface: '#F5F7F8',
    inversePrimary: '#5BE49B',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
  custom: {
    tones: buildTones(false),
    gradient: ['#003A3D', '#006B5C', '#00A76F'],
    neutral: '#F2F5F6',
    divider: 'rgba(145, 158, 171, 0.22)',
    cardShadow: '#5A6B7B',
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
    background: '#0B1014',
    onBackground: '#EEF2F4',
    surface: '#141B21',
    onSurface: '#EEF2F4',
    surfaceVariant: '#1C252D',
    onSurfaceVariant: '#9AA8B5',
    outline: '#3A4753',
    outlineVariant: '#25303A',
    error: '#FF8A73',
    errorContainer: '#5C1A10',
    onErrorContainer: '#FFDAD2',
    inverseSurface: '#EEF2F4',
    inverseOnSurface: '#141B21',
    inversePrimary: '#007867',
    elevation: {
      level0: 'transparent',
      level1: '#141B21',
      level2: '#172028',
      level3: '#1A242D',
      level4: '#1C2630',
      level5: '#1F2A34',
    },
  },
  custom: {
    tones: buildTones(true),
    gradient: ['#021F21', '#004B44', '#007867'],
    neutral: '#182128',
    divider: 'rgba(145, 158, 171, 0.16)',
    cardShadow: '#000000',
  },
};

export const useAppTheme = () => useTheme<AppTheme>();

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
