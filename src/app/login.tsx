import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Platform, StyleSheet, ScrollView, KeyboardAvoidingView } from 'react-native';

import { colors } from '@/theme';
import { useAuth } from '@/lib/auth';
import { DEFAULT_SERVER_URL } from '@/lib/api';
import { Icon, Card, Button, ErrorBanner } from '@/components/ui';
import { Input, Helper, FieldLabel } from '@/components/fields';

// ----------------------------------------------------------------------

export default function LoginScreen() {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Icon name="grid" size={32} color={colors.white} />
          </View>
          <Text style={styles.title}>Portfolio Admin</Text>
          <Text style={styles.subtitle}>Sign in to manage your website.</Text>

          <Card>
            <View style={{ gap: 16 }}>
              {!!error && <ErrorBanner message={error} />}
              <View>
                <FieldLabel label="Email" />
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@portfolio.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  autoComplete="email"
                />
              </View>
              <View>
                <FieldLabel label="Password" />
                <View style={{ justifyContent: 'center' }}>
                  <Input
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    autoComplete="password"
                    onSubmitEditing={submit}
                    returnKeyType="go"
                    style={{ paddingRight: 48 }}
                  />
                  <View style={styles.eye}>
                    <IconButton
                      icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      label={showPassword ? 'Hide password' : 'Show password'}
                      onPress={() => setShowPassword((v) => !v)}
                    />
                  </View>
                </View>
              </View>

              {showServer ? (
                <View>
                  <FieldLabel label="API server" />
                  <Input
                    value={server}
                    onChangeText={setServer}
                    placeholder={DEFAULT_SERVER_URL}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  <Helper text={`The NestJS backend (port 4000). Detected: ${DEFAULT_SERVER_URL}`} />
                </View>
              ) : (
                <Text style={styles.server} onPress={() => setShowServer(true)}>
                  Server: {server} · <Text style={{ color: colors.primary, fontWeight: '600' }}>Change</Text>
                </Text>
              )}

              <Button label="Sign in" loading={loading} onPress={submit} />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 8 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  server: { fontSize: 13, color: colors.textSecondary },
});
