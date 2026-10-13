import type { Tone } from '@/theme';
import type { Href } from 'expo-router';
import type { Message, Section, Summary, Settings } from '@/lib/types';

import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Linking, StyleSheet } from 'react-native';
import { Text, Avatar, TouchableRipple } from 'react-native-paper';

import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/theme';
import { SECTION_LABELS } from '@/lib/options';
import { revalidate, useResource } from '@/lib/store';
import { endpoints as api, websiteUrl, getServerUrl } from '@/lib/api';
import { Icon, Card, Label, Button, Screen, Divider, IconTile, ErrorBanner } from '@/components/ui';

// ----------------------------------------------------------------------

function timeAgo(date: string) {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const units: [number, string][] = [
    [60, 'min'],
    [3600, 'hour'],
    [86400, 'day'],
    [2592000, 'month'],
    [31536000, 'year'],
  ];
  let [div, name] = units[0];
  for (const u of units) if (s >= u[0]) [div, name] = u;
  const n = Math.floor(s / div);
  return `${n} ${name}${n > 1 ? 's' : ''} ago`;
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

function StatCard({
  title,
  value,
  icon,
  tone,
  href,
}: {
  title: string;
  value?: number;
  icon: string;
  tone: Tone;
  href: Href;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.statWrap, { shadowColor: theme.custom.cardShadow }]}>
      <TouchableRipple
        onPress={() => router.push(href)}
        borderless
        style={[styles.stat, { backgroundColor: theme.colors.surface, borderColor: theme.custom.divider }]}
      >
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <IconTile icon={icon} tone={tone} size={42} />
            <Icon source="arrow-top-right" size={18} color={theme.colors.onSurfaceVariant} />
          </View>
          <Text variant="headlineLarge" style={{ marginTop: 14 }}>
            {value ?? '–'}
          </Text>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {title}
          </Text>
        </View>
      </TouchableRipple>
    </View>
  );
}

export default function OverviewScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { data: summary, error } = useResource<Summary>(api.summary);
  const { data: settings } = useResource<Settings>(api.settings);
  const { data: sections } = useResource<Section[]>(api.sections);
  const { data: messages } = useResource<Message[]>(api.messages);

  const refresh = () =>
    Promise.all([api.summary, api.settings, api.sections, api.messages].map((u) => revalidate(u))).catch(
      () => undefined
    );

  const shortcuts: { label: string; href: Href; icon: string; tone: Tone }[] = [
    { label: 'Edit hero', href: '/content/home', icon: 'pencil-outline', tone: 'primary' },
    { label: 'Add project', href: '/content/projects', icon: 'folder-plus-outline', tone: 'info' },
    { label: 'Update skills', href: '/content/skills', icon: 'lightning-bolt-outline', tone: 'warning' },
    { label: 'Configuration', href: '/configuration', icon: 'cog-outline', tone: 'success' },
  ];

  const name = user?.displayName ?? 'Admin';
  const live = sections?.filter((s) => s.visible).length ?? 0;

  return (
    <Screen onRefresh={refresh}>
      <View style={[styles.heroShadow, { shadowColor: theme.custom.gradient[1] }]}>
        <LinearGradient colors={theme.custom.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.glow} />
          <View style={styles.glowSmall} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar.Text
              size={46}
              label={initials(name)}
              style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
              labelStyle={{ color: '#FFFFFF', fontFamily: theme.fonts.titleMedium.fontFamily }}
            />
            <View style={{ flex: 1 }}>
              <Text variant="labelMedium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {greeting()}
              </Text>
              <Text variant="titleLarge" style={{ color: '#FFFFFF' }} numberOfLines={1}>
                {name}
              </Text>
            </View>
            {settings && (
              <View style={[styles.status, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: settings.siteEnabled ? '#5BE49B' : '#FFAC82' },
                  ]}
                />
                <Text variant="labelSmall" style={{ color: '#FFFFFF' }}>
                  {settings.siteEnabled ? 'Online' : 'Maintenance'}
                </Text>
              </View>
            )}
          </View>

          <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 18 }}>
            Everything you change here goes live on your portfolio immediately — and is kept as an offline
            copy, so the website keeps working even if the server stops.
          </Text>

          <PaperButton
            mode="contained"
            icon="open-in-new"
            buttonColor="#FFFFFF"
            textColor={theme.custom.gradient[1]}
            onPress={() => Linking.openURL(websiteUrl())}
            style={{ alignSelf: 'flex-start', marginTop: 18, borderRadius: 12 }}
            contentStyle={{ height: 44 }}
          >
            Open website
          </PaperButton>
        </LinearGradient>
      </View>

      {error && (
        <ErrorBanner
          message={`Cannot reach the API at ${getServerUrl()}. Start the backend (BACKEND → npm run dev) and pull to refresh.`}
        />
      )}

      <View style={styles.grid}>
        <StatCard title="Projects" value={summary?.projects} icon="folder-star-outline" tone="primary" href="/content/projects" />
        <StatCard title="Experiences" value={summary?.experiences} icon="briefcase-outline" tone="info" href="/content/experience" />
        <StatCard title="Skills" value={summary?.skills} icon="lightning-bolt-outline" tone="warning" href="/content/skills" />
        <StatCard title="Unread messages" value={summary?.unread} icon="email-alert-outline" tone="error" href="/messages" />
      </View>

      <Card
        title="Latest messages"
        icon="inbox-outline"
        padded={false}
        action={<Button size="small" variant="text" label="View all" onPress={() => router.push('/messages')} />}
      >
        {(messages ?? []).slice(0, 5).map((m, i) => (
          <View key={m.id}>
            {i > 0 && <Divider inset={72} />}
            <TouchableRipple onPress={() => router.push('/messages')}>
              <View style={styles.msg}>
                <Avatar.Text
                  size={40}
                  label={initials(m.name) || '?'}
                  style={{ backgroundColor: theme.custom.tones[m.read ? 'default' : 'info'].bg }}
                  labelStyle={{ color: theme.custom.tones[m.read ? 'default' : 'info'].fg, fontSize: 15, fontFamily: theme.fonts.titleSmall.fontFamily }}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <Text variant="titleSmall" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {m.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {timeAgo(m.createdAt)}
                    </Text>
                  </View>
                  <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {m.message}
                  </Text>
                </View>
                {!m.read && <View style={[styles.dot, { backgroundColor: theme.custom.tones.info.main }]} />}
              </View>
            </TouchableRipple>
          </View>
        ))}
        {messages?.length === 0 && (
          <Text variant="bodyMedium" style={{ padding: 18, color: theme.colors.onSurfaceVariant }}>
            No messages yet.
          </Text>
        )}
      </Card>

      <Card
        title="Sections on the website"
        subheader={sections ? `${live} of ${sections.length} live` : undefined}
        icon="view-grid-outline"
        action={<Button size="small" variant="text" label="Manage" onPress={() => router.push('/configuration')} />}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(sections ?? []).map((s) => (
            <Label key={s.key} tone={s.visible ? 'success' : 'default'} icon={s.visible ? 'check-circle' : 'eye-off-outline'}>
              {SECTION_LABELS[s.key]}
            </Label>
          ))}
        </View>
      </Card>

      <Card title="Shortcuts" icon="lightning-bolt-outline" padded={false}>
        <View style={styles.shortcuts}>
          {shortcuts.map((s) => (
            <TouchableRipple
              key={s.label}
              onPress={() => router.push(s.href)}
              borderless
              style={[styles.shortcut, { backgroundColor: theme.custom.neutral }]}
            >
              <View style={{ alignItems: 'flex-start', gap: 10 }}>
                <IconTile icon={s.icon} tone={s.tone} size={36} />
                <Text variant="labelLarge">{s.label}</Text>
              </View>
            </TouchableRipple>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroShadow: {
    borderRadius: 28,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  hero: { padding: 20, borderRadius: 28, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    right: -70,
    top: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glowSmall: {
    position: 'absolute',
    left: -30,
    bottom: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 28, borderRadius: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statWrap: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 20,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  stat: { padding: 16, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  msg: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 12 },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14 },
  shortcut: { flexBasis: '47%', flexGrow: 1, borderRadius: 16, padding: 14 },
});
