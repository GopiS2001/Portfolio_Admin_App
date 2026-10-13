import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/theme';
import { ToastHost } from '@/components/ui';
import { useAuth, AuthProvider } from '@/lib/auth';

// ----------------------------------------------------------------------

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerStyle: { backgroundColor: colors.paper },
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="content/home" options={{ title: 'Home' }} />
        <Stack.Screen name="content/about" options={{ title: 'About' }} />
        <Stack.Screen name="content/skills" options={{ title: 'Skills' }} />
        <Stack.Screen name="content/experience" options={{ title: 'Experience' }} />
        <Stack.Screen name="content/projects" options={{ title: 'Projects' }} />
        <Stack.Screen name="content/contact" options={{ title: 'Contact' }} />
        <Stack.Screen name="account" options={{ title: 'Account' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
        <ToastHost />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
