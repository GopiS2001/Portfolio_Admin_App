import type { Tabs } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, Badge } from 'react-native-paper';

import { useAppTheme } from '@/theme';

// ----------------------------------------------------------------------

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Floating pill tab bar: the active tab gets a tinted pill behind its icon. */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 6 }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.custom.divider,
            shadowColor: theme.custom.cardShadow,
          },
        ]}
      >
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
              <View style={[styles.pill, focused && { backgroundColor: theme.colors.primaryContainer }]}>
                {options.tabBarIcon?.({ focused, color, size: 22 })}
                {badge !== undefined && (
                  <Badge size={17} style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                    {badge}
                  </Badge>
                )}
              </View>
              <Text
                variant="labelSmall"
                numberOfLines={1}
                style={{ color, marginTop: 3, opacity: focused ? 1 : 0.85 }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14 },
  bar: {
    flexDirection: 'row',
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  item: { flex: 1, alignItems: 'center' },
  pill: { width: 58, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: 6 },
});
