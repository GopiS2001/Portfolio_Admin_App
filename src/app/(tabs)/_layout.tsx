import type { Summary } from '@/lib/types';

import { Tabs } from 'expo-router';

import { colors } from '@/theme';
import { Icon } from '@/components/ui';
import { endpoints } from '@/lib/api';
import { useResource } from '@/lib/store';

// ----------------------------------------------------------------------

export default function TabLayout() {
  const { data: summary } = useResource<Summary>(endpoints.summary);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerStyle: { backgroundColor: colors.paper },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Icon name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          title: 'Content',
          tabBarIcon: ({ color, size }) => <Icon name="layers-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: summary?.unread ? summary.unread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error },
          tabBarIcon: ({ color, size }) => <Icon name="mail-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="configuration"
        options={{
          title: 'Configuration',
          tabBarIcon: ({ color, size }) => <Icon name="options-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
