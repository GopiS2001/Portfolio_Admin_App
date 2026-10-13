import type { Tone } from '@/theme';
import type { Href } from 'expo-router';
import type { Section } from '@/lib/types';

import { useState } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, TouchableRipple } from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { useAuth } from '@/lib/auth';
import { endpoints } from '@/lib/api';
import { useResource } from '@/lib/store';
import { Icon, Card, Label, Button, Screen, Divider, IconTile, ConfirmDialog } from '@/components/ui';

// ----------------------------------------------------------------------

const PAGES: { key: Section['key']; title: string; text: string; icon: string; tone: Tone; href: Href }[] = [
  { key: 'home', title: 'Home', text: 'Name, headline, intro, résumé, photo, stats', icon: 'home-outline', tone: 'primary', href: '/content/home' },
  { key: 'about', title: 'About', text: 'Paragraphs and highlight cards', icon: 'account-outline', tone: 'info', href: '/content/about' },
  { key: 'skills', title: 'Skills', text: 'Skill groups and the technology strip', icon: 'lightning-bolt-outline', tone: 'warning', href: '/content/skills' },
  { key: 'experience', title: 'Experience', text: 'Roles, companies, periods, tech stack', icon: 'briefcase-outline', tone: 'success', href: '/content/experience' },
  { key: 'projects', title: 'Projects', text: 'Projects, links, covers, APKs', icon: 'folder-star-outline', tone: 'primary', href: '/content/projects' },
  { key: 'contact', title: 'Contact', text: 'Email, phone, socials, footer', icon: 'card-account-mail-outline', tone: 'info', href: '/content/contact' },
];

function Row({
  left,
  title,
  text,
  right,
  onPress,
}: {
  left: React.ReactNode;
  title: string;
  text?: string;
  right?: React.ReactNode;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <TouchableRipple onPress={onPress}>
      <View style={styles.row}>
        {left}
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">{title}</Text>
          {text && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {text}
            </Text>
          )}
        </View>
        {right}
        <Icon source="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
      </View>
    </TouchableRipple>
  );
}

export default function ContentScreen() {
  const theme = useAppTheme();
  const { user, signOut } = useAuth();
  const { data: sections, refresh } = useResource<Section[]>(endpoints.sections);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <Screen onRefresh={refresh}>
      <Card title="Website content" subheader="Everything the public portfolio shows." icon="web" padded={false}>
        {PAGES.map((p, i) => {
          const section = sections?.find((s) => s.key === p.key);
          return (
            <View key={p.key}>
              {i > 0 && <Divider inset={72} />}
              <Row
                left={<IconTile icon={p.icon} tone={p.tone} />}
                title={p.title}
                text={p.text}
                onPress={() => router.push(p.href)}
                right={section && !section.visible ? <Label icon="eye-off-outline">Hidden</Label> : null}
              />
            </View>
          );
        })}
      </Card>

      <Card title="Account" icon="shield-account-outline" padded={false}>
        <Row
          left={
            <Avatar.Text
              size={40}
              label={(user?.displayName ?? 'A').slice(0, 1).toUpperCase()}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              labelStyle={{ color: theme.colors.onPrimaryContainer, fontFamily: theme.fonts.titleMedium.fontFamily }}
            />
          }
          title={user?.displayName ?? 'Admin'}
          text={user?.email}
          onPress={() => router.push('/account')}
        />
      </Card>

      <Button variant="soft" tone="error" icon="logout" label="Sign out" onPress={() => setConfirmSignOut(true)} />

      <ConfirmDialog
        visible={confirmSignOut}
        title="Sign out?"
        content="You will need your email and password to sign in again."
        confirmLabel="Sign out"
        icon="logout"
        onConfirm={signOut}
        onDismiss={() => setConfirmSignOut(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
});
