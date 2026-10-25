import type { Href } from 'expo-router';
import type { TileKey } from '@/theme';
import type { Message, Section, Summary, Settings } from '@/lib/types';

import { router } from 'expo-router';
import { View, Linking, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { useAuth } from '@/lib/auth';
import { neu, useAppTheme } from '@/theme';
import { SECTION_LABELS } from '@/lib/options';
import { revalidate, useResource } from '@/lib/store';
import { endpoints as api, websiteUrl, getServerUrl } from '@/lib/api';
import {
  Icon,
  Card,
  Button,
  Screen,
  Divider,
  TabHeader,
  EmptyState,
  ErrorBanner,
  GradientTile,
  NeuPressable,
  ProgressRing,
  GradientAvatar,
} from '@/components/ui';

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

const today = () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const theme = useAppTheme();
  return (
    <View style={styles.sectionTitle}>
      <Text variant="titleMedium">{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            {action}
          </Text>
          <Icon source="chevron-right" size={18} color={theme.colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

/** Raised stat tile inside the hero card; presses in on touch. */
function StatTile({ label, value, href }: { label: string; value?: number; href: Href }) {
  const theme = useAppTheme();
  return (
    <NeuPressable depth={4} onPress={() => router.push(href)} style={styles.stat}>
      <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
        {value ?? '–'}
      </Text>
      <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </NeuPressable>
  );
}

const ACTIONS: { label: string; caption: string; href: Href; icon: string; tile: TileKey }[] = [
  { label: 'Edit hero', caption: 'Headline & intro', href: '/content/home', icon: 'pencil', tile: 'emerald' },
  { label: 'Add project', caption: 'Show new work', href: '/content/projects', icon: 'folder-plus', tile: 'violet' },
  { label: 'Skills', caption: 'Groups & stack', href: '/content/skills', icon: 'lightning-bolt', tile: 'amber' },
  { label: 'Experience', caption: 'Roles & companies', href: '/content/experience', icon: 'briefcase', tile: 'sky' },
  { label: 'Appearance', caption: 'Theme & fonts', href: '/configuration', icon: 'palette', tile: 'rose' },
];

// ----------------------------------------------------------------------

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

  const firstName = (user?.displayName ?? 'there').split(/\s+/)[0];
  const live = sections?.filter((s) => s.visible).length ?? 0;
  const total = sections?.length ?? 0;
  const online = settings?.siteEnabled ?? true;
  const status = theme.custom.tones[online ? 'success' : 'warning'];

  return (
    <Screen
      tab
      onRefresh={refresh}
      header={
        <TabHeader
          overline={today()}
          title={`${greeting()}, ${firstName}`}
          right={
            <Pressable onPress={() => router.push('/account')} accessibilityLabel="Account" hitSlop={6}>
              <GradientAvatar name={user?.displayName} size={48} />
            </Pressable>
          }
        />
      }
    >
      {/* Hero: website status ring + stats */}
      <View style={[styles.hero, neu(theme, 'raised', 9)]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ProgressRing progress={total ? live / total : 0} size={108} stroke={9}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {sections ? `${live}/${total}` : '–'}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: -2 }}>
              live
            </Text>
          </ProgressRing>

          <View style={{ flex: 1, gap: 6 }}>
            <View style={[styles.status, neu(theme, 'inset', 2)]}>
              <View style={[styles.dot, { backgroundColor: status.main }]} />
              <Text variant="labelSmall" style={{ color: status.fg }}>
                {online ? 'Online' : 'Maintenance'}
              </Text>
            </View>
            <Text variant="titleLarge">{online ? 'Your site is live' : 'Site is paused'}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {settings?.updatedAt ? `Settings updated ${timeAgo(settings.updatedAt)}` : 'Sections shown on your portfolio'}
            </Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <StatTile label="Projects" value={summary?.projects} href="/content/projects" />
          <StatTile label="Roles" value={summary?.experiences} href="/content/experience" />
          <StatTile label="Skills" value={summary?.skills} href="/content/skills" />
          <StatTile label="Unread" value={summary?.unread} href="/messages" />
        </View>

        <Button icon="open-in-new" label="Open website" onPress={() => Linking.openURL(websiteUrl())} style={{ marginTop: 20 }} />
      </View>

      {error && (
        <ErrorBanner
          message={`Cannot reach the API at ${getServerUrl()}. Start the backend (BACKEND → npm run dev) and pull to refresh.`}
        />
      )}

      {/* Quick actions — padded so the soft shadows aren't clipped by the scroll view */}
      <View>
        <SectionTitle title="Quick actions" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingHorizontal: 18, paddingVertical: 14 }}
          style={{ marginHorizontal: -18, marginVertical: -12 }}
        >
          {ACTIONS.map((a) => (
            <NeuPressable key={a.label} onPress={() => router.push(a.href)} style={styles.action}>
              <View style={{ gap: 14 }}>
                <GradientTile icon={a.icon} tile={a.tile} size={44} />
                <View>
                  <Text variant="titleSmall">{a.label}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {a.caption}
                  </Text>
                </View>
              </View>
            </NeuPressable>
          ))}
        </ScrollView>
      </View>

      {/* Recent messages */}
      <View>
        <SectionTitle title="Recent messages" action="Inbox" onAction={() => router.push('/messages')} />
        <Card padded={false}>
          {(messages ?? []).slice(0, 4).map((m, i) => (
            <View key={m.id}>
              {i > 0 && <Divider inset={76} />}
              <TouchableRipple onPress={() => router.push('/messages')}>
                <View style={styles.msg}>
                  <GradientAvatar name={m.name} size={44} muted={m.read} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <Text variant="titleSmall" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {m.name}
                      </Text>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {timeAgo(m.createdAt)}
                      </Text>
                    </View>
                    <Text
                      variant="bodySmall"
                      numberOfLines={1}
                      style={{ color: m.read ? theme.colors.onSurfaceVariant : theme.colors.onSurface, marginTop: 2 }}
                    >
                      {m.message}
                    </Text>
                  </View>
                  {!m.read && <View style={[styles.dot, { backgroundColor: theme.custom.tones.info.main }]} />}
                </View>
              </TouchableRipple>
            </View>
          ))}
          {messages?.length === 0 && (
            <EmptyState icon="email-open-outline" title="No messages yet" description="Contact-form messages land here." />
          )}
        </Card>
      </View>

      {/* Sections */}
      <View>
        <SectionTitle title="Website sections" action="Manage" onAction={() => router.push('/configuration')} />
        <View style={styles.sections}>
          {(sections ?? []).map((s) => {
            const tone = theme.custom.tones[s.visible ? 'success' : 'default'];
            return (
              <View key={s.key} style={[styles.sectionTile, neu(theme, s.visible ? 'raised' : 'inset', 4)]}>
                <Icon source={s.visible ? 'check-circle' : 'eye-off-outline'} size={20} color={tone.main} />
                <Text variant="labelLarge" numberOfLines={1} style={{ marginTop: 8 }}>
                  {SECTION_LABELS[s.key].replace(' (hero)', '')}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {s.visible ? (s.showInNav ? 'Live · in menu' : 'Live') : 'Hidden'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, borderRadius: 30 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  stat: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 16 },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  action: { width: 150, padding: 16, borderRadius: 22 },
  msg: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  sections: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  sectionTile: { flexBasis: '30%', flexGrow: 1, padding: 14, borderRadius: 18 },
});
