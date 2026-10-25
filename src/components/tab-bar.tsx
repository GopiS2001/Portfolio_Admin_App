import type { Tabs } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, Badge } from 'react-native-paper';

import { neu, FONT, useAppTheme } from '@/theme';

// ----------------------------------------------------------------------

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * Floating soft-UI capsule tab bar. The bar is raised out of the page; the active tab is
 * pressed into it with an accent icon and bold label, the others are icon + plain label.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 4 }]}>
      <View style={[styles.bar, neu(theme, 'raised', 8)]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? theme.colors.primary : theme.colors.onSurfaceVariant;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const badge = options.tabBarBadge;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={styles.item}
            >
              {({ pressed }) => (
                <View style={[styles.capsule, (focused || pressed) && neu(theme, 'inset', focused ? 4 : 2)]}>
                  <View>
                    {options.tabBarIcon?.({ focused, color, size: 24 })}
                    {badge !== undefined && (
                      <Badge size={17} style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                        {badge}
                      </Badge>
                    )}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      color,
                      fontFamily: focused ? FONT.bold : FONT.medium,
                      fontSize: theme.fonts.labelSmall.fontSize + 1,
                      lineHeight: theme.fonts.labelSmall.lineHeight,
                    }}
                  >
                    {label}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 34, padding: 8 },
  item: { flex: 1 },
  capsule: { alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 9, borderRadius: 26 },
  badge: { position: 'absolute', top: -5, right: -10 },
});
