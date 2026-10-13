import type { FieldDef } from '@/components/fields';
import type { Section, Settings, ThemeMode } from '@/lib/types';

import { useMemo, useState } from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@/theme';
import { http, endpoints as api } from '@/lib/api';
import { saveSection } from '@/components/section-heading-card';
import { SaveBar } from '@/components/singleton-form';
import { SANS_FONTS, SERIF_FONTS, SECTION_LABELS } from '@/lib/options';
import { setCache, revalidate, useResource, saveSingleton } from '@/lib/store';
import { FormFields, FieldLabel, SelectField, useFieldForm } from '@/components/fields';
import { Card, toast, Button, Screen, Divider, IconButton, WarningBanner } from '@/components/ui';

// ----------------------------------------------------------------------

const SITE_FIELDS: FieldDef[] = [
  {
    name: 'siteEnabled',
    label: 'Website online',
    type: 'switch',
    helperText: 'Off shows a maintenance page instead of the site.',
  },
  { name: 'maintenanceMessage', label: 'Maintenance message' },
  { name: 'siteTitle', label: 'Browser tab title' },
  { name: 'metaDescription', label: 'Search description (SEO)', type: 'textarea', rows: 2 },
];

const HEADER_FIELDS: FieldDef[] = [
  { name: 'showHeader', label: 'Show top header / navigation bar', type: 'switch' },
  { name: 'showHeaderCta', label: 'Show the header button', type: 'switch' },
  { name: 'headerCtaLabel', label: 'Header button label' },
];

const THEME_FIELDS: FieldDef[] = [
  {
    name: 'enableThemeToggle',
    label: 'Dark / light mode toggle',
    type: 'switch',
    helperText: 'Off hides the sun/moon button and always uses the default theme below.',
  },
  { name: 'accentLight', label: 'Accent colour (light mode)', type: 'color' },
  { name: 'accentDark', label: 'Accent colour (dark mode)', type: 'color' },
];

const BLOCK_FIELDS: FieldDef[] = [
  { name: 'showStats', label: 'Stats row under the hero', type: 'switch' },
  { name: 'showResumeButton', label: 'Résumé button', type: 'switch' },
  { name: 'showMarquee', label: 'Scrolling technology strip', type: 'switch' },
  { name: 'showContactForm', label: 'Contact form', type: 'switch' },
  { name: 'showWhatsappButton', label: 'Floating WhatsApp button', type: 'switch' },
  { name: 'showFooter', label: 'Footer', type: 'switch' },
  { name: 'enableAnimations', label: 'Animations', type: 'switch' },
];

/** Custom controls below, declared as plain fields so the form tracks and sends them too. */
const CUSTOM_FIELDS: FieldDef[] = [
  { name: 'defaultTheme', label: 'Default theme' },
  { name: 'fontSans', label: 'Body font' },
  { name: 'fontSerif', label: 'Heading font' },
  { name: 'baseFontSize', label: 'Base font size' },
  { name: 'headingScale', label: 'Heading size' },
];

const ALL_FIELDS = [...SITE_FIELDS, ...HEADER_FIELDS, ...THEME_FIELDS, ...BLOCK_FIELDS, ...CUSTOM_FIELDS];

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Follow device' },
];

const fontOptions = (list: string[], def: string) =>
  list.map((f) => ({ value: f, label: f === def ? `${f} (default)` : f }));

// ----------------------------------------------------------------------

export default function ConfigurationScreen() {
  const { data: settings, refresh } = useResource<Settings>(api.settings);

  const source = useMemo(
    () =>
      settings && {
        ...settings,
        defaultTheme: settings.defaultTheme ?? 'system',
        fontSans: settings.fontSans ?? 'Geist',
        fontSerif: settings.fontSerif ?? 'Instrument Serif',
        baseFontSize: settings.baseFontSize ?? 16,
        headingScale: settings.headingScale ?? 100,
      },
    [settings]
  );
  const form = useFieldForm(ALL_FIELDS, source);
  const [saving, setSaving] = useState(false);
  const v = form.values;

  const save = async () => {
    setSaving(true);
    try {
      await saveSingleton<Settings>(api.settings, form.body() as Partial<Settings>);
      toast.success('Configuration saved — the website is updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      anchor=""
      onRefresh={() => Promise.all([refresh(), revalidate(api.sections)]).catch(() => undefined)}
    >
      {settings && !v.siteEnabled && (
        <WarningBanner message="The website is switched off — visitors see the maintenance message." />
      )}

      <SectionsCard />

      <Card title="Website" icon="desktop-outline">
        <FormFields fields={SITE_FIELDS} form={form} />
      </Card>

      <Card title="Top header" icon="browsers-outline">
        <FormFields fields={HEADER_FIELDS} form={form} />
      </Card>

      <Card title="Blocks" icon="apps-outline">
        <FormFields fields={BLOCK_FIELDS} form={form} />
      </Card>

      <Card title="Dark & light mode" icon="moon-outline">
        <View style={{ gap: 18 }}>
          <FormFields fields={THEME_FIELDS.slice(0, 1)} form={form} />
          <View>
            <FieldLabel label="Default theme" />
            <View style={styles.segment}>
              {THEMES.map((t) => {
                const active = v.defaultTheme === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => form.set('defaultTheme', t.value)}
                    style={[styles.segmentItem, active && styles.segmentActive]}
                  >
                    <Text style={[styles.segmentText, active && { color: colors.text }]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <FormFields fields={THEME_FIELDS.slice(1)} form={form} />
        </View>
      </Card>

      <Card title="Typography" icon="text-outline">
        <View style={{ gap: 18 }}>
          <SelectField
            field={{ label: 'Body font', options: fontOptions(SANS_FONTS, 'Geist') }}
            value={v.fontSans}
            onChange={(f) => form.set('fontSans', f)}
          />
          <SelectField
            field={{ label: 'Heading font', options: fontOptions(SERIF_FONTS, 'Instrument Serif') }}
            value={v.fontSerif}
            onChange={(f) => form.set('fontSerif', f)}
          />
          <Stepper
            label="Base font size"
            value={Number(v.baseFontSize)}
            min={12}
            max={22}
            unit="px"
            onChange={(n) => form.set('baseFontSize', n)}
          />
          <Stepper
            label="Heading size"
            value={Number(v.headingScale)}
            min={70}
            max={140}
            step={5}
            unit="%"
            onChange={(n) => form.set('headingScale', n)}
          />

          <View style={styles.preview}>
            <Text style={styles.overline}>PREVIEW</Text>
            <Text
              style={{
                fontFamily: 'serif',
                fontSize: (Number(v.baseFontSize) * 2.25 * Number(v.headingScale)) / 100,
                lineHeight: (Number(v.baseFontSize) * 2.25 * Number(v.headingScale) * 1.15) / 100,
                color: colors.text,
                marginVertical: 8,
              }}
            >
              Crafting <Text style={{ fontStyle: 'italic', color: v.accentLight || colors.warningDark }}>digital experiences</Text>
            </Text>
            <Text style={{ fontSize: Number(v.baseFontSize), color: colors.textSecondary }}>
              I design and build fast, accessible, beautifully crafted web products.
            </Text>
            <Text style={[styles.overline, { marginTop: 10, letterSpacing: 0 }]}>
              {v.fontSans} · {v.fontSerif} (shown in the system font here)
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          {form.isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
        </Text>
        <SaveBar dirty={form.isDirty} saving={saving} onDiscard={form.reset} onSave={save} label="Save configuration" />
      </Card>

      <SnapshotCard updatedAt={settings?.updatedAt} />
    </Screen>
  );
}

// ----------------------------------------------------------------------

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IconButton icon="remove-circle-outline" label={`Decrease ${label}`} color={colors.primary} size={26} disabled={value <= min} onPress={() => onChange(Math.max(min, value - step))} />
          <Text style={{ minWidth: 52, textAlign: 'center', fontSize: 15, fontWeight: '700', color: colors.primary }}>
            {value}
            {unit}
          </Text>
          <IconButton icon="add-circle-outline" label={`Increase ${label}`} color={colors.primary} size={26} disabled={value >= max} onPress={() => onChange(Math.min(max, value + step))} />
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${Math.max(0, Math.min(100, pct))}%` }]} />
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------

/** One row per website section: on/off, in-nav, order. Saves immediately. */
function SectionsCard() {
  const { data } = useResource<Section[]>(api.sections);
  const sections = data ?? [];

  const toggle = async (section: Section, field: 'visible' | 'showInNav') => {
    try {
      await saveSection(section.key, { [field]: !section[field] });
      const name = SECTION_LABELS[section.key];
      toast.success(
        field === 'visible'
          ? `${name} ${section.visible ? 'hidden' : 'shown'}`
          : `${name} ${section.showInNav ? 'removed from' : 'added to'} navigation`
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const move = async (index: number, delta: number) => {
    const keys = sections.map((s) => s.key);
    const target = index + delta;
    if (target < 0 || target >= keys.length) return;
    [keys[index], keys[target]] = [keys[target], keys[index]];
    try {
      setCache(api.sections, await http.patch<Section[]>(`${api.sections}/reorder`, { keys }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const sw = { trackColor: { true: colors.primary, false: '#C4CDD5' }, thumbColor: colors.white };

  return (
    <Card
      title="Website sections"
      subheader="Switch pages on/off, choose what appears in the top menu and set the order. Changes apply instantly."
      icon="list-outline"
      padded={false}
    >
      <View style={[styles.sectionRow, { paddingVertical: 8 }]}>
        <Text style={[styles.overline, { width: 64 }]}>ORDER</Text>
        <Text style={[styles.overline, { flex: 1 }]}>SECTION</Text>
        <Text style={[styles.overline, styles.col]}>SITE</Text>
        <Text style={[styles.overline, styles.col]}>MENU</Text>
      </View>
      {sections.map((s, i) => (
        <View key={s.key}>
          <Divider dashed />
          <View style={styles.sectionRow}>
            <View style={{ width: 64, flexDirection: 'row' }}>
              <IconButton icon="chevron-up" label="Move up" size={18} disabled={i === 0} onPress={() => move(i, -1)} />
              <IconButton icon="chevron-down" label="Move down" size={18} disabled={i === sections.length - 1} onPress={() => move(i, 1)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{SECTION_LABELS[s.key]}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Menu: {s.navLabel || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Switch value={s.visible} onValueChange={() => toggle(s, 'visible')} {...sw} />
            </View>
            <View style={styles.col}>
              <Switch value={s.showInNav} disabled={!s.visible} onValueChange={() => toggle(s, 'showInNav')} {...sw} />
            </View>
          </View>
        </View>
      ))}
    </Card>
  );
}

// ----------------------------------------------------------------------

function SnapshotCard({ updatedAt }: { updatedAt?: string }) {
  const [busy, setBusy] = useState(false);

  const rebuild = async () => {
    setBusy(true);
    try {
      await http.post(api.snapshot);
      toast.success('Offline snapshot rebuilt');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="Offline copy"
      subheader="Every save also writes a static snapshot of the whole site. If the backend or MySQL stops, the website keeps showing exactly this data."
      icon="cloud-download-outline"
    >
      <Button variant="soft" icon="refresh" label="Rebuild now" loading={busy} onPress={rebuild} />
      {updatedAt && (
        <Text style={{ fontSize: 12, color: colors.textDisabled, marginTop: 10 }}>
          Settings last changed {new Date(updatedAt).toLocaleString()}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.neutral,
    borderRadius: radius.sm,
    padding: 4,
    gap: 4,
  },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  segmentActive: {
    backgroundColor: colors.paper,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  preview: { padding: 16, borderRadius: radius.md, backgroundColor: colors.neutral },
  overline: { fontSize: 11, fontWeight: '700', color: colors.textDisabled, letterSpacing: 1 },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(0,167,111,0.16)', marginTop: 4 },
  trackFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6 },
  col: { width: 56, alignItems: 'center' },
});
