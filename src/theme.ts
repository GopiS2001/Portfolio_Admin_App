import type { MD3Theme } from 'react-native-paper';
import type { Theme as NavigationTheme } from 'expo-router';
import type { DesignStyle } from '@/lib/preferences';

import { useTheme, MD3DarkTheme, configureFonts, MD3LightTheme } from 'react-native-paper';

// ----------------------------------------------------------------------
// Material 3 theme for React Native Paper: emerald brand, Plus Jakarta Sans, light + dark, in one
// of five design styles (neumorphism, glassmorphism, claymorphism, skeuomorphism, zephyr). Surfaces get
// their look from `neu`, which draws the active style. Every screen reads colours from here.

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

// ---------------------------------------------------------------------- design styles

/** Surface recipe for one design style in one mode — every raised / inset view is drawn from it. */
export type Palette = {
  /** Page colour (solid; glass also paints `backdrop` over it). */
  background: string;
  /** Raised surface fill. */
  fill: string;
  /** Pressed-in (inset) fill. */
  well: string;
  /** Opaque surface for things that float over content (tab bar, toast, save bar). */
  solid: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  divider: string;
  /** Highlight (light source, top-left / top edge). */
  light: string;
  /** Shade (bottom-right / drop shadow). */
  dark: string;
  /** Edge lines, for styles that draw them. */
  border?: string;
  wellBorder?: string;
  /** Three-stop page gradient (glass needs something colourful behind it). */
  backdrop?: readonly [string, string, string];
};

export const PALETTES: Record<DesignStyle, { light: Palette; dark: Palette }> = {
  // Same colour everywhere; depth from paired highlight + shade
  neumorphism: {
    light: {
      background: '#E4E9F0',
      fill: '#E4E9F0',
      well: '#E4E9F0',
      solid: '#E4E9F0',
      onSurface: '#253040',
      onSurfaceVariant: '#64748B',
      outline: '#BFC9D4',
      divider: 'rgba(145, 158, 171, 0.28)',
      light: 'rgba(255, 255, 255, 0.95)',
      dark: 'rgba(148, 163, 186, 0.6)',
    },
    dark: {
      background: '#232A32',
      fill: '#232A32',
      well: '#232A32',
      solid: '#232A32',
      onSurface: '#E6EBF0',
      onSurfaceVariant: '#9AA8B5',
      outline: '#3E4955',
      divider: 'rgba(0, 0, 0, 0.35)',
      light: 'rgba(255, 255, 255, 0.055)',
      dark: 'rgba(0, 0, 0, 0.5)',
    },
  },
  // Frosted translucent panes with a bright rim over a colourful gradient
  glassmorphism: {
    light: {
      background: '#C9D6FF',
      fill: 'rgba(255, 255, 255, 0.3)',
      well: 'rgba(255, 255, 255, 0.2)',
      solid: 'rgba(238, 243, 255, 0.94)',
      onSurface: '#1E2433',
      onSurfaceVariant: '#4A5468',
      outline: 'rgba(255, 255, 255, 0.7)',
      divider: 'rgba(255, 255, 255, 0.6)',
      light: 'rgba(255, 255, 255, 0.75)',
      dark: 'rgba(31, 38, 135, 0.16)',
      border: 'rgba(255, 255, 255, 0.7)',
      wellBorder: 'rgba(255, 255, 255, 0.45)',
      backdrop: ['#A1C4FD', '#C2E9FB', '#FBC2EB'],
    },
    dark: {
      background: '#1B1640',
      fill: 'rgba(255, 255, 255, 0.06)',
      well: 'rgba(0, 0, 0, 0.22)',
      solid: 'rgba(30, 26, 68, 0.94)',
      onSurface: '#F1F3FF',
      onSurfaceVariant: '#B9BEDB',
      outline: 'rgba(255, 255, 255, 0.25)',
      divider: 'rgba(255, 255, 255, 0.12)',
      light: 'rgba(255, 255, 255, 0.14)',
      dark: 'rgba(0, 0, 0, 0.35)',
      border: 'rgba(255, 255, 255, 0.18)',
      wellBorder: 'rgba(255, 255, 255, 0.08)',
      backdrop: ['#0B1026', '#3A1C71', '#0E5E6F'],
    },
  },
  // Puffy pastel clay: soft drop shadow plus inner highlight and inner shade
  claymorphism: {
    light: {
      background: '#EFE9F7',
      fill: '#FAF7FE',
      well: '#E6DEF2',
      solid: '#FAF7FE',
      onSurface: '#2E2640',
      onSurfaceVariant: '#6E6585',
      outline: '#D6CCE6',
      divider: 'rgba(110, 101, 133, 0.18)',
      light: 'rgba(255, 255, 255, 0.95)',
      dark: 'rgba(120, 96, 170, 0.28)',
    },
    dark: {
      background: '#211C2E',
      fill: '#30293F',
      well: '#1A1625',
      solid: '#30293F',
      onSurface: '#EEE8FA',
      onSurfaceVariant: '#A79EBF',
      outline: '#463D5C',
      divider: 'rgba(0, 0, 0, 0.3)',
      light: 'rgba(255, 255, 255, 0.1)',
      dark: 'rgba(0, 0, 0, 0.55)',
    },
  },
  // Tactile real-world objects: paper / leather tones, crisp edges, top sheen, drop shadows
  skeuomorphism: {
    light: {
      background: '#D9D4CA',
      fill: '#F4F1EA',
      well: '#E4DFD4',
      solid: '#F4F1EA',
      onSurface: '#2B2620',
      onSurfaceVariant: '#6B6255',
      outline: '#B5AC9C',
      divider: 'rgba(80, 66, 46, 0.25)',
      light: 'rgba(255, 255, 255, 0.95)',
      dark: 'rgba(40, 30, 15, 0.35)',
      border: 'rgba(60, 48, 30, 0.3)',
      wellBorder: 'rgba(60, 48, 30, 0.32)',
    },
    dark: {
      background: '#1E1D1B',
      fill: '#3A3834',
      well: '#252421',
      solid: '#3A3834',
      onSurface: '#EDE8DF',
      onSurfaceVariant: '#A8A196',
      outline: '#57534B',
      divider: 'rgba(0, 0, 0, 0.5)',
      light: 'rgba(255, 255, 255, 0.12)',
      dark: 'rgba(0, 0, 0, 0.7)',
      border: 'rgba(0, 0, 0, 0.65)',
      wellBorder: 'rgba(0, 0, 0, 0.6)',
    },
  },
  // Sage haze lit by a warm lamp glow: hairline-rimmed translucent panes, soft long shadows
  zephyr: {
    light: {
      background: '#D6DBD0',
      fill: 'rgba(255, 255, 255, 0.28)',
      well: 'rgba(28, 33, 28, 0.06)',
      solid: 'rgba(226, 230, 220, 0.96)',
      onSurface: '#1C211C',
      onSurfaceVariant: '#566052',
      outline: 'rgba(28, 33, 28, 0.18)',
      divider: 'rgba(28, 33, 28, 0.12)',
      light: 'rgba(255, 255, 255, 0.5)',
      dark: 'rgba(38, 48, 36, 0.3)',
      border: 'rgba(255, 255, 255, 0.55)',
      wellBorder: 'rgba(28, 33, 28, 0.1)',
      backdrop: ['#C3CBBE', '#DDE1D7', '#EAD9B8'],
    },
    dark: {
      background: '#151916',
      fill: 'rgba(255, 255, 255, 0.045)',
      well: 'rgba(0, 0, 0, 0.22)',
      solid: 'rgba(27, 32, 28, 0.96)',
      onSurface: '#ECEEE7',
      onSurfaceVariant: '#A2AB9E',
      outline: 'rgba(255, 255, 255, 0.16)',
      divider: 'rgba(255, 255, 255, 0.09)',
      light: 'rgba(255, 255, 255, 0.07)',
      dark: 'rgba(0, 0, 0, 0.6)',
      border: 'rgba(255, 255, 255, 0.12)',
      wellBorder: 'rgba(255, 255, 255, 0.06)',
      backdrop: ['#1E241F', '#141815', '#2A2418'],
    },
  },
};

/** Shadow recipe per style. `d` is the depth in px. */
const SHADOWS: Record<DesignStyle, (p: Palette, kind: 'raised' | 'inset', d: number) => string> = {
  neumorphism: (p, kind, d) => {
    const pre = kind === 'inset' ? 'inset ' : '';
    return `${pre}${d}px ${d}px ${d * 2}px ${p.dark}, ${pre}${-d}px ${-d}px ${d * 2}px ${p.light}`;
  },
  glassmorphism: (p, kind, d) =>
    kind === 'raised'
      ? `0px ${d}px ${d * 3}px ${p.dark}, inset 0px 1px 0px ${p.light}`
      : `inset 0px ${Math.ceil(d / 2)}px ${d * 1.5}px ${p.dark}`,
  claymorphism: (p, kind, d) => {
    const i = Math.max(2, Math.round(d * 0.6));
    return kind === 'raised'
      ? `${d}px ${Math.round(d * 1.5)}px ${d * 3}px ${p.dark}, inset ${-i}px ${-i}px ${i * 2}px ${p.dark}, inset ${i}px ${i}px ${i * 2}px ${p.light}`
      : `inset ${i}px ${i}px ${i * 2}px ${p.dark}, inset ${-i}px ${-i}px ${i * 2}px ${p.light}`;
  },
  skeuomorphism: (p, kind, d) => {
    const y = Math.max(1, Math.round(d / 3));
    return kind === 'raised'
      ? `inset 0px 1px 0px ${p.light}, inset 0px -2px 0px rgba(0, 0, 0, 0.07), 0px ${y}px ${Math.round(d * 0.8)}px ${p.dark}, 0px 1px 1px rgba(0, 0, 0, 0.2)`
      : `inset 0px ${y + 1}px ${d}px ${p.dark}, 0px 1px 0px ${p.light}`;
  },
};

// ---------------------------------------------------------------------- themes

export type AppTheme = MD3Theme & {
  custom: {
    tones: Record<Tone, ToneColors>;
    style: DesignStyle;
    /** The active style's surface recipe. */
    surface: Palette;
    /** Soft panel behind previews and empty states. */
    neutral: string;
    divider: string;
    /** Shadow pair: highlight and shade. */
    neu: { light: string; dark: string };
  };
};

const brandLight: MD3Theme = {
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
    error: '#D92D20',
    errorContainer: '#FFE4DE',
    onErrorContainer: '#7A0916',
    inverseSurface: '#253040',
    inversePrimary: '#5BE49B',
  },
};

const brandDark: MD3Theme = {
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
    error: '#FF8A73',
    errorContainer: '#5C1A10',
    onErrorContainer: '#FFDAD2',
    inverseSurface: '#E6EBF0',
    inversePrimary: '#007867',
  },
};

/** Brand colours + the chosen design style's surfaces, in light or dark. */
export function makeTheme(dark: boolean, style: DesignStyle): AppTheme {
  const brand = dark ? brandDark : brandLight;
  const p = PALETTES[style][dark ? 'dark' : 'light'];
  return {
    ...brand,
    colors: {
      ...brand.colors,
      background: p.background,
      onBackground: p.onSurface,
      surface: p.solid,
      onSurface: p.onSurface,
      surfaceVariant: p.well,
      onSurfaceVariant: p.onSurfaceVariant,
      outline: p.outline,
      outlineVariant: p.outline,
      inverseOnSurface: p.background,
      elevation: {
        level0: 'transparent',
        level1: p.solid,
        level2: p.solid,
        level3: p.solid,
        level4: p.solid,
        level5: p.solid,
      },
    },
    custom: {
      tones: buildTones(dark),
      style,
      surface: p,
      neutral: p.well,
      divider: p.divider,
      neu: { light: p.light, dark: p.dark },
    },
  };
}

export const lightTheme = makeTheme(false, 'neumorphism');
export const darkTheme = makeTheme(true, 'neumorphism');

export const useAppTheme = () => useTheme<AppTheme>();

// ---------------------------------------------------------------------- surfaces

/**
 * Depth for a view in the active design style: `raised` lifts it off the page, `inset` presses
 * it in. `depth` scales the shadows (px). Spread it into a style; set `backgroundColor` after it
 * for a tinted surface. Glass and skeuomorphism also draw a 1px edge.
 */
export function neu(
  theme: AppTheme,
  kind: 'raised' | 'inset' = 'raised',
  depth = 6
): { backgroundColor: string; boxShadow: string; borderWidth?: number; borderColor?: string } {
  const p = theme.custom.surface;
  const edge = kind === 'raised' ? p.border : p.wellBorder;
  return {
    backgroundColor: kind === 'raised' ? p.fill : p.well,
    boxShadow: SHADOWS[theme.custom.style](p, kind, depth),
    ...(edge ? { borderWidth: 1, borderColor: edge } : null),
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
