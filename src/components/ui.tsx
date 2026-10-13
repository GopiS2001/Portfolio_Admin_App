import type { Tone } from '@/theme';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Linking,
  Animated,
  Pressable,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { colors, tones, radius } from '@/theme';
import { websiteUrl } from '@/lib/api';

// ----------------------------------------------------------------------

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({
  name,
  size = 20,
  color = colors.text,
}: {
  name: IconName;
  size?: number;
  color?: React.ComponentProps<typeof Ionicons>['color'];
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

// ---------------------------------------------------------------------- Screen

/** Scrollable page with pull-to-refresh and a "Preview on website" link. */
export function Screen({
  children,
  onRefresh,
  anchor,
}: {
  children: React.ReactNode;
  onRefresh?: () => Promise<unknown> | void;
  /** Anchor on the website to open with "Preview" (e.g. "projects"). */
  anchor?: string;
}) {
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      {anchor !== undefined && (
        <Button
          variant="outlined"
          icon="eye-outline"
          label="Preview on website"
          onPress={() => Linking.openURL(websiteUrl(anchor || undefined))}
          style={{ alignSelf: 'flex-end' }}
          size="small"
        />
      )}
      {children}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------- Card

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
  return (
    <View style={styles.card}>
      {(title || action) && (
        <View style={styles.cardHeader}>
          {icon && <Icon name={icon} size={22} color={colors.primary} />}
          <View style={{ flex: 1 }}>
            {title && <Text style={styles.cardTitle}>{title}</Text>}
            {subheader && <Text style={styles.cardSubheader}>{subheader}</Text>}
          </View>
          {action}
        </View>
      )}
      {(title || action) && children ? <Divider /> : null}
      {children ? <View style={padded ? styles.cardBody : undefined}>{children}</View> : null}
    </View>
  );
}

export function Divider({ dashed }: { dashed?: boolean }) {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderColor: colors.divider,
        borderStyle: dashed ? 'dashed' : 'solid',
      }}
    />
  );
}

// ---------------------------------------------------------------------- Button

type ButtonProps = {
  label?: string;
  icon?: IconName;
  onPress?: () => void;
  variant?: 'contained' | 'outlined' | 'soft' | 'text';
  tone?: Tone;
  size?: 'small' | 'medium';
  disabled?: boolean;
  loading?: boolean;
  style?: object;
};

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
  const t = tone === 'default' ? { bg: '#1C252E', fg: colors.text, main: '#1C252E' } : tones[tone];
  const bg =
    variant === 'contained' ? t.main : variant === 'soft' ? tones[tone].bg : 'transparent';
  const fg = variant === 'contained' ? colors.white : tone === 'default' ? colors.text : t.fg;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        size === 'small' && styles.buttonSmall,
        !label && styles.iconOnly,
        {
          backgroundColor: bg,
          borderColor: variant === 'outlined' ? colors.divider : 'transparent',
          opacity: inactive ? 0.48 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        icon && <Icon name={icon} size={size === 'small' ? 16 : 18} color={fg} />
      )}
      {label ? (
        <Text style={[styles.buttonText, size === 'small' && { fontSize: 13 }, { color: fg }]}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.textSecondary,
  disabled,
  label,
  size = 20,
}: {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  disabled?: boolean;
  label: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 },
      ]}
    >
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------- Label / Chip

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
  const t = tones[tone];
  const fg = variant === 'filled' ? colors.white : t.fg;
  return (
    <View style={[styles.label, { backgroundColor: variant === 'filled' ? t.main : t.bg }]}>
      {icon && <Icon name={icon} size={12} color={fg} />}
      <Text style={[styles.labelText, { color: fg }]}>{children}</Text>
    </View>
  );
}

export function ChipList({ items, max = 6 }: { items: string[]; max?: number }) {
  return (
    <View style={styles.chips}>
      {items.slice(0, max).map((t) => (
        <View key={t} style={styles.chip}>
          <Text style={styles.chipText}>{t}</Text>
        </View>
      ))}
      {items.length > max && (
        <View style={styles.chip}>
          <Text style={styles.chipText}>+{items.length - max}</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------- States

export function EmptyState({ title, description, icon = 'file-tray-outline' }: { title: string; description?: string; icon?: IconName }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={40} color={colors.textDisabled} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyText}>{description}</Text>}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ padding: 32, alignItems: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={[styles.banner, { backgroundColor: tones.error.bg }]}>
      <Icon name="cloud-offline-outline" color={tones.error.fg} />
      <Text style={{ flex: 1, color: tones.error.fg }}>{message}</Text>
    </View>
  );
}

export function WarningBanner({ message }: { message: string }) {
  return (
    <View style={[styles.banner, { backgroundColor: tones.warning.bg }]}>
      <Icon name="warning-outline" color={tones.warning.fg} />
      <Text style={{ flex: 1, color: tones.warning.fg }}>{message}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------- Toast

type ToastState = { message: string; tone: 'success' | 'error' } | null;
let showToast: (t: ToastState) => void = () => {};

export const toast = {
  success: (message: string) => showToast({ message, tone: 'success' }),
  error: (message: string) => showToast({ message, tone: 'error' }),
};

/** Render once near the root; `toast.success()` / `toast.error()` show a message for a few seconds. */
export function ToastHost() {
  const [state, setState] = useState<ToastState>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    showToast = (t) => {
      if (timer.current) clearTimeout(timer.current);
      setState(t);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
          setState(null)
        );
      }, 2800);
    };
    return () => {
      showToast = () => {};
    };
  }, [opacity]);

  if (!state) return null;
  const t = tones[state.tone];
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { opacity }]}>
      <Icon name={state.tone === 'success' ? 'checkmark-circle' : 'alert-circle'} color={t.main} />
      <Text style={styles.toastText}>{state.message}</Text>
    </Animated.View>
  );
}

// ----------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 16, paddingBottom: 48 },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    shadowColor: '#919EAB',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  cardSubheader: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardBody: { padding: 16 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  buttonSmall: { minHeight: 34, paddingHorizontal: 12 },
  iconOnly: { paddingHorizontal: 10 },
  buttonText: { fontSize: 14, fontWeight: '700' },
  iconButton: { padding: 6, borderRadius: 20 },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 6,
  },
  labelText: { fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    backgroundColor: 'rgba(145, 158, 171, 0.16)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 12, color: colors.text },
  empty: {
    alignItems: 'center',
    gap: 6,
    margin: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.neutral,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  emptyText: { fontSize: 13, color: colors.textDisabled, textAlign: 'center' },
  banner: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, alignItems: 'center' },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: '#1C252E',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  toastText: { flex: 1, color: colors.white, fontSize: 14 },
});
