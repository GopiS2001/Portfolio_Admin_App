import type { Href } from 'expo-router';
import type { TileKey } from '@/theme';
import type { Section, Summary } from '@/lib/types';

import { router } from 'expo-router';
import { View, Linking, Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { neu, TILES, useAppTheme } from '@/theme';
import { revalidate, useResource } from '@/lib/store';
import { endpoints as api, websiteUrl } from '@/lib/api';
import { Icon, Screen, TabHeader, GradientTile, NeuPressable } from '@/components/ui';

// ----------------------------------------------------------------------

type Tile = { key: Section['key']; title: string; meta: (s?: Summary) => string; icon: string; tile: TileKey; href: Href };

const TILES_GRID: Tile[] = [
  { key: 'home', title: 'Home', meta: () => 'Hero, résumé & stats', icon: 'home-variant', tile: 'emerald', href: '/content/home' },
  { key: 'about', title: 'About', meta: () => 'Story & highlights', icon: 'account', tile: 'sky', href: '/content/about' },
  {
    key: 'skills',
    title: 'Skills',
    meta: (s) => (s ? `${s.skills} skills · ${s.skillGroups} groups` : 'Groups & stack'),
    icon: 'lightning-bolt',
    tile: 'amber',
    href: '/content/skills',
  },
  {
    key: 'experience',
    title: 'Experience',
    meta: (s) => (s ? `${s.experiences} role${s.experiences === 1 ? '' : 's'}` : 'Roles & companies'),
    icon: 'briefcase',
    tile: 'teal',
    href: '/content/experience',
  },
  { key: 'contact', title: 'Contact', meta: () => 'Email, phone & socials', icon: 'card-account-mail', tile: 'rose', href: '/content/contact' },
];

const FEATURE = TILES.violet[1];

function StatusDot({ visible }: { visible?: boolean }) {
  const theme = useAppTheme();
  if (visible === undefined) return null;
  const tone = theme.custom.tones[visible ? 'success' : 'default'];
  return (
    <View style={[styles.statusDot, neu(theme, 'inset', 2)]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone.main }} />
      <Text variant="labelSmall" style={{ color: tone.fg }}>
        {visible ? 'Live' : 'Hidden'}
      </Text>
    </View>
  );
}

export default function ContentScreen() {
  const theme = useAppTheme();
  const { data: sections } = useResource<Section[]>(api.sections);
  const { data: summary } = useResource<Summary>(api.summary);
  const visible = (key: Section['key']) => sections?.find((s) => s.key === key)?.visible;

  const refresh = () => Promise.all([revalidate(api.sections), revalidate(api.summary)]).catch(() => undefined);

  return (
    <Screen
      tab
      onRefresh={refresh}
      header={<TabHeader overline="Portfolio" title="Content" subtitle="Everything visitors see — tap a section to edit it." />}
    >
      {/* Featured: projects */}
      <NeuPressable depth={9} onPress={() => router.push('/content/projects')} style={styles.feature}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <GradientTile icon="folder-star" tile="violet" size={54} iconSize={26} />
          <StatusDot visible={visible('projects')} />
        </View>
        <Text variant="labelMedium" style={{ color: FEATURE, marginTop: 22, letterSpacing: 0.6 }}>
          FEATURED
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text variant="headlineMedium">Projects</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {summary ? `${summary.projects} projects in your showcase` : 'Your showcase'}
            </Text>
          </View>
          <View style={[styles.arrow, neu(theme, 'raised', 4), { backgroundColor: FEATURE }]}>
            <Icon source="arrow-right" size={20} color="#FFFFFF" />
          </View>
        </View>
      </NeuPressable>

      {/* Sections grid */}
      <View style={styles.grid}>
        {TILES_GRID.map((t) => (
          <NeuPressable key={t.key} onPress={() => router.push(t.href)} style={styles.tile}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <GradientTile icon={t.icon} tile={t.tile} size={46} />
              <StatusDot visible={visible(t.key)} />
            </View>
            <Text variant="titleMedium" style={{ marginTop: 16 }}>
              {t.title}
            </Text>
            <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
              {t.meta(summary)}
            </Text>
          </NeuPressable>
        ))}

        {/* Preview tile — pressed in, so it reads as "outside" the editable content */}
        <Pressable
          onPress={() => Linking.openURL(websiteUrl())}
          style={({ pressed }) => [styles.tile, styles.previewTile, neu(theme, 'inset', pressed ? 3 : 5)]}
        >
          <View style={{ alignItems: 'center', gap: 8 }}>
            <View style={[styles.previewIcon, neu(theme, 'raised', 4)]}>
              <Icon source="eye-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text variant="titleSmall">Preview site</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              See it as visitors do
            </Text>
          </View>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  feature: { padding: 20, borderRadius: 28 },
  arrow: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  tile: { flexBasis: '45%', flexGrow: 1, padding: 16, borderRadius: 24 },
  previewTile: { justifyContent: 'center' },
  previewIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, height: 22, borderRadius: 11 },
});
