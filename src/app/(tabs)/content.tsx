import type { Href } from 'expo-router';
import type { TileKey } from '@/theme';
import type { Section, Summary } from '@/lib/types';

import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Linking, Pressable, StyleSheet } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { revalidate, useResource } from '@/lib/store';
import { endpoints as api, websiteUrl } from '@/lib/api';
import { Icon, Screen, TabHeader, GradientTile } from '@/components/ui';

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

function StatusDot({ visible }: { visible?: boolean }) {
  const theme = useAppTheme();
  if (visible === undefined) return null;
  const tone = theme.custom.tones[visible ? 'success' : 'default'];
  return (
    <View style={[styles.statusDot, { backgroundColor: tone.bg }]}>
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
      <Pressable onPress={() => router.push('/content/projects')} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
        <View style={[styles.featureShadow, { shadowColor: '#5B21B6' }]}>
          <LinearGradient colors={['#2E1065', '#5B21B6', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.feature}>
            <View style={styles.glow} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={styles.featureIcon}>
                <Icon source="folder-star" size={26} color="#FFFFFF" />
              </View>
              {visible('projects') !== undefined && (
                <View style={styles.featurePill}>
                  <View style={[styles.dot, { backgroundColor: visible('projects') ? '#5BE49B' : '#FFAC82' }]} />
                  <Text variant="labelSmall" style={{ color: '#FFFFFF' }}>
                    {visible('projects') ? 'Live' : 'Hidden'}
                  </Text>
                </View>
              )}
            </View>
            <Text variant="labelMedium" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 22, letterSpacing: 0.6 }}>
              FEATURED
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <Text variant="headlineMedium" style={{ color: '#FFFFFF' }}>
                  Projects
                </Text>
                <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {summary ? `${summary.projects} projects in your showcase` : 'Your showcase'}
                </Text>
              </View>
              <View style={styles.arrow}>
                <Icon source="arrow-right" size={20} color="#5B21B6" />
              </View>
            </View>
          </LinearGradient>
        </View>
      </Pressable>

      {/* Sections grid */}
      <View style={styles.grid}>
        {TILES_GRID.map((t) => (
          <TouchableRipple
            key={t.key}
            onPress={() => router.push(t.href)}
            borderless
            style={[styles.tile, { backgroundColor: theme.colors.surface, borderColor: theme.custom.divider, shadowColor: theme.custom.cardShadow }]}
          >
            <View>
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
            </View>
          </TouchableRipple>
        ))}

        {/* Preview tile */}
        <TouchableRipple
          onPress={() => Linking.openURL(websiteUrl())}
          borderless
          style={[styles.tile, styles.previewTile, { borderColor: theme.colors.outline }]}
        >
          <View style={{ alignItems: 'center', gap: 8 }}>
            <View style={[styles.previewIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon source="eye-outline" size={22} color={theme.colors.onPrimaryContainer} />
            </View>
            <Text variant="titleSmall">Preview site</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              See it as visitors do
            </Text>
          </View>
        </TouchableRipple>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  featureShadow: {
    borderRadius: 28,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  feature: { padding: 20, borderRadius: 28, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    right: -60,
    bottom: -90,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  arrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flexBasis: '46%',
    flexGrow: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  previewTile: { borderStyle: 'dashed', borderWidth: 1.5, justifyContent: 'center', elevation: 0, shadowOpacity: 0 },
  previewIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, height: 22, borderRadius: 11 },
});
