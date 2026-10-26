import { router } from 'expo-router';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/fields';
import { Card, Button, Screen, GradientAvatar } from '@/components/ui';

// ----------------------------------------------------------------------

// Keep in sync with GENDERS in BACKEND/src/auth/auth.controller.ts
const GENDER_LABELS: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other' };

/** Read-only profile; the details are edited on the web dashboard's Account page. */
export default function ProfileScreen() {
  const theme = useAppTheme();
  const { user, refreshUser } = useAuth();

  const rows = [
    { label: 'Name', value: user?.displayName },
    { label: 'Email', value: user?.email },
    { label: 'Phone', value: user?.phone },
    { label: 'Gender', value: user?.gender ? (GENDER_LABELS[user.gender] ?? user.gender) : '' },
  ];

  return (
    <Screen onRefresh={refreshUser}>
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <GradientAvatar name={user?.displayName} size={88} />
        <Text variant="titleLarge" style={{ marginTop: 18 }}>
          {user?.displayName}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {user?.email}
        </Text>
      </View>

      <Card title="Profile details" subheader="Edit these on the web dashboard → Account." icon="account-outline">
        <View style={{ gap: 14 }}>
          {rows.map((r) => (
            <Input key={r.label} label={r.label} value={r.value || 'Not set'} disabled editable={false} />
          ))}
        </View>
      </Card>

      <Button variant="soft" icon="lock-reset" label="Update password" onPress={() => router.push('/password')} />
    </Screen>
  );
}
