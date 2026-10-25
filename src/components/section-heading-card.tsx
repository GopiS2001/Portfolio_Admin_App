import type { FieldDef } from './fields';
import type { Section, SectionKey } from '@/lib/types';

import { useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

import { neu, useAppTheme } from '@/theme';
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
  const theme = useAppTheme();
  const { data } = useResource<Section[]>(endpoints.sections);
  const section = data?.find((s) => s.key === sectionKey);
  const fields = sectionKey === 'home' ? HOME_FIELDS : FIELDS;
  const form = useFieldForm(fields, section);
  const [saving, setSaving] = useState(false);
  const v = form.values;
  const accent = theme.custom.tones.warning.fg;

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
      icon="tune-variant"
      action={
        section && (
          <Label tone={section.visible ? 'success' : 'default'} icon={section.visible ? 'circle' : undefined}>
            {section.visible ? 'Live' : 'Hidden'}
          </Label>
        )
      }
    >
      <FormFields fields={fields} form={form} />

      {sectionKey !== 'home' && (
        <View
          style={[
            { marginTop: 20, padding: 18, borderRadius: 18, borderLeftWidth: 3, borderLeftColor: accent },
            neu(theme, 'inset', 5),
          ]}
        >
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1.5 }}>
            PREVIEW
          </Text>
          {!!v.eyebrow && (
            <Text variant="labelMedium" style={{ color: accent, letterSpacing: 2, marginTop: 8 }}>
              {String(v.eyebrow).toUpperCase()}
            </Text>
          )}
          <Text style={{ fontSize: 28, lineHeight: 34, fontFamily: 'serif', color: theme.colors.onSurface, marginTop: 4 }}>
            {v.title}{' '}
            <Text style={{ fontFamily: 'serif', fontStyle: 'italic', color: accent }}>{v.highlight}</Text>
            {v.titleSuffix}
          </Text>
        </View>
      )}

      <SaveBar dirty={form.isDirty} saving={saving} onDiscard={form.reset} onSave={save} label="Save section" />
    </Card>
  );
}

