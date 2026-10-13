import type { Tone } from '@/theme';

import { useState, useEffect, useCallback } from 'react';
import { View, Linking, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Icon,
  Dialog,
  Portal,
  Surface,
  Snackbar,
  ActivityIndicator,
  Button as PaperButton,
  IconButton as PaperIconButton,
} from 'react-native-paper';

import { useAppTheme } from '@/theme';
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
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
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
      {anchor !== undefined && (
        <PaperButton
          mode="text"
          icon="eye-outline"
          compact
          onPress={() => Linking.openURL(websiteUrl(anchor || undefined))}
          style={{ alignSelf: 'flex-end', marginBottom: -8 }}
        >
          Preview on website
        </PaperButton>
      )}
      {children}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------- Card

/** Elevated card with an optional header (icon tile, title, subtitle, action). */
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
    <Surface
      elevation={1}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.custom.divider,
          shadowColor: theme.custom.cardShadow,
        },
      ]}
    >
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
    </Surface>
  );
}

export function IconTile({ icon, tone = 'primary', size = 40 }: { icon: IconName; tone?: Tone; size?: number }) {
  const theme = useAppTheme();
  const t = theme.custom.tones[tone];
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: t.bg }]}>
      <Icon source={icon} size={size * 0.52} color={t.fg} />
    </View>
  );
}

export function Divider({ dashed, inset = 0 }: { dashed?: boolean; inset?: number }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        marginLeft: inset,
        borderBottomWidth: StyleSheet.hairlineWidth * 2,
        borderColor: theme.custom.divider,
        borderStyle: dashed ? 'dashed' : 'solid',
      }}
    />
  );
}

// ---------------------------------------------------------------------- Buttons

type ButtonProps = {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  variant?: 'contained' | 'outlined' | 'soft' | 'text';
  tone?: 'primary' | 'error' | 'default';
  size?: 'small' | 'medium';
  disabled?: boolean;
  loading?: boolean;
  style?: object;
};

/** Paper button with the dashboard's variants mapped to Material 3 modes. */
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
  const mode = { contained: 'contained', outlined: 'outlined', soft: 'contained-tonal', text: 'text' }[variant] as
    | 'contained'
    | 'outlined'
    | 'contained-tonal'
    | 'text';

  const colorProps =
    tone === 'error'
      ? variant === 'contained'
        ? { buttonColor: theme.colors.error, textColor: theme.colors.onPrimary }
        : variant === 'soft'
          ? { buttonColor: theme.colors.errorContainer, textColor: theme.colors.onErrorContainer }
          : { textColor: theme.colors.error }
      : tone === 'default' && variant !== 'contained'
        ? { textColor: theme.colors.onSurface }
        : {};

  return (
    <PaperButton
      mode={mode}
      icon={icon}
      onPress={onPress}
      disabled={disabled || loading}
      loading={loading}
      compact={size === 'small'}
      {...colorProps}
      style={[{ borderRadius: 12 }, variant === 'outlined' && { borderColor: theme.colors.outline }, style]}
      contentStyle={size === 'small' ? { height: 36 } : { height: 46 }}
      labelStyle={size === 'small' ? { fontSize: 13, marginVertical: 0 } : undefined}
    >
      {label}
    </PaperButton>
  );
}

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
  tonal?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <PaperIconButton
      icon={icon}
      size={size}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      iconColor={color ?? theme.colors.onSurfaceVariant}
      mode={tonal ? 'contained-tonal' : undefined}
      style={{ margin: 0 }}
    />
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
    <View style={[styles.label, { backgroundColor: variant === 'filled' ? t.main : t.bg }]}>
      {icon && <Icon source={icon} size={13} color={fg} />}
      <Text variant="labelSmall" style={{ color: fg }}>
        {children}
      </Text>
    </View>
  );
}

export function ChipList({ items, max = 6 }: { items: string[]; max?: number }) {
  const theme = useAppTheme();
  const chip = (text: string) => (
    <View key={text} style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]}>
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
    <View style={[styles.empty, { backgroundColor: theme.custom.neutral }]}>
      <IconTile icon={icon} tone="default" size={52} />
      <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginTop: 6 }}>
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
    <View style={[styles.banner, { backgroundColor: t.bg }]}>
      <Icon source={icon} size={20} color={t.fg} />
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

// ---------------------------------------------------------------------- Toast (Snackbar)

type ToastState = { message: string; tone: 'success' | 'error'; key: number } | null;

// The newest mounted host shows toasts — the item editor (a modal) mounts its own while open.
const hosts: ((t: ToastState) => void)[] = [];

export const toast = {
  success: (message: string) => hosts.at(-1)?.({ message, tone: 'success', key: Date.now() }),
  error: (message: string) => hosts.at(-1)?.({ message, tone: 'error', key: Date.now() }),
};

export function ToastHost() {
  const theme = useAppTheme();
  const [state, setState] = useState<ToastState>(null);
  const [visible, setVisible] = useState(false);

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

  const tone = state?.tone === 'error' ? theme.custom.tones.error : theme.custom.tones.success;

  return (
    <Snackbar
      key={state?.key}
      visible={visible}
      onDismiss={() => setVisible(false)}
      duration={2800}
      wrapperStyle={{ bottom: 72 }}
      style={{ borderRadius: 14, backgroundColor: theme.colors.inverseSurface }}
      icon="close"
      onIconPress={() => setVisible(false)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon source={state?.tone === 'error' ? 'alert-circle' : 'check-circle'} size={20} color={tone.main} />
        <Text variant="bodyMedium" style={{ color: theme.colors.inverseOnSurface, flexShrink: 1 }}>
          {state?.message}
        </Text>
      </View>
    </Snackbar>
  );
}

// ---------------------------------------------------------------------- Confirm dialog

/** Material confirm dialog (replaces the native Alert so it matches the theme). */
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
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: theme.colors.surface, borderRadius: 24 }}>
        <Dialog.Icon icon={icon} color={theme.colors.error} />
        <Dialog.Title style={{ textAlign: 'center' }}>{title}</Dialog.Title>
        {content ? (
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
              {content}
            </Text>
          </Dialog.Content>
        ) : null}
        <Dialog.Actions>
          <PaperButton onPress={onDismiss} textColor={theme.colors.onSurfaceVariant}>
            Cancel
          </PaperButton>
          <PaperButton
            mode="contained"
            buttonColor={theme.colors.error}
            textColor="#FFFFFF"
            loading={busy}
            disabled={busy}
            onPress={confirm}
            style={{ borderRadius: 12 }}
          >
            {confirmLabel}
          </PaperButton>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

// ----------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 16, paddingBottom: 56 },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  cardInner: { borderRadius: 20, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16 },
  cardBody: { padding: 18 },
  tile: { alignItems: 'center', justifyContent: 'center' },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 9,
    height: 24,
    borderRadius: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  empty: {
    alignItems: 'center',
    gap: 6,
    margin: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  banner: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, alignItems: 'center' },
});
