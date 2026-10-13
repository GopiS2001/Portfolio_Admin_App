import type { FieldDef } from '@/components/fields';

import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text, Avatar } from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { useAuth } from '@/lib/auth';
import { http, endpoints as api } from '@/lib/api';
import { Card, toast, Button, Screen } from '@/components/ui';
import { FormFields, useFieldForm } from '@/components/fields';

// ----------------------------------------------------------------------

const ACCOUNT_FIELDS: FieldDef[] = [
  { name: 'displayName', label: 'Name', required: true },
  { name: 'email', label: 'Email (login)', required: true, keyboard: 'email-address' },
];

const PASSWORD_FIELDS: FieldDef[] = [
  { name: 'currentPassword', label: 'Current password', type: 'password', required: true },
  { name: 'newPassword', label: 'New password', type: 'password', required: true },
  { name: 'confirmPassword', label: 'Confirm new password', type: 'password', required: true },
];

export default function AccountScreen() {
  const { user, refreshUser } = useAuth();
  const source = useMemo(() => ({ displayName: user?.displayName, email: user?.email }), [user]);
  const account = useFieldForm(ACCOUNT_FIELDS, source);
  const password = useFieldForm(PASSWORD_FIELDS, null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const saveAccount = async () => {
    if (!account.validate()) return;
    if (!/^\S+@\S+\.\S+$/.test(account.values.email)) {
      toast.error('Enter a valid email');
      return;
    }
    setSavingAccount(true);
    try {
      await http.put(api.account, account.body());
      await refreshUser();
      toast.success('Account updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingAccount(false);
    }
  };

  const savePassword = async () => {
    if (!password.validate()) return;
    const { currentPassword, newPassword, confirmPassword } = password.values;
    if (newPassword.length < 6) return toast.error('New password needs at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setSavingPassword(true);
    try {
      await http.put(api.password, { currentPassword, newPassword });
      password.reset();
      toast.success('Password changed');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Avatar.Text
          size={76}
          label={(user?.displayName ?? 'A').slice(0, 1).toUpperCase()}
          style={{ backgroundColor: theme.colors.primaryContainer }}
          labelStyle={{ color: theme.colors.onPrimaryContainer, fontFamily: theme.fonts.headlineMedium.fontFamily }}
        />
        <Text variant="titleLarge" style={{ marginTop: 12 }}>
          {user?.displayName}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {user?.email}
        </Text>
      </View>

      <Card title="Admin account" subheader="Used to sign in to the dashboard and this app." icon="account-cog-outline">
        <FormFields fields={ACCOUNT_FIELDS} form={account} />
        <Button icon="check" label="Save account" loading={savingAccount} onPress={saveAccount} style={{ marginTop: 20 }} />
      </Card>

      <Card title="Change password" subheader="At least 6 characters." icon="lock-reset">
        <FormFields fields={PASSWORD_FIELDS} form={password} />
        <Button icon="lock-check-outline" label="Change password" loading={savingPassword} onPress={savePassword} style={{ marginTop: 20 }} />
      </Card>
    </Screen>
  );
}
