import { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { Stack, DarkTheme, ThemeProvider, DefaultTheme } from 'expo-router';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { ToastHost } from '@/components/ui';
import { useAuth, AuthProvider } from '@/lib/auth';
import { usePreferences, PreferencesProvider } from '@/lib/preferences';
import { FONT, makeTheme, useAppTheme, withFontScale, navigationTheme } from '@/theme';

// ----------------------------------------------------------------------

function RootNavigator() {
  const theme = useAppTheme();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontFamily: FONT.bold, fontSize: theme.fonts.titleLarge.fontSize - 2 },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.background },
        contentStyle: { backgroundColor: theme.colors.background },
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: theme.colors.onSurface,
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
    <PreferencesProvider>
      <ThemedApp />
    </PreferencesProvider>
  );
}

/** Applies the app preferences: light/dark/system theme and text size. */
function ThemedApp() {
  const scheme = useColorScheme();
  const { ready, themePreference, fontScale } = usePreferences();
  const dark = themePreference === 'system' ? scheme === 'dark' : themePreference === 'dark';
  const theme = useMemo(() => withFontScale(dark ? darkTheme : lightTheme, fontScale), [dark, fontScale]);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded || !ready) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ThemeProvider value={navigationTheme(theme, theme.dark ? DarkTheme : DefaultTheme)}>
          <AuthProvider>
            <StatusBar style={theme.dark ? 'light' : 'dark'} />
            <RootNavigator />
            <ToastHost />
          </AuthProvider>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
