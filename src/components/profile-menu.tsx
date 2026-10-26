import type { View as ViewType } from 'react-native';
import type { Summary } from '@/lib/types';
import type { IconName } from './ui';

import { router } from 'expo-router';
import { BlurView, BlurTargetView } from 'expo-blur';
import { useRef, useState, useEffect, useContext, useCallback, createContext } from 'react';
import { View, Animated, Platform, Pressable, StyleSheet, BackHandler, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';

import { useAuth } from '@/lib/auth';
import { neu, useAppTheme } from '@/theme';
import { useResource } from '@/lib/store';
import { endpoints } from '@/lib/api';

import { Icon, Label, Divider, ConfirmDialog, GradientAvatar, floatingFill } from './ui';

// ----------------------------------------------------------------------

type Anchor = { x: number; y: number; width: number; height: number };

const MenuContext = createContext<((anchor: Anchor) => void) | null>(null);

const MENU_WIDTH = 236;

/**
 * Wraps the app so the profile menu can frost everything behind it. On Android expo-blur can only
 * blur a BlurTargetView, so the whole navigator sits in one and the menu overlay is drawn beside it
 * (a blur view must never be inside the target it blurs).
 */
export function ProfileMenuProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const target = useRef<ViewType | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));

  const show = useCallback((a: Anchor) => {
    setAnchor(a);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  // Fade/scale in; unmount the overlay only once the fade-out has finished
  useEffect(() => {
    Animated.timing(progress, { toValue: open ? 1 : 0, duration: open ? 200 : 150, useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished && !open) setAnchor(null);
      }
    );
  }, [open, progress]);

  // Android back button closes the menu first
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  const go = (path: '/account' | '/messages') => {
    setOpen(false);
    router.push(path);
  };

  return (
    <MenuContext.Provider value={show}>
      <BlurTargetView ref={target} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {children}
      </BlurTargetView>

      {anchor && (
        <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
          {/* Frosted backdrop; tapping it closes the menu */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close menu">
              <BlurView
                pointerEvents="none"
                intensity={45}
                tint={theme.dark ? 'dark' : 'light'}
                {...(Platform.OS === 'android'
                  ? { blurTarget: target, blurMethod: 'dimezisBlurViewSdk31Plus' as const }
                  : null)}
                style={StyleSheet.absoluteFill}
              />
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { backgroundColor: theme.dark ? 'rgba(0,0,0,0.25)' : 'rgba(15,23,42,0.08)' }]}
              />
            </Pressable>
          </Animated.View>

          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.menu,
              neu(theme, 'raised', 8),
              {
                backgroundColor: floatingFill(theme),
                top: anchor.y + anchor.height + 12,
                right: Math.max(12, screenWidth - (anchor.x + anchor.width)),
                opacity: progress,
                transform: [
                  { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
                  { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                ],
              },
            ]}
          >
            <MenuItems
              onProfile={() => go('/account')}
              onMessages={() => go('/messages')}
              onSignOut={() => {
                setOpen(false);
                setConfirmSignOut(true);
              }}
            />
          </Animated.View>
        </View>
      )}

      <SignOutDialog visible={confirmSignOut} onDismiss={() => setConfirmSignOut(false)} />
    </MenuContext.Provider>
  );
}

function MenuItems({
  onProfile,
  onMessages,
  onSignOut,
}: {
  onProfile: () => void;
  onMessages: () => void;
  onSignOut: () => void;
}) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const unread = useResource<Summary>(endpoints.summary).data?.unread ?? 0;

  return (
    <>
      <View style={styles.who}>
        <GradientAvatar name={user?.displayName} size={36} />
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" numberOfLines={1}>
            {user?.displayName}
          </Text>
          <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
            {user?.email}
          </Text>
        </View>
      </View>
      <Divider />
      <View style={styles.items}>
        <MenuItem icon="account-outline" label="Profile" onPress={onProfile} />
        <MenuItem
          icon="message-text-outline"
          label="Messages"
          onPress={onMessages}
          badge={unread > 0 ? String(unread) : undefined}
        />
      </View>
      <Divider />
      <View style={styles.items}>
        <MenuItem icon="logout" label="Logout" onPress={onSignOut} danger />
      </View>
    </>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  badge,
  danger,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  badge?: string;
  danger?: boolean;
}) {
  const theme = useAppTheme();
  const color = danger ? theme.colors.error : theme.colors.onSurface;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={badge ? `${label}, ${badge} unread` : label}
      style={({ pressed }) => [styles.item, pressed && neu(theme, 'inset', 3)]}
    >
      <Icon source={icon} size={20} color={color} />
      <Text variant="bodyLarge" style={{ color, flex: 1 }}>
        {label}
      </Text>
      {badge && (
        <Label tone="primary" variant="filled">
          {badge}
        </Label>
      )}
    </Pressable>
  );
}

function SignOutDialog({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const { signOut } = useAuth();
  return (
    <ConfirmDialog
      visible={visible}
      title="Sign out?"
      content="You'll need to sign in again to manage your portfolio."
      confirmLabel="Sign out"
      icon="logout"
      onConfirm={signOut}
      onDismiss={onDismiss}
    />
  );
}

/** The header avatar: opens the profile menu just below itself. */
export function ProfileMenuButton({ size = 48 }: { size?: number }) {
  const show = useContext(MenuContext);
  const { user } = useAuth();
  const ref = useRef<ViewType>(null);

  const onPress = () => {
    if (!show) {
      router.push('/account');
      return;
    }
    ref.current?.measureInWindow((x, y, width, height) => show({ x, y, width, height }));
  };

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open profile menu"
      accessibilityHint="Profile, messages and logout"
      hitSlop={6}
    >
      <GradientAvatar name={user?.displayName} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: { position: 'absolute', width: MENU_WIDTH, borderRadius: 22, overflow: 'hidden' },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  items: { padding: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14 },
});
