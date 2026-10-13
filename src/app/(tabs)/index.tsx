import type { Tone } from '@/theme';
import type { IconName } from '@/components/ui';
import type { Href } from 'expo-router';
import type { Message, Section, Summary, Settings } from '@/lib/types';

import { router } from 'expo-router';
import { View, Text, Linking, Pressable, StyleSheet } from 'react-native';

import { useAuth } from '@/lib/auth';
import { revalidate, useResource } from '@/lib/store';
import { SECTION_LABELS } from '@/lib/options';
import { colors, tones, radius } from '@/theme';
import { endpoints as api, websiteUrl, getServerUrl } from '@/lib/api';
import { Icon, Card, Label, Button, Screen, Divider, ErrorBanner } from '@/components/ui';

// ----------------------------------------------------------------------

function timeAgo(date: string) {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const units: [number, string][] = [
    [60, 'minute'],
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

function StatCard({
  title,
  value,
  icon,
  tone,
  href,
}: {
  title: string;
  value?: number;
  icon: IconName;
  tone: Tone;
  href: Href;
}) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.stat, pressed && { opacity: 0.8 }]}
    >
      <View style={[styles.statIcon, { backgroundColor: tones[tone].bg }]}>
        <Icon name={icon} size={24} color={tones[tone].main} />
      </View>
      <Text style={styles.statValue}>{value ?? '–'}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Pressable>
  );
}

export default function OverviewScreen() {
  const { user } = useAuth();
  const { data: summary, error } = useResource<Summary>(api.summary);
  const { data: settings } = useResource<Settings>(api.settings);
  const { data: sections } = useResource<Section[]>(api.sections);
  const { data: messages } = useResource<Message[]>(api.messages);

  const refresh = () =>
    Promise.all([api.summary, api.settings, api.sections, api.messages].map((u) => revalidate(u))).catch(
      () => undefined
    );

  const shortcuts: { label: string; href: Href; icon: IconName }[] = [
    { label: 'Edit hero', href: '/content/home', icon: 'create-outline' },
    { label: 'Add project', href: '/content/projects', icon: 'add' },
    { label: 'Update skills', href: '/content/skills', icon: 'flask-outline' },
    { label: 'Configuration', href: '/configuration', icon: 'settings-outline' },
  ];

  return (
    <Screen onRefresh={refresh}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Welcome back, {user?.displayName ?? 'admin'} 👋</Text>
        <Text style={styles.heroText}>
          Everything you change here goes live on your portfolio immediately — and is saved as an
          offline copy so the website keeps working even if the server stops.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            label="Open website"
            icon="open-outline"
            variant="outlined"
            tone="default"
            style={{ backgroundColor: colors.white }}
            onPress={() => Linking.openURL(websiteUrl())}
          />
          {settings && (
            <Label variant="filled" tone={settings.siteEnabled ? 'success' : 'error'}>
              {settings.siteEnabled ? 'Website online' : 'Website in maintenance'}
            </Label>
          )}
        </View>
      </View>

      {error && (
        <ErrorBanner
          message={`Cannot reach the API at ${getServerUrl()}. Start the backend (BACKEND → npm run dev) and pull to refresh.`}
        />
      )}

      <View style={styles.grid}>
        <StatCard title="Projects" value={summary?.projects} icon="document-text" tone="primary" href="/content/projects" />
        <StatCard title="Experiences" value={summary?.experiences} icon="briefcase" tone="info" href="/content/experience" />
        <StatCard title="Skills" value={summary?.skills} icon="flask" tone="warning" href="/content/skills" />
        <StatCard title="Unread messages" value={summary?.unread} icon="mail-unread" tone="error" href="/messages" />
      </View>

      <Card
        title="Latest messages"
        padded={false}
        action={<Button size="small" variant="text" label="View all" onPress={() => router.push('/messages')} />}
      >
        {(messages ?? []).slice(0, 5).map((m, i) => (
          <View key={m.id}>
            {i > 0 && <Divider dashed />}
            <Pressable onPress={() => router.push('/messages')} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flex: 1 }}>
                  {!m.read && <Label tone="info">New</Label>}
                  <Text style={styles.msgName} numberOfLines={1}>
                    {m.name}
                  </Text>
                </View>
                <Text style={styles.caption}>{timeAgo(m.createdAt)}</Text>
              </View>
              <Text style={styles.msgText} numberOfLines={1}>
                {m.message}
              </Text>
            </Pressable>
          </View>
        ))}
        {messages?.length === 0 && <Text style={{ padding: 16, color: colors.textSecondary }}>No messages yet.</Text>}
      </Card>

      <Card title="Sections on the website">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(sections ?? []).map((s) => (
            <Label key={s.key} tone={s.visible ? 'success' : 'default'} icon={s.visible ? 'checkmark' : 'close'}>
              {SECTION_LABELS[s.key]}
            </Label>
          ))}
        </View>
      </Card>

      <Card title="Shortcuts">
        <View style={styles.grid}>
          {shortcuts.map((s) => (
            <Button
              key={s.label}
              variant="soft"
              icon={s.icon}
              label={s.label}
              onPress={() => router.push(s.href)}
              style={{ flexBasis: '47%', flexGrow: 1, justifyContent: 'flex-start' }}
            />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDark,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.white },
  heroText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 16,
    gap: 4,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    shadowColor: '#919EAB',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  statTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  msgName: { fontSize: 15, fontWeight: '600', color: colors.text, flexShrink: 1 },
  msgText: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  caption: { fontSize: 12, color: colors.textDisabled },
});
