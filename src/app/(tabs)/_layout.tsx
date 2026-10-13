import type { Summary } from '@/lib/types';

import { Tabs } from 'expo-router';
import { Icon } from 'react-native-paper';

import { endpoints } from '@/lib/api';
import { useResource } from '@/lib/store';
import { FONT, useAppTheme } from '@/theme';

// ----------------------------------------------------------------------

const tabIcon =
  (active: string, inactive: string) =>
  ({ color, focused }: { color: string; focused: boolean }) => (
    <Icon source={focused ? active : inactive} size={24} color={color} />
  );

export default function TabLayout() {
  const theme = useAppTheme();
  const { data: summary } = useResource<Summary>(endpoints.summary);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: { fontFamily: FONT.semibold, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.custom.divider,
          height: undefined,
          paddingTop: 6,
        },
        headerTitleStyle: { fontFamily: FONT.bold, fontSize: 20, color: theme.colors.onSurface },
        headerStyle: { backgroundColor: theme.colors.background },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: tabIcon('view-dashboard', 'view-dashboard-outline') }}
      />
      <Tabs.Screen
        name="content"
        options={{ title: 'Content', tabBarIcon: tabIcon('layers', 'layers-outline') }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: summary?.unread ? summary.unread : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.colors.error, fontFamily: FONT.semibold, fontSize: 10 },
          tabBarIcon: tabIcon('email', 'email-outline'),
        }}
      />
      <Tabs.Screen
        name="configuration"
        options={{ title: 'Settings', headerTitle: 'Configuration', tabBarIcon: tabIcon('cog', 'cog-outline') }}
      />
    </Tabs>
  );
}
