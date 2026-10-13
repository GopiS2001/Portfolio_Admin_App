import type { Message } from '@/lib/types';

import { useMemo, useState } from 'react';
import { View, Linking, StyleSheet } from 'react-native';
import { Text, Chip, Surface, Searchbar, TouchableRipple } from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { http, endpoints as api } from '@/lib/api';
import { revalidate, deleteItem, updateItem, useResource } from '@/lib/store';
import {
  toast,
  Button,
  Screen,
  Loading,
  TabHeader,
  EmptyState,
  IconButton,
  ConfirmDialog,
  GradientAvatar,
} from '@/components/ui';

// ----------------------------------------------------------------------

const fTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

function dayGroup(date: string) {
  const d = new Date(date);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const diff = (start.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86400000;
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return 'This week';
  return 'Earlier';
}

function when(date: string) {
  const d = new Date(date);
  const group = dayGroup(date);
  if (group === 'Today' || group === 'Yesterday') return fTime(d);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** Inbox for the website's contact form. */
export default function MessagesScreen() {
  const theme = useAppTheme();
  const { data, isLoading, refresh } = useResource<Message[]>(api.messages);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [query, setQuery] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const messages = useMemo(() => data ?? [], [data]);
  const unread = messages.filter((m) => !m.read).length;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = messages.filter(
      (m) =>
        (filter === 'all' || !m.read) &&
        (!q || [m.name, m.email, m.message].some((t) => t.toLowerCase().includes(q)))
    );
    const map = new Map<string, Message[]>();
    for (const m of shown) {
      const g = dayGroup(m.createdAt);
      map.set(g, [...(map.get(g) ?? []), m]);
    }
    return [...map.entries()];
  }, [messages, filter, query]);

  const setRead = async (m: Message, read: boolean) => {
    try {
      await updateItem<Message>(api.messages, m.id, { read });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await Promise.all(messages.filter((m) => !m.read).map((m) => http.put(`${api.messages}/${m.id}`, { read: true })));
      await Promise.all([revalidate(api.messages), revalidate(api.summary)]);
      toast.success('All messages marked as read');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setMarkingAll(false);
    }
  };

  const open = (m: Message) => {
    setExpanded(expanded === m.id ? null : m.id);
    if (!m.read) setRead(m, true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteItem(api.messages, deleting.id);
      toast.success('Message deleted');
      setDeleting(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const renderMessage = (m: Message) => {
    const isOpen = expanded === m.id;
    const accent = theme.custom.tones.info;
    return (
      <Surface
        key={m.id}
        elevation={1}
        style={[
          styles.card,
          {
            backgroundColor: m.read ? theme.colors.surface : theme.dark ? '#13222A' : '#F1FBFD',
            borderColor: m.read ? theme.custom.divider : accent.bg,
            shadowColor: theme.custom.cardShadow,
          },
        ]}
      >
        <View style={styles.cardInner}>
          {!m.read && <View style={[styles.accent, { backgroundColor: accent.main }]} />}
          <TouchableRipple onPress={() => open(m)}>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <GradientAvatar name={m.name} size={44} muted={m.read} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text variant="titleSmall" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {m.name}
                    </Text>
                    {!m.read && <View style={[styles.dot, { backgroundColor: accent.main }]} />}
                  </View>
                  <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                    {m.email}
                  </Text>
                </View>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, alignSelf: 'flex-start', marginTop: 2 }}>
                  {when(m.createdAt)}
                </Text>
              </View>

              <Text
                variant="bodyMedium"
                numberOfLines={isOpen ? undefined : 2}
                style={{ marginTop: 12, color: m.read ? theme.colors.onSurfaceVariant : theme.colors.onSurface, lineHeight: 21 }}
              >
                {m.message}
              </Text>

              {isOpen && (
                <View style={styles.actions}>
                  <Button
                    size="small"
                    variant="soft"
                    icon="reply"
                    label="Reply"
                    onPress={() => Linking.openURL(`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`)}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    tone="default"
                    icon={m.read ? 'email-mark-as-unread' : 'email-open-outline'}
                    label={m.read ? 'Unread' : 'Read'}
                    onPress={() => setRead(m, !m.read)}
                  />
                  <View style={{ flex: 1 }} />
                  <IconButton icon="trash-can-outline" label="Delete" color={theme.colors.error} onPress={() => setDeleting(m)} />
                </View>
              )}
            </View>
          </TouchableRipple>
        </View>
      </Surface>
    );
  };

  return (
    <Screen
      tab
      onRefresh={refresh}
      header={
        <TabHeader
          overline="Contact form"
          title="Inbox"
          subtitle={data ? `${unread} unread · ${messages.length} total` : undefined}
          right={
            unread > 0 ? (
              <Button size="small" variant="soft" icon="email-check-outline" label="Read all" loading={markingAll} onPress={markAllRead} />
            ) : undefined
          }
        />
      }
    >
      <Searchbar
        placeholder="Search name, email or message"
        value={query}
        onChangeText={setQuery}
        style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.custom.divider }]}
        inputStyle={{ fontFamily: theme.fonts.bodyMedium.fontFamily, minHeight: 0 }}
        elevation={0}
      />

      <View style={{ flexDirection: 'row', gap: 8, marginTop: -4 }}>
        {(['all', 'unread'] as const).map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            showSelectedCheck={false}
            onPress={() => setFilter(f)}
            icon={f === 'all' ? 'inbox' : 'email-alert'}
            style={[
              styles.chip,
              { backgroundColor: filter === f ? theme.colors.primaryContainer : theme.colors.surface, borderColor: theme.custom.divider },
            ]}
            textStyle={{ color: filter === f ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
          >
            {f === 'all' ? `All ${messages.length}` : `Unread ${unread}`}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <Loading />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={query ? 'magnify-close' : filter === 'unread' ? 'email-check-outline' : 'email-open-outline'}
          title={query ? 'No matches' : filter === 'unread' ? 'All caught up' : 'No messages yet'}
          description={
            query
              ? 'Try a different name, email or word.'
              : filter === 'unread'
                ? 'You have read every message.'
                : "Messages sent from the website's contact form appear here."
          }
        />
      ) : (
        groups.map(([group, items]) => (
          <View key={group} style={{ gap: 10 }}>
            <Text variant="labelMedium" style={[styles.group, { color: theme.colors.onSurfaceVariant }]}>
              {group.toUpperCase()}
            </Text>
            {items.map(renderMessage)}
          </View>
        ))
      )}

      <ConfirmDialog
        visible={!!deleting}
        title="Delete message?"
        content={deleting ? `From ${deleting.name} <${deleting.email}>` : ''}
        onConfirm={confirmDelete}
        onDismiss={() => setDeleting(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, height: 52 },
  chip: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  group: { letterSpacing: 1, paddingHorizontal: 4, marginTop: 4 },
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  cardInner: { borderRadius: 22, overflow: 'hidden' },
  accent: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
});
