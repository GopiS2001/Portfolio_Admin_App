import type { TileKey } from '@/theme';
import type { FieldDef } from '@/components/fields';
import type { Section, Settings, ThemeMode } from '@/lib/types';

import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Platform, UIManager, StyleSheet, LayoutAnimation } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { useAuth } from '@/lib/auth';
import { neu, useAppTheme } from '@/theme';
import { usePreferences } from '@/lib/preferences';
import { FontSizeTracker } from '@/components/font-size-tracker';
import { DesignStylePicker, DESIGN_STYLE_OPTIONS } from '@/components/style-picker';
import { http, endpoints as api } from '@/lib/api';
import { saveSection } from '@/components/section-heading-card';
import { SANS_FONTS, SERIF_FONTS, SECTION_LABELS } from '@/lib/options';
import { setCache, revalidate, useResource, saveSingleton } from '@/lib/store';
import { FormFields, SelectField, useFieldForm } from '@/components/fields';
import {
  Icon,
  toast,
  Button,
  Screen,
  Divider,
  TabHeader,
  GlassBlur,
  Segmented,
  TapSwitch,
  IconButton,
  GradientTile,
  NeuPressable,
  ConfirmDialog,
  GradientAvatar,
  floatingFill,
  TAB_BAR_SPACE,
} from '@/components/ui';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

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

/** This app's own look (saved on the phone) — separate from the website's default theme below. */
const APP_THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

const THEMES: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Dark', icon: 'weather-night' },
  { value: 'system', label: 'Device', icon: 'cellphone' },
];

const fontOptions = (list: string[], def: string) =>
  list.map((f) => ({ value: f, label: f === def ? `${f} (default)` : f }));

// ----------------------------------------------------------------------

export default function ConfigurationScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { fontSize, setFontSize, themePreference, setThemePreference, designStyle, setDesignStyle } = usePreferences();
  const { data: settings, refresh } = useResource<Settings>(api.settings);
  const { data: sections } = useResource<Section[]>(api.sections);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

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
  const accent = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.accentLight) ? v.accentLight : theme.custom.tones.warning.fg;
  const headingSize = (Number(v.baseFontSize) * 2.25 * Number(v.headingScale)) / 100;
  const online = !!v.siteEnabled;
  const live = sections?.filter((s) => s.visible).length ?? 0;
  const blocksOn = BLOCK_FIELDS.filter((f) => v[f.name]).length;

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
    <View style={{ flex: 1 }}>
      <Screen
        tab
        onRefresh={() => Promise.all([refresh(), revalidate(api.sections)]).catch(() => undefined)}
        header={<TabHeader overline="Website" title="Settings" subtitle="Control what visitors see and how it looks." />}
      >
        {/* Status hero — the switch is part of the form, saved with the bar below */}
        <View style={[styles.hero, neu(theme, 'raised', 8)]}>
          <GlassBlur radius={26} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={[styles.heroIcon, neu(theme, 'inset', 4)]}>
              <Icon
                source={online ? 'web-check' : 'web-off'}
                size={26}
                color={theme.custom.tones[online ? 'success' : 'error'].main}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleLarge">{online ? 'Website online' : 'Maintenance mode'}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {online ? `${live} of ${sections?.length ?? 0} sections live` : 'Visitors see the maintenance message'}
              </Text>
            </View>
            <TapSwitch accessibilityLabel="Website online" value={online} onValueChange={(on) => form.set('siteEnabled', on)} />
          </View>
        </View>

        {/* Account */}
        <NeuPressable onPress={() => router.push('/account')} style={styles.account}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <GradientAvatar name={user?.displayName} size={48} />
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium">{user?.displayName ?? 'Admin'}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {user?.email} · Account & password
              </Text>
            </View>
            <Icon source="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
          </View>
        </NeuPressable>

        <Text variant="labelMedium" style={[styles.groupLabel, { color: theme.colors.onSurfaceVariant }]}>
          THIS APP
        </Text>

        {/* Saved on this phone only and applied immediately — no Save needed */}
        <Group
          icon="cellphone-cog"
          tile="violet"
          title="App preferences"
          summary={`${DESIGN_STYLE_OPTIONS.find((s) => s.value === designStyle)?.label} · ${APP_THEMES.find((t) => t.value === themePreference)?.label} · ${fontSize} px`}
          defaultOpen
        >
          <View style={{ gap: 22 }}>
            <View>
              <Text variant="titleSmall">Design style</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                Changes the look of every screen right away
              </Text>
              <DesignStylePicker value={designStyle} onChange={setDesignStyle} />
            </View>
            <Divider />
            <View>
              <Text variant="titleSmall">Theme</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 10 }}>
                System default follows your phone&apos;s dark mode setting
              </Text>
              {/* Labels only: with icons, three options don't fit "System" on a phone */}
              <Segmented value={themePreference} onChange={setThemePreference} options={APP_THEMES} />
            </View>
            <Divider />
            <FontSizeTracker value={fontSize} onChange={setFontSize} />
          </View>
        </Group>

        <Text variant="labelMedium" style={[styles.groupLabel, { color: theme.colors.onSurfaceVariant }]}>
          WEBSITE
        </Text>

        <Group icon="format-list-bulleted" tile="emerald" title="Sections & menu" summary={`${live} live · changes apply instantly`}>
          <SectionsList />
        </Group>

        <Group icon="information-outline" tile="sky" title="Site details" summary={v.siteTitle || 'Title, SEO & maintenance'}>
          <FormFields fields={SITE_FIELDS.filter((f) => f.name !== 'siteEnabled')} form={form} />
        </Group>

        <Group icon="page-layout-header" tile="violet" title="Top header" summary={v.showHeader ? `Shown · button “${v.headerCtaLabel || '—'}”` : 'Hidden'}>
          <FormFields fields={HEADER_FIELDS} form={form} />
        </Group>

        <Group icon="view-dashboard-outline" tile="amber" title="Blocks" summary={`${blocksOn} of ${BLOCK_FIELDS.length} switched on`}>
          <FormFields fields={BLOCK_FIELDS} form={form} />
        </Group>

        <Text variant="labelMedium" style={[styles.groupLabel, { color: theme.colors.onSurfaceVariant }]}>
          LOOK & FEEL
        </Text>

        <Group
          icon="theme-light-dark"
          tile="rose"
          title="Appearance"
          summary={`${THEMES.find((t) => t.value === v.defaultTheme)?.label ?? 'Device'} theme · ${v.enableThemeToggle ? 'toggle on' : 'toggle off'}`}
        >
          <View style={{ gap: 16 }}>
            <FormFields fields={THEME_FIELDS.slice(0, 1)} form={form} />
            <View>
              <Text variant="titleSmall" style={{ marginBottom: 10 }}>
                Default theme
              </Text>
              <Segmented<ThemeMode> value={v.defaultTheme} onChange={(t) => form.set('defaultTheme', t)} options={THEMES} />
            </View>
            <FormFields fields={THEME_FIELDS.slice(1)} form={form} />
          </View>
        </Group>

        <Group icon="format-font" tile="teal" title="Typography" summary={`${v.fontSans} · ${v.fontSerif}`}>
          <View style={{ gap: 16 }}>
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
            <Stepper label="Base font size" value={Number(v.baseFontSize)} min={12} max={22} unit="px" onChange={(n) => form.set('baseFontSize', n)} />
            <Stepper label="Heading size" value={Number(v.headingScale)} min={70} max={140} step={5} unit="%" onChange={(n) => form.set('headingScale', n)} />

            <View style={[styles.preview, neu(theme, 'inset', 5), { borderLeftColor: accent }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1.5 }}>
                PREVIEW
              </Text>
              <Text style={{ fontFamily: 'serif', fontSize: headingSize, lineHeight: headingSize * 1.15, color: theme.colors.onSurface, marginVertical: 8 }}>
                Crafting <Text style={{ fontFamily: 'serif', fontStyle: 'italic', color: accent }}>digital experiences</Text>
              </Text>
              <Text style={{ fontSize: Number(v.baseFontSize), color: theme.colors.onSurfaceVariant }}>
                I design and build fast, accessible, beautifully crafted web products.
              </Text>
            </View>
          </View>
        </Group>

        <Text variant="labelMedium" style={[styles.groupLabel, { color: theme.colors.onSurfaceVariant }]}>
          DATA
        </Text>

        <Group icon="cloud-download-outline" tile="slate" title="Offline copy" summary="Snapshot used when the server is down">
          <SnapshotPanel updatedAt={settings?.updatedAt} />
        </Group>

        <Button variant="soft" tone="error" icon="logout" label="Sign out" onPress={() => setConfirmSignOut(true)} style={{ marginTop: 8 }} />
        <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          Portfolio Admin · v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
        {form.isDirty && <View style={{ height: 64 }} />}
      </Screen>

      {form.isDirty && (
        <View
          style={[
            styles.saveBar,
            neu(theme, 'raised', 8),
            { backgroundColor: floatingFill(theme), bottom: Math.max(insets.bottom, 10) + TAB_BAR_SPACE - 24 },
          ]}
        >
          <GlassBlur radius={22} intensity={60} />
          <Icon source="pencil-circle" size={22} color={theme.colors.primary} />
          <Text variant="labelLarge" style={{ flex: 1 }}>
            Unsaved changes
          </Text>
          <Button size="small" variant="text" tone="default" label="Discard" onPress={form.reset} disabled={saving} />
          <Button size="small" icon="check" label="Save" loading={saving} onPress={save} />
        </View>
      )}

      <ConfirmDialog
        visible={confirmSignOut}
        title="Sign out?"
        content="You will need your email and password to sign in again."
        confirmLabel="Sign out"
        icon="logout"
        onConfirm={signOut}
        onDismiss={() => setConfirmSignOut(false)}
      />
    </View>
  );
}

// ----------------------------------------------------------------------

/** Collapsible raised settings group: icon tile, title, live summary, chevron. */
function Group({
  icon,
  tile,
  title,
  summary,
  defaultOpen,
  children,
}: {
  icon: string;
  tile: TileKey;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(!!defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <View style={[styles.group, neu(theme, 'raised', open ? 7 : 6)]}>
      <GlassBlur radius={24} />
      <View style={{ borderRadius: 24, overflow: 'hidden' }}>
        <TouchableRipple onPress={toggle}>
          <View style={styles.groupHeader}>
            <GradientTile icon={icon} tile={tile} size={42} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="titleMedium">{title}</Text>
              {summary && (
                <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                  {summary}
                </Text>
              )}
            </View>
            <View style={[styles.chevron, neu(theme, open ? 'inset' : 'raised', 3), { transform: [{ rotate: open ? '180deg' : '0deg' }] }]}>
              <Icon source="chevron-down" size={20} color={open ? theme.colors.primary : theme.colors.onSurfaceVariant} />
            </View>
          </View>
        </TouchableRipple>
        {open && (
          <>
            <Divider />
            <View style={{ padding: 18 }}>{children}</View>
          </>
        )}
      </View>
    </View>
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
  const theme = useAppTheme();
  return (
    <View style={[styles.stepper, neu(theme, 'raised', 4)]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="titleSmall">{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IconButton
            tonal
            icon="minus"
            label={`Decrease ${label}`}
            size={18}
            disabled={value <= min}
            onPress={() => onChange(Math.max(min, value - step))}
          />
          <Text variant="titleMedium" style={{ minWidth: 56, textAlign: 'center', color: theme.colors.primary }}>
            {value}
            {unit}
          </Text>
          <IconButton
            tonal
            icon="plus"
            label={`Increase ${label}`}
            size={18}
            disabled={value >= max}
            onPress={() => onChange(Math.min(max, value + step))}
          />
        </View>
      </View>
      {/* Engraved groove with the filled part */}
      <View style={[styles.groove, neu(theme, 'inset', 2)]}>
        <View
          style={{
            width: `${Math.max(0, Math.min(1, (value - min) / (max - min))) * 100}%`,
            height: '100%',
            borderRadius: 4,
            backgroundColor: theme.colors.primary,
          }}
        />
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------

/** One row per website section: on/off, in-menu, order. Saves immediately. */
function SectionsList() {
  const theme = useAppTheme();
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

  return (
    <View style={{ gap: 14 }}>
      {sections.map((s, i) => (
        <View key={s.key} style={[styles.sectionRow, neu(theme, s.visible ? 'raised' : 'inset', 4)]}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <IconButton icon="chevron-up" label="Move up" size={18} disabled={i === 0} onPress={() => move(i, -1)} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {i + 1}
            </Text>
            <IconButton icon="chevron-down" label="Move down" size={18} disabled={i === sections.length - 1} onPress={() => move(i, 1)} />
          </View>
          <View style={{ flex: 1, minWidth: 0, opacity: s.visible ? 1 : 0.6 }}>
            <Text variant="titleSmall">{SECTION_LABELS[s.key]}</Text>
            <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
              Menu label: {s.navLabel || '—'}
            </Text>
          </View>
          <View style={{ gap: 10 }}>
            <View style={styles.switchLine}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Site
              </Text>
              <TapSwitch value={s.visible} onValueChange={() => toggle(s, 'visible')} accessibilityLabel={`Show ${SECTION_LABELS[s.key]} on the website`} />
            </View>
            <View style={styles.switchLine}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Menu
              </Text>
              <TapSwitch value={s.showInNav} disabled={!s.visible} onValueChange={() => toggle(s, 'showInNav')} accessibilityLabel={`Show ${SECTION_LABELS[s.key]} in the menu`} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ----------------------------------------------------------------------

function SnapshotPanel({ updatedAt }: { updatedAt?: string }) {
  const theme = useAppTheme();
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
    <View style={{ gap: 12 }}>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Every save also writes a static snapshot of the whole site. If the backend or MySQL stops, the website
        keeps showing exactly this data.
      </Text>
      <Button variant="soft" icon="refresh" label="Rebuild now" loading={busy} onPress={rebuild} />
      {updatedAt && (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          Settings last changed {new Date(updatedAt).toLocaleString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 18, borderRadius: 26 },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  account: { padding: 16, borderRadius: 22 },
  groupLabel: { letterSpacing: 1.2, paddingHorizontal: 6, marginTop: 6, marginBottom: -6 },
  group: { borderRadius: 24 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  chevron: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  preview: { padding: 18, borderRadius: 18, borderLeftWidth: 3 },
  stepper: { padding: 14, borderRadius: 18 },
  groove: { height: 8, borderRadius: 4, marginTop: 12, padding: 1.5, overflow: 'hidden' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 10, paddingRight: 14 },
  switchLine: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  saveBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 22,
  },
});
