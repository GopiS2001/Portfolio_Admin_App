import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, TouchableRipple } from 'react-native-paper';
import { View, Platform, StyleSheet, ScrollView, KeyboardAvoidingView } from 'react-native';

import { useAppTheme } from '@/theme';
import { useAuth } from '@/lib/auth';
import { DEFAULT_SERVER_URL } from '@/lib/api';
import { Input, Helper } from '@/components/fields';
import { Icon, Card, Button, ErrorBanner } from '@/components/ui';

// ----------------------------------------------------------------------

export default function LoginScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { signIn, serverUrl } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [server, setServer] = useState(serverUrl);
  const [showServer, setShowServer] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password, server);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const stale = server.replace(/\/$/, '') !== DEFAULT_SERVER_URL;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={theme.custom.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top + 48 }]}
          >
            <View style={styles.glow} />
            <View style={styles.logo}>
              <Icon source="view-dashboard-variant" size={30} color="#FFFFFF" />
            </View>
            <Text variant="headlineMedium" style={{ color: '#FFFFFF' }}>
              Portfolio Admin
            </Text>
            <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
              Manage your website from anywhere.
            </Text>
          </LinearGradient>

          <View style={styles.cardWrap}>
            <Card>
              <View style={{ gap: 14 }}>
                <View>
                  <Text variant="titleLarge">Welcome back</Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    Sign in with your dashboard account.
                  </Text>
                </View>

                {!!error && <ErrorBanner message={error} />}

                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  autoComplete="email"
                  left={<TextInput.Icon icon="email-outline" />}
                />
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  autoComplete="password"
                  onSubmitEditing={submit}
                  returnKeyType="go"
                  left={<TextInput.Icon icon="lock-outline" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      onPress={() => setShowPassword((v) => !v)}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    />
                  }
                />

                <Button label="Sign in" icon="arrow-right" loading={loading} onPress={submit} style={{ marginTop: 4 }} />
              </View>
            </Card>

            <View style={[styles.server, { backgroundColor: theme.custom.neutral }]}>
              {showServer ? (
                <View>
                  <Input
                    dense
                    label="API server"
                    value={server}
                    onChangeText={setServer}
                    placeholder={DEFAULT_SERVER_URL}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    left={<TextInput.Icon icon="server-network" />}
                  />
                  <Helper text={`The NestJS backend. Detected: ${DEFAULT_SERVER_URL}`} />
                </View>
              ) : (
                <TouchableRipple onPress={() => setShowServer(true)} borderless style={{ borderRadius: 12 }}>
                  <View style={styles.serverRow}>
                    <Icon source="server-network" size={18} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" numberOfLines={1} style={{ flex: 1, color: theme.colors.onSurfaceVariant }}>
                      {server}
                    </Text>
                    <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                      Change
                    </Text>
                  </View>
                </TouchableRipple>
              )}
              {stale && (
                <TouchableRipple onPress={() => setServer(DEFAULT_SERVER_URL)} borderless style={{ borderRadius: 12 }}>
                  <View style={styles.serverRow}>
                    <Icon source="refresh" size={18} color={theme.custom.tones.warning.fg} />
                    <Text variant="bodySmall" style={{ flex: 1, color: theme.colors.onSurfaceVariant }}>
                      This computer is now at {DEFAULT_SERVER_URL}
                    </Text>
                    <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                      Use it
                    </Text>
                  </View>
                </TouchableRipple>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 72,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    right: -60,
    top: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardWrap: { paddingHorizontal: 16, marginTop: -44, gap: 14 },
  server: { borderRadius: 16, padding: 8, gap: 4 },
  serverRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 8 },
});
