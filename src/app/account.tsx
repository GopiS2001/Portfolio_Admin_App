import type { FieldDef } from '@/components/fields';

import { useMemo, useState } from 'react';

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
  { name: 'currentPassword', label: 'Current password', required: true },
  { name: 'newPassword', label: 'New password', required: true },
  { name: 'confirmPassword', label: 'Confirm new password', required: true },
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
      <Card title="Admin account" subheader="Used to sign in to the dashboard and this app.">
        <FormFields fields={ACCOUNT_FIELDS} form={account} />
        <Button label="Save account" loading={savingAccount} onPress={saveAccount} style={{ marginTop: 20 }} />
      </Card>

      <Card title="Change password">
        <PasswordFields form={password} />
        <Button label="Change password" loading={savingPassword} onPress={savePassword} style={{ marginTop: 20 }} />
      </Card>
    </Screen>
  );
}

/** Same as FormFields, but with hidden text. */
function PasswordFields({ form }: { form: ReturnType<typeof useFieldForm> }) {
  return <FormFields fields={PASSWORD_FIELDS.map((f) => ({ ...f, secure: true }))} form={form} />;
}
