import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { useAuth } from '@/lib/auth';
import { http, endpoints as api } from '@/lib/api';
import { Input, Helper } from '@/components/fields';
import { Card, toast, Button, Screen, GradientAvatar } from '@/components/ui';

// ----------------------------------------------------------------------

/** Profile: name and email are read-only here (changed on the web dashboard); phone is saved from here. */
export default function ProfileScreen() {
  const theme = useAppTheme();
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  // Follow the account when it changes (pull-to-refresh, edits on the dashboard)
  const [syncedPhone, setSyncedPhone] = useState(user?.phone);
  if (syncedPhone !== user?.phone) {
    setSyncedPhone(user?.phone);
    setPhone(user?.phone ?? '');
  }

  const changed = phone.trim() !== (user?.phone ?? '');

  const savePhone = async () => {
    const value = phone.trim();
    if (value && !/^\+?[\d\s()-]{6,30}$/.test(value)) {
      toast.error('Enter a valid phone number');
      return;
    }
    setSaving(true);
    try {
      await http.put(api.account, { phone: value });
      await refreshUser();
      toast.success(value ? 'Phone number saved' : 'Phone number removed');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

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

      <Card title="Profile details" icon="account-outline">
        <View style={{ gap: 14 }}>
          <Input label="Name" value={user?.displayName ?? ''} disabled editable={false} />
          <Input label="Email" value={user?.email ?? ''} disabled editable={false} />
          <View>
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={30}
            />
            <Helper text="Name and email are changed on the web dashboard → Account." />
          </View>
        </View>
        <Button
          icon="check"
          label="Save phone"
          loading={saving}
          disabled={!changed}
          onPress={savePhone}
          style={{ marginTop: 20 }}
        />
      </Card>

      <Button variant="soft" icon="lock-reset" label="Update password" onPress={() => router.push('/password')} />
    </Screen>
  );
}
