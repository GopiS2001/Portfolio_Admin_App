import type { FieldDef } from '@/components/fields';

import { useState } from 'react';
import { router } from 'expo-router';

import { http, endpoints as api } from '@/lib/api';
import { Card, toast, Button, Screen } from '@/components/ui';
import { FormFields, useFieldForm } from '@/components/fields';

// ----------------------------------------------------------------------

const PASSWORD_FIELDS: FieldDef[] = [
  { name: 'newPassword', label: 'New password', type: 'password', required: true },
  { name: 'confirmPassword', label: 'Confirm new password', type: 'password', required: true },
];

export default function UpdatePasswordScreen() {
  const password = useFieldForm(PASSWORD_FIELDS, null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!password.validate()) return;
    const { newPassword, confirmPassword } = password.values;
    if (newPassword.length < 6) return toast.error('New password needs at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      await http.put(api.password, { newPassword });
      password.reset();
      toast.success('Password updated');
      if (router.canGoBack()) router.back();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card title="New password" subheader="At least 6 characters. Other devices will be signed out." icon="lock-reset">
        <FormFields fields={PASSWORD_FIELDS} form={password} />
        <Button icon="lock-check-outline" label="Update password" loading={saving} onPress={save} style={{ marginTop: 20 }} />
      </Card>
    </Screen>
  );
}
