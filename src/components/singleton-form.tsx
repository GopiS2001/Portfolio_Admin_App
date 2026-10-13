import type { FieldDef } from './fields';

import { useState } from 'react';
import { View } from 'react-native';

import { useResource, saveSingleton } from '@/lib/store';

import { FormFields, useFieldForm } from './fields';
import { Card, toast, Button, Loading } from './ui';

// ----------------------------------------------------------------------

/** Edits a subset of a singleton record (e.g. the hero fields of the profile). Only the listed fields are sent. */
export function SingletonForm<T extends Record<string, any>>({
  url,
  title,
  subheader,
  fields,
}: {
  url: string;
  title: string;
  subheader?: string;
  fields: FieldDef[];
}) {
  const { data, isLoading } = useResource<T>(url);
  const form = useFieldForm(fields, data);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.validate()) return;
    setSaving(true);
    try {
      await saveSingleton<T>(url, form.body() as Partial<T>);
      toast.success('Saved — the website is updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title={title} subheader={subheader}>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <FormFields fields={fields} form={form} />
          <SaveBar dirty={form.isDirty} saving={saving} onDiscard={form.reset} onSave={save} />
        </>
      )}
    </Card>
  );
}

export function SaveBar({
  dirty,
  saving,
  onDiscard,
  onSave,
  label = 'Save changes',
}: {
  dirty: boolean;
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void;
  label?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
      <Button variant="outlined" tone="default" label="Discard" disabled={!dirty || saving} onPress={onDiscard} />
      <Button label={label} disabled={!dirty} loading={saving} onPress={onSave} />
    </View>
  );
}
