import type { Href } from 'expo-router';
import type { IconName } from '@/components/ui';
import type { Section } from '@/lib/types';

import { router } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme';
import { useAuth } from '@/lib/auth';
import { endpoints } from '@/lib/api';
import { useResource } from '@/lib/store';
import { Icon, Card, Label, Button, Screen, Divider } from '@/components/ui';

// ----------------------------------------------------------------------

const PAGES: { key: Section['key']; title: string; text: string; icon: IconName; href: Href }[] = [
  { key: 'home', title: 'Home', text: 'Name, headline, intro, résumé, photo, stats', icon: 'home-outline', href: '/content/home' },
  { key: 'about', title: 'About', text: 'Paragraphs and highlight cards', icon: 'person-outline', href: '/content/about' },
  { key: 'skills', title: 'Skills', text: 'Skill groups and the technology strip', icon: 'flask-outline', href: '/content/skills' },
  { key: 'experience', title: 'Experience', text: 'Roles, companies, periods, tech stack', icon: 'briefcase-outline', href: '/content/experience' },
  { key: 'projects', title: 'Projects', text: 'Projects, links, covers, APKs', icon: 'folder-outline', href: '/content/projects' },
  { key: 'contact', title: 'Contact', text: 'Email, phone, socials, footer', icon: 'chatbubbles-outline', href: '/content/contact' },
];

function Row({ icon, title, text, right, onPress }: { icon: IconName; title: string; text?: string; right?: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.neutral }]}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {text && <Text style={styles.rowText}>{text}</Text>}
      </View>
      {right}
      <Icon name="chevron-forward" size={18} color={colors.textDisabled} />
    </Pressable>
  );
}

export default function ContentScreen() {
  const { user, signOut } = useAuth();
  const { data: sections, refresh } = useResource<Section[]>(endpoints.sections);

  return (
    <Screen onRefresh={refresh}>
      <Card title="Website content" subheader="Everything the public portfolio shows." padded={false}>
        {PAGES.map((p, i) => {
          const section = sections?.find((s) => s.key === p.key);
          return (
            <View key={p.key}>
              {i > 0 && <Divider dashed />}
              <Row
                icon={p.icon}
                title={p.title}
                text={p.text}
                onPress={() => router.push(p.href)}
                right={section && !section.visible ? <Label>Hidden</Label> : null}
              />
            </View>
          );
        })}
      </Card>

      <Card title="Manage" padded={false}>
        <Row icon="lock-closed-outline" title="Account" text={user?.email} onPress={() => router.push('/account')} />
      </Card>

      <Button variant="soft" tone="error" icon="log-out-outline" label="Sign out" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowText: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
