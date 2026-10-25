import type { Tone, TileKey } from '@/theme';
import type { StyleProp, ViewStyle, PressableProps } from 'react-native';

import type { AppTheme } from '@/theme';

import { useRef, useState, useEffect, useContext, useCallback, createContext } from 'react';
import { View, Linking, Animated, Platform, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Icon, Dialog, Portal, ActivityIndicator } from 'react-native-paper';

import Svg, { Circle } from 'react-native-svg';
import { BlurView, BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { neu, FONT, TILES, useAppTheme } from '@/theme';
import { websiteUrl } from '@/lib/api';

// ----------------------------------------------------------------------

/** Any Material Community Icons name (https://pictogrammers.com/library/mdi/). */
export type IconName = string;

export { Icon };

// ---------------------------------------------------------------------- Screen

/** Scrollable page with pull-to-refresh and a "Preview on website" link. */
export function Screen({
  children,
  onRefresh,
  anchor,
  header,
  tab,
}: {
  children: React.ReactNode;
  onRefresh?: () => Promise<unknown> | void;
  /** Anchor on the website to open with "Preview" (e.g. "projects"). */
  anchor?: string;
  /** Large header rendered at the top of the scroll (tab screens). */
  header?: React.ReactNode;
  /** Tab screen: leaves room for the floating tab bar. */
  tab?: boolean;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <GlassScene>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.screen,
        header ? { paddingTop: 0 } : null,
        tab ? { paddingBottom: TAB_BAR_SPACE + insets.bottom } : null,
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        ) : undefined
      }
    >
      {header}
      {anchor !== undefined && (
        <Button
          variant="soft"
          size="small"
          icon="eye-outline"
          label="Preview on website"
          onPress={() => Linking.openURL(websiteUrl(anchor || undefined))}
          style={{ alignSelf: 'flex-end' }}
        />
      )}
      {children}
    </ScrollView>
    </GlassScene>
  );
}

// ---------------------------------------------------------------------- Glass (backdrop + blur)

/** The view glass panes blur on Android (expo-blur can only blur a BlurTargetView there). */
const BlurTargetContext = createContext<React.RefObject<View | null> | null>(null);

/**
 * Page wrapper: base colour, the style's backdrop and the content. In glassmorphism the
 * backdrop is the blur target that every `GlassBlur` inside frosts.
 */
export function GlassScene({ children }: { children: React.ReactNode }) {
  const theme = useAppTheme();
  const target = useRef<View | null>(null);
  return (
    <BlurTargetContext.Provider value={target}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Backdrop target={target} />
        {children}
      </View>
    </BlurTargetContext.Provider>
  );
}

/**
 * Page decoration behind the content for styles that need it — glassmorphism paints a colourful
 * gradient with two soft orbs for the panes to frost. Others: nothing.
 */
export function Backdrop({ target }: { target?: React.RefObject<View | null> }) {
  const theme = useAppTheme();
  const colors = theme.custom.surface.backdrop;
  if (!colors) return null;
  return (
    <BlurTargetView ref={target} pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, { top: -70, right: -90, backgroundColor: colors[2] }]} />
      <View style={[styles.orb, { bottom: 60, left: -110, backgroundColor: colors[0] }]} />
    </BlurTargetView>
  );
}

/**
 * Real frosted-glass blur behind a pane (glassmorphism only). Put it first inside the pane and
 * pass the pane's corner radius. iOS / web blur whatever is behind; Android blurs the screen's
 * backdrop, so outside a `GlassScene` it renders nothing there.
 */
export function GlassBlur({ radius = 0, intensity = 30 }: { radius?: number; intensity?: number }) {
  const theme = useAppTheme();
  const target = useContext(BlurTargetContext);
  if (theme.custom.style !== 'glassmorphism') return null;
  const android = Platform.OS === 'android';
  if (android && !target) return null;
  return (
    <BlurView
      pointerEvents="none"
      intensity={intensity}
      tint={theme.dark ? 'dark' : 'light'}
      {...(android && target ? { blurTarget: target, blurMethod: 'dimezisBlurViewSdk31Plus' as const } : null)}
      // BlurView ignores borderRadius without overflow hidden
      style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}
    />
  );
}

/**
 * Fill for bars floating over scrolling content (tab bar, toast, save bar). Glass on iOS / web:
 * translucent, a `GlassBlur` frosts what scrolls underneath. Android can only blur the backdrop,
 * not the content, so it keeps the near-opaque fill there.
 */
export function floatingFill(theme: AppTheme) {
  const p = theme.custom.surface;
  return theme.custom.style === 'glassmorphism' && Platform.OS !== 'android' ? p.fill : p.solid;
}

const radiusOf = (style: StyleProp<ViewStyle>) => {
  const r = StyleSheet.flatten(style)?.borderRadius;
  return typeof r === 'number' ? r : 0;
};

/** Height kept free at the bottom of tab screens for the floating tab bar. */
export const TAB_BAR_SPACE = 112;

// ---------------------------------------------------------------------- Tab header

/** Large title header for tab screens (sits inside the scroll, under the status bar). */
export function TabHeader({
  overline,
  title,
  subtitle,
  right,
}: {
  overline?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabHeader, { paddingTop: insets.top + 14 }]}>
      <View style={{ flex: 1 }}>
        {overline && (
          <Text variant="labelMedium" style={{ color: theme.colors.primary, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            {overline}
          </Text>
        )}
        <Text variant="headlineLarge" style={{ marginTop: overline ? 2 : 0 }}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

// ---------------------------------------------------------------------- Neumorphic building blocks

/** A view raised out of (or pressed into) the page. */
export function NeuView({
  kind = 'raised',
  depth = 6,
  style,
  children,
}: {
  kind?: 'raised' | 'inset';
  depth?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <View style={[neu(theme, kind, depth), style]}>
      {kind === 'raised' && <GlassBlur radius={radiusOf(style)} />}
      {children}
    </View>
  );
}

/** Raised surface that sinks in while pressed — the soft-UI touch feedback. */
export function NeuPressable({
  depth = 6,
  style,
  children,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  depth?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        neu(theme, pressed ? 'inset' : 'raised', pressed ? Math.max(2, Math.round(depth * 0.6)) : depth),
        style,
      ]}
    >
      <GlassBlur radius={radiusOf(style)} />
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------------- Tile / avatar / ring

/** Icon on a raised soft tile, tinted with the tile's colour. */
export function GradientTile({
  icon,
  tile = 'emerald',
  size = 44,
  iconSize,
}: {
  icon: IconName;
  tile?: TileKey;
  size?: number;
  iconSize?: number;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.tile, neu(theme, 'raised', Math.max(3, Math.round(size / 11))), { width: size, height: size, borderRadius: size * 0.32 }]}>
      <Icon source={icon} size={iconSize ?? size * 0.5} color={TILES[tile][1]} />
    </View>
  );
}

const AVATAR_TILES: TileKey[] = ['emerald', 'sky', 'violet', 'amber', 'rose', 'teal'];

export const initials = (name?: string) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '?';

/** Initials on a raised soft circle; the colour is stable per name. */
export function GradientAvatar({ name, size = 44, muted }: { name?: string; size?: number; muted?: boolean }) {
  const theme = useAppTheme();
  const hash = [...(name ?? '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const tile = muted ? 'slate' : AVATAR_TILES[hash % AVATAR_TILES.length];
  return (
    <View style={[styles.tile, neu(theme, 'raised', Math.max(3, Math.round(size / 11))), { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: TILES[tile][1], fontFamily: FONT.extrabold, fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
}

/** Circular progress ring on a raised disc, content in a pressed-in centre. */
export function ProgressRing({
  progress,
  size = 96,
  stroke = 9,
  color,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const theme = useAppTheme();
  const r = (size - stroke) / 2 - 4;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  const inner = size - (stroke + 8) * 2;
  return (
    <View style={[styles.tile, neu(theme, 'raised', 7), { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.custom.neu.dark} strokeOpacity={0.35} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? theme.colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.tile, neu(theme, 'inset', 4), { width: inner, height: inner, borderRadius: inner / 2 }]}>
        {children}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------- Card

/** Raised soft card with an optional header (icon tile, title, subtitle, action). */
export function Card({
  title,
  subheader,
  action,
  icon,
  children,
  padded = true,
}: {
  title?: string;
  subheader?: string;
  action?: React.ReactNode;
  icon?: IconName;
  children?: React.ReactNode;
  padded?: boolean;
}) {
  const theme = useAppTheme();
  const hasHeader = !!(title || action);

  return (
    <View style={[styles.card, neu(theme, 'raised', 7)]}>
      <GlassBlur radius={24} />
      <View style={styles.cardInner}>
        {hasHeader && (
          <View style={styles.cardHeader}>
            {icon && <IconTile icon={icon} />}
            <View style={{ flex: 1 }}>
              {title && <Text variant="titleMedium">{title}</Text>}
              {subheader && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  {subheader}
                </Text>
              )}
            </View>
            {action}
          </View>
        )}
        {hasHeader && children ? <Divider /> : null}
        {children ? <View style={padded ? styles.cardBody : undefined}>{children}</View> : null}
      </View>
    </View>
  );
}

/** Tone-coloured icon in a pressed-in well. */
export function IconTile({ icon, tone = 'primary', size = 40 }: { icon: IconName; tone?: Tone; size?: number }) {
  const theme = useAppTheme();
  const t = theme.custom.tones[tone];
  return (
    <View style={[styles.tile, neu(theme, 'inset', 3), { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Icon source={icon} size={size * 0.52} color={t.fg} />
    </View>
  );
}

/** Engraved groove: a shade line over a highlight line. */
export function Divider({ dashed, inset = 0 }: { dashed?: boolean; inset?: number }) {
  const theme = useAppTheme();
  const borderStyle = dashed ? 'dashed' : 'solid';
  return (
    <View style={{ marginLeft: inset }}>
      <View style={{ borderBottomWidth: 1, borderColor: theme.custom.divider, borderStyle }} />
      <View style={{ borderBottomWidth: 1, borderColor: theme.custom.neu.light, borderStyle }} />
    </View>
  );
}

// ---------------------------------------------------------------------- Buttons

type ButtonProps = {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  /** contained: tinted raised pill · soft/outlined: base-colour raised pill · text: flat. */
  variant?: 'contained' | 'outlined' | 'soft' | 'text';
  tone?: 'primary' | 'error' | 'default';
  size?: 'small' | 'medium';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Soft-UI button: raised at rest, pressed in while touched. */
export function Button({
  label,
  icon,
  onPress,
  variant = 'contained',
  tone = 'primary',
  size = 'medium',
  disabled,
  loading,
  style,
}: ButtonProps) {
  const theme = useAppTheme();
  const filled = variant === 'contained';
  const accent =
    tone === 'error' ? theme.colors.error : tone === 'default' ? theme.colors.onSurface : theme.colors.primary;
  const fill = tone === 'error' ? theme.custom.tones.error.main : theme.colors.primary;
  const fg = filled ? (tone === 'error' ? '#FFFFFF' : theme.colors.onPrimary) : accent;
  const small = size === 'small';
  const off = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        { height: small ? 38 : 48, paddingHorizontal: small ? 14 : 20 },
        variant === 'text'
          ? pressed && neu(theme, 'inset', 2)
          : neu(theme, pressed ? 'inset' : 'raised', pressed ? 3 : small ? 3 : 5),
        filled && { backgroundColor: fill },
        disabled && !loading && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size={16} color={fg} />
      ) : icon ? (
        <Icon source={icon} size={small ? 16 : 18} color={fg} />
      ) : null}
      <Text
        numberOfLines={1}
        style={{ color: fg, fontFamily: FONT.bold, fontSize: theme.fonts.labelLarge.fontSize - (small ? 1 : 0) }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Two-to-four option picker: a pressed-in track with the chosen option raised out of it. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string; icon?: IconName }[];
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.segmented, neu(theme, 'inset', 4)]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        const color = active ? theme.colors.primary : theme.colors.onSurfaceVariant;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            style={[styles.segment, active && neu(theme, 'raised', 3)]}
          >
            {o.icon && <Icon source={o.icon} size={16} color={color} />}
            <Text numberOfLines={1} style={{ color, fontFamily: active ? FONT.bold : FONT.medium, fontSize: theme.fonts.labelLarge.fontSize }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Soft switch: pressed-in track, raised knob that turns the accent colour when on. Display only. */
export function NeuSwitch({ value, disabled, color }: { value: boolean; disabled?: boolean; color?: string }) {
  const theme = useAppTheme();
  const [anim] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [anim, value]);

  return (
    <View style={[styles.switchTrack, neu(theme, 'inset', 3), disabled && { opacity: 0.45 }]}>
      <Animated.View
        style={[
          styles.switchKnob,
          neu(theme, 'raised', 2),
          value && { backgroundColor: color ?? theme.colors.primary },
          { transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, SWITCH_TRAVEL] }) }] },
        ]}
      />
    </View>
  );
}

const SWITCH_TRAVEL = 22;

/**
 * On/off switch that changes only on a tap. Android's native switch also flips when a finger
 * drags across it, so swiping or scrolling over a list could toggle several switches at once.
 * Here the switch is display-only and the surrounding Pressable handles taps.
 */
export function TapSwitch({
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
  color,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  color?: string;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
    >
      <NeuSwitch value={value} disabled={disabled} color={color} />
    </Pressable>
  );
}

/** Round raised icon button that presses in on touch. */
export function IconButton({
  icon,
  onPress,
  color,
  disabled,
  label,
  size = 20,
  tonal,
}: {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  disabled?: boolean;
  label: string;
  size?: number;
  /** Accent-coloured icon. */
  tonal?: boolean;
}) {
  const theme = useAppTheme();
  const box = size + 18;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.tile,
        { width: box, height: box, borderRadius: box / 2 },
        disabled ? { opacity: 0.35 } : neu(theme, pressed ? 'inset' : 'raised', pressed ? 2 : 3),
      ]}
    >
      <Icon source={icon} size={size} color={color ?? (tonal ? theme.colors.primary : theme.colors.onSurfaceVariant)} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------- Label / Chip

/** Small status pill (Live, New, Featured…). */
export function Label({
  children,
  tone = 'default',
  variant = 'soft',
  icon,
}: {
  children: React.ReactNode;
  tone?: Tone;
  variant?: 'soft' | 'filled';
  icon?: IconName;
}) {
  const theme = useAppTheme();
  const t = theme.custom.tones[tone];
  const fg = variant === 'filled' ? '#FFFFFF' : t.fg;
  return (
    <View style={[styles.label, neu(theme, 'raised', 2), variant === 'filled' && { backgroundColor: t.main }]}>
      {icon && <Icon source={icon} size={12} color={variant === 'filled' ? fg : t.main} />}
      <Text variant="labelSmall" style={{ color: fg }}>
        {children}
      </Text>
    </View>
  );
}

export function ChipList({ items, max = 6 }: { items: string[]; max?: number }) {
  const theme = useAppTheme();
  const chip = (text: string) => (
    <View key={text} style={[styles.chip, neu(theme, 'inset', 2)]}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {text}
      </Text>
    </View>
  );
  return (
    <View style={styles.chips}>
      {items.slice(0, max).map(chip)}
      {items.length > max && chip(`+${items.length - max}`)}
    </View>
  );
}

// ---------------------------------------------------------------------- States

export function EmptyState({
  title,
  description,
  icon = 'tray',
}: {
  title: string;
  description?: string;
  icon?: IconName;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.empty, neu(theme, 'inset', 5)]}>
      <View style={[styles.tile, neu(theme, 'raised', 5), { width: 56, height: 56, borderRadius: 28 }]}>
        <Icon source={icon} size={26} color={theme.colors.onSurfaceVariant} />
      </View>
      <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginTop: 10 }}>
        {title}
      </Text>
      {description && (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          {description}
        </Text>
      )}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ padding: 32, alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}

function Banner({ tone, icon, message }: { tone: Tone; icon: IconName; message: string }) {
  const theme = useAppTheme();
  const t = theme.custom.tones[tone];
  return (
    <View style={[styles.banner, neu(theme, 'inset', 4)]}>
      <View style={[styles.tile, neu(theme, 'raised', 3), { width: 34, height: 34, borderRadius: 17 }]}>
        <Icon source={icon} size={18} color={t.main} />
      </View>
      <Text variant="bodyMedium" style={{ flex: 1, color: t.fg }}>
        {message}
      </Text>
    </View>
  );
}

export const ErrorBanner = ({ message }: { message: string }) => (
  <Banner tone="error" icon="cloud-off-outline" message={message} />
);
export const WarningBanner = ({ message }: { message: string }) => (
  <Banner tone="warning" icon="alert-outline" message={message} />
);

// ---------------------------------------------------------------------- Toast

type ToastState = { message: string; tone: 'success' | 'error'; key: number } | null;

// The newest mounted host shows toasts — the item editor (a modal) mounts its own while open.
const hosts: ((t: ToastState) => void)[] = [];

export const toast = {
  success: (message: string) => hosts.at(-1)?.({ message, tone: 'success', key: Date.now() }),
  error: (message: string) => hosts.at(-1)?.({ message, tone: 'error', key: Date.now() }),
};

/** Raised soft toast above the tab bar; hides itself after a few seconds. */
export function ToastHost() {
  const theme = useAppTheme();
  const [state, setState] = useState<ToastState>(null);
  const [visible, setVisible] = useState(false);
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const show = (t: ToastState) => {
      setState(t);
      setVisible(true);
    };
    hosts.push(show);
    return () => {
      hosts.splice(hosts.indexOf(show), 1);
    };
  }, []);

  useEffect(() => {
    Animated.timing(fade, { toValue: visible ? 1 : 0, duration: 180, useNativeDriver: true }).start();
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(timer);
  }, [fade, visible, state?.key]);

  if (!state) return null;
  const tone = state.tone === 'error' ? theme.custom.tones.error : theme.custom.tones.success;

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.toastWrap,
        { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
      ]}
    >
      <View
        style={[styles.toast, neu(theme, 'raised', 7), { backgroundColor: theme.custom.surface.solid }]}
        accessibilityLiveRegion="polite"
      >
        <View style={[styles.tile, neu(theme, 'inset', 3), { width: 34, height: 34, borderRadius: 17 }]}>
          <Icon source={state.tone === 'error' ? 'alert-circle' : 'check-circle'} size={20} color={tone.main} />
        </View>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
          {state.message}
        </Text>
        <IconButton icon="close" label="Dismiss" size={16} onPress={() => setVisible(false)} />
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------- Confirm dialog

/** Soft confirm dialog (replaces the native Alert so it matches the theme). */
export function ConfirmDialog({
  visible,
  title,
  content,
  confirmLabel = 'Delete',
  icon = 'trash-can-outline',
  onConfirm,
  onDismiss,
}: {
  visible: boolean;
  title: string;
  content?: string;
  confirmLabel?: string;
  icon?: IconName;
  onConfirm: () => Promise<void> | void;
  onDismiss: () => void;
}) {
  const theme = useAppTheme();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: theme.colors.background, borderRadius: 28 }}>
        <View style={{ alignItems: 'center', paddingTop: 4 }}>
          <View style={[styles.tile, neu(theme, 'raised', 5), { width: 60, height: 60, borderRadius: 30 }]}>
            <Icon source={icon} size={26} color={theme.colors.error} />
          </View>
        </View>
        <Dialog.Title style={{ textAlign: 'center' }}>{title}</Dialog.Title>
        {content ? (
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
              {content}
            </Text>
          </Dialog.Content>
        ) : null}
        <Dialog.Actions style={{ gap: 12, paddingHorizontal: 20, paddingBottom: 20 }}>
          <Button variant="soft" tone="default" label="Cancel" onPress={onDismiss} style={{ flex: 1 }} />
          <Button tone="error" label={confirmLabel} loading={busy} onPress={confirm} style={{ flex: 1 }} />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

// ----------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { padding: 18, gap: 20, paddingBottom: 56 },
  orb: { position: 'absolute', width: 280, height: 280, borderRadius: 140, opacity: 0.55 },
  tabHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 4, paddingBottom: 6 },
  card: { borderRadius: 24 },
  cardInner: { borderRadius: 24, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16 },
  cardBody: { padding: 18 },
  tile: { alignItems: 'center', justifyContent: 'center' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16 },
  segmented: { flexDirection: 'row', padding: 5, borderRadius: 16, gap: 4 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 12,
  },
  switchTrack: { width: 52, height: 30, borderRadius: 15, padding: 3 },
  switchKnob: { width: 24, height: 24, borderRadius: 12 },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 9,
    height: 24,
    borderRadius: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  empty: {
    alignItems: 'center',
    gap: 4,
    margin: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  banner: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 18, alignItems: 'center' },
  toastWrap: { position: 'absolute', left: 16, right: 16, bottom: 110 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingLeft: 12, borderRadius: 20 },
});
