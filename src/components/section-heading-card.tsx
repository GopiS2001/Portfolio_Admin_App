import type { FieldDef } from './fields';
import type { Section, SectionKey } from '@/lib/types';

import { useState } from 'react';
import { View, Text } from 'react-native';

import { colors } from '@/theme';
import { http, endpoints } from '@/lib/api';
import { revalidate, useResource } from '@/lib/store';

import { SaveBar } from './singleton-form';
import { Card, toast, Label } from './ui';
import { FormFields, useFieldForm } from './fields';

// ----------------------------------------------------------------------

const FIELDS: FieldDef[] = [
  { name: 'visible', label: 'Show this section on the website', type: 'switch' },
  { name: 'showInNav', label: 'Show in the top navigation', type: 'switch' },
  { name: 'navLabel', label: 'Navigation label' },
  { name: 'eyebrow', label: 'Small label above the heading' },
  { name: 'title', label: 'Heading', placeholder: 'Projects I’m' },
  { name: 'highlight', label: 'Highlighted (italic) words', placeholder: 'proud of' },
  { name: 'titleSuffix', label: 'Text after highlight', placeholder: '.' },
];

const HOME_FIELDS = FIELDS.filter((f) => ['visible', 'showInNav', 'navLabel'].includes(f.name));

export async function saveSection(key: SectionKey, body: Partial<Section>) {
  await http.put(`${endpoints.sections}/${key}`, body);
  await revalidate(endpoints.sections);
}

/** On/off toggle, nav label and heading copy for one website section. */
export function SectionHeadingCard({ sectionKey }: { sectionKey: SectionKey }) {
  const { data } = useResource<Section[]>(endpoints.sections);
  const section = data?.find((s) => s.key === sectionKey);
  const fields = sectionKey === 'home' ? HOME_FIELDS : FIELDS;
  const form = useFieldForm(fields, section);
  const [saving, setSaving] = useState(false);
  const v = form.values;

  const save = async () => {
    setSaving(true);
    try {
      await saveSection(sectionKey, form.body() as Partial<Section>);
      toast.success('Section saved — the website is updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Section settings"
      subheader="Turn the whole section on or off and edit its heading."
      action={
        section && (
          <Label tone={section.visible ? 'success' : 'default'}>
            {section.visible ? 'Live' : 'Hidden'}
          </Label>
        )
      }
    >
      <FormFields fields={fields} form={form} />

      {sectionKey !== 'home' && (
        <View style={{ marginTop: 20, padding: 16, borderRadius: 12, backgroundColor: colors.neutral }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textDisabled, letterSpacing: 1 }}>
            PREVIEW
          </Text>
          {!!v.eyebrow && (
            <Text style={{ fontSize: 12, color: colors.warningDark, letterSpacing: 2, marginTop: 6 }}>
              {String(v.eyebrow).toUpperCase()}
            </Text>
          )}
          <Text style={{ fontSize: 26, fontFamily: 'serif', color: colors.text, marginTop: 4 }}>
            {v.title}{' '}
            <Text style={{ fontStyle: 'italic', color: colors.warningDark }}>{v.highlight}</Text>
            {v.titleSuffix}
          </Text>
        </View>
      )}

      <SaveBar dirty={form.isDirty} saving={saving} onDiscard={form.reset} onSave={save} label="Save section" />
    </Card>
  );
}
