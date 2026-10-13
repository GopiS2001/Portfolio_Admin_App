import type { Href } from 'expo-router';
import type { TileKey } from '@/theme';
import type { Message, Section, Summary, Settings } from '@/lib/types';

import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Linking, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Text, TouchableRipple, Button as PaperButton } from 'react-native-paper';

import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/theme';
import { SECTION_LABELS } from '@/lib/options';
import { revalidate, useResource } from '@/lib/store';
import { endpoints as api, websiteUrl, getServerUrl } from '@/lib/api';
import {
  Icon,
  Card,
  Screen,
  Divider,
  TabHeader,
  EmptyState,
  ErrorBanner,
  GradientTile,
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

/** Translucent stat tile inside the hero card. */
function GlassStat({ label, value, href }: { label: string; value?: number; href: Href }) {
  return (
    <Pressable onPress={() => router.push(href)} style={({ pressed }) => [styles.glass, pressed && { opacity: 0.75 }]}>
      <Text variant="titleLarge" style={{ color: '#FFFFFF' }}>
        {value ?? '–'}
      </Text>
      <Text variant="labelSmall" numberOfLines={1} style={{ color: 'rgba(255,255,255,0.72)' }}>
        {label}
      </Text>
    </Pressable>
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
              <GradientAvatar name={user?.displayName} size={46} />
            </Pressable>
          }
        />
      }
    >
      {/* Hero: website status ring + glass stats */}
      <View style={[styles.heroShadow, { shadowColor: theme.custom.gradient[1] }]}>
        <LinearGradient colors={theme.custom.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.glow} />
          <View style={styles.glowSmall} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <ProgressRing progress={total ? live / total : 0} size={100} stroke={10}>
              <Text variant="headlineSmall" style={{ color: '#FFFFFF' }}>
                {sections ? `${live}/${total}` : '–'}
              </Text>
              <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.7)', marginTop: -2 }}>
                live
              </Text>
            </ProgressRing>

            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.status}>
                <View style={[styles.dot, { backgroundColor: online ? '#5BE49B' : '#FFAC82' }]} />
                <Text variant="labelSmall" style={{ color: '#FFFFFF' }}>
                  {online ? 'Online' : 'Maintenance'}
                </Text>
              </View>
              <Text variant="titleLarge" style={{ color: '#FFFFFF' }}>
                {online ? 'Your site is live' : 'Site is paused'}
              </Text>
              <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {settings?.updatedAt ? `Settings updated ${timeAgo(settings.updatedAt)}` : 'Sections shown on your portfolio'}
              </Text>
            </View>
          </View>

          <View style={styles.glassRow}>
            <GlassStat label="Projects" value={summary?.projects} href="/content/projects" />
            <GlassStat label="Roles" value={summary?.experiences} href="/content/experience" />
            <GlassStat label="Skills" value={summary?.skills} href="/content/skills" />
            <GlassStat label="Unread" value={summary?.unread} href="/messages" />
          </View>

          <PaperButton
            mode="contained"
            icon="open-in-new"
            buttonColor="#FFFFFF"
            textColor={theme.custom.gradient[1]}
            onPress={() => Linking.openURL(websiteUrl())}
            style={{ marginTop: 16, borderRadius: 14 }}
            contentStyle={{ height: 46 }}
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

      {/* Quick actions */}
      <View>
        <SectionTitle title="Quick actions" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 2, paddingVertical: 4 }}
          style={{ marginHorizontal: -16, paddingHorizontal: 14 }}
        >
          {ACTIONS.map((a) => (
            <TouchableRipple
              key={a.label}
              onPress={() => router.push(a.href)}
              borderless
              style={[
                styles.action,
                { backgroundColor: theme.colors.surface, borderColor: theme.custom.divider },
              ]}
            >
              <View style={{ gap: 12 }}>
                <GradientTile icon={a.icon} tile={a.tile} size={42} />
                <View>
                  <Text variant="titleSmall">{a.label}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {a.caption}
                  </Text>
                </View>
              </View>
            </TouchableRipple>
          ))}
          <View style={{ width: 18 }} />
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
              <View
                key={s.key}
                style={[styles.sectionTile, { backgroundColor: theme.colors.surface, borderColor: theme.custom.divider }]}
              >
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
  heroShadow: {
    borderRadius: 30,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  hero: { padding: 20, borderRadius: 30, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    right: -80,
    top: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glowSmall: {
    position: 'absolute',
    left: -40,
    bottom: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  glassRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  glass: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  action: { width: 150, padding: 16, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth },
  msg: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  sections: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionTile: { flexBasis: '31%', flexGrow: 1, padding: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
});
