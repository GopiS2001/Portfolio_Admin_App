import type { ColorValue } from 'react-native';
import type { Summary, Settings } from '@/lib/types';

import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Icon } from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { endpoints } from '@/lib/api';
import { useResource } from '@/lib/store';
import { DESIGN_STYLES, usePreferences } from '@/lib/preferences';
import { FloatingTabBar } from '@/components/tab-bar';

// ----------------------------------------------------------------------

/** Filled icon on the active tab, outlined otherwise. */
const tabIcon = (active: string, inactive: string) =>
  function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Icon source={focused ? active : inactive} size={size} color={color as string} />;
  };

export default function TabLayout() {
  const theme = useAppTheme();
  const { data: summary } = useResource<Summary>(endpoints.summary);

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        // Each tab draws its own large header inside the scroll view
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home-variant', 'home-variant-outline') }} />
      <Tabs.Screen name="content" options={{ title: 'Content', tabBarIcon: tabIcon('layers', 'layers-outline') }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Inbox',
          tabBarBadge: summary?.unread ? summary.unread : undefined,
          tabBarIcon: tabIcon('email', 'email-outline'),
        }}
      />
      <Tabs.Screen name="configuration" options={{ title: 'Settings', tabBarIcon: tabIcon('cog', 'cog-outline') }} />
    </Tabs>
  );
}
