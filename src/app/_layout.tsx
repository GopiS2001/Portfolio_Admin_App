import { useMemo, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
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
import { STACK_TITLES, type StackRoute } from '@/lib/screens';
import { usePreferences, PreferencesProvider } from '@/lib/preferences';
import { makeTheme, useAppTheme, withFontScale, navigationTheme } from '@/theme';

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
        // No fixed native bar: every page draws its header inside the scroll view, so it scrolls
        // away with the content (tabs → TabHeader, pushed pages → StackHeader).
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        {(Object.keys(STACK_TITLES) as StackRoute[]).map((name) => (
          <Stack.Screen key={name} name={name} options={{ title: STACK_TITLES[name] }} />
        ))}
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
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

/** Applies the app preferences: light/dark/system theme, design style and text size. */
function ThemedApp() {
  const scheme = useColorScheme();
  const { ready, themePreference, designStyle, fontScale } = usePreferences();
  const dark = themePreference === 'system' ? scheme === 'dark' : themePreference === 'dark';
  const theme = useMemo(
    () => withFontScale(makeTheme(dark, designStyle), fontScale),
    [dark, designStyle, fontScale]
  );
  // Paint the native window in the page colour too. It shows through while a screen is being
  // re-attached during the back animation — left at Android's default it flashed white.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme.colors.background]);

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
            <ProfileMenuProvider>
              <RootNavigator />
            </ProfileMenuProvider>
            <ToastHost />
          </AuthProvider>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
