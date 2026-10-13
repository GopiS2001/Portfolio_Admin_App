import type { Tabs } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, Badge } from 'react-native-paper';

import { FONT, useAppTheme } from '@/theme';

// ----------------------------------------------------------------------

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * Floating capsule tab bar. The active tab sits in its own rounded inner capsule
 * (fine border + soft shadow) with a bold label; the others are icon + plain label.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 4 }]}>
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
              style={({ pressed }) => [styles.item, pressed && !focused && { opacity: 0.6 }]}
            >
              <View
                style={[
                  styles.capsule,
                  focused && [
                    styles.capsuleActive,
                    {
                      backgroundColor: theme.dark ? theme.colors.elevation.level3 : theme.colors.surface,
                      borderColor: theme.colors.outlineVariant,
                      shadowColor: theme.custom.cardShadow,
                    },
                  ],
                ]}
              >
                <View>
                  {options.tabBarIcon?.({ focused, color, size: 26 })}
                  {badge !== undefined && (
                    <Badge size={17} style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                      {badge}
                    </Badge>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    { color, fontFamily: focused ? FONT.bold : FONT.medium },
                  ]}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 40,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  item: { flex: 1 },
  capsule: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 9,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  capsuleActive: {
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  label: { fontSize: 12, lineHeight: 16 },
  badge: { position: 'absolute', top: -5, right: -10 },
});
