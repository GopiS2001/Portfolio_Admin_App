import type { Message } from '@/lib/types';

import { useState } from 'react';
import { View, Linking, StyleSheet } from 'react-native';
import { Text, Avatar, TouchableRipple, SegmentedButtons } from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { endpoints as api } from '@/lib/api';
import { deleteItem, updateItem, useResource } from '@/lib/store';
import { Card, toast, Label, Screen, Divider, Loading, EmptyState, IconButton, ConfirmDialog } from '@/components/ui';

// ----------------------------------------------------------------------

const fDateTime = (d: string) =>
  new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '?';

/** Inbox for the website's contact form. */
export default function MessagesScreen() {
  const theme = useAppTheme();
  const { data, isLoading, refresh } = useResource<Message[]>(api.messages);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const messages = data ?? [];
  const unread = messages.filter((m) => !m.read).length;
  const shown = filter === 'unread' ? messages.filter((m) => !m.read) : messages;

  const setRead = async (m: Message, read: boolean) => {
    try {
      await updateItem<Message>(api.messages, m.id, { read });
    } catch (e) {
      toast.error((e as Error).message);
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

  const renderBody = () => {
    if (isLoading) return <Loading />;
    if (!shown.length) {
      return (
        <EmptyState
          icon={filter === 'unread' ? 'email-check-outline' : 'email-open-outline'}
          title={filter === 'unread' ? 'All caught up' : 'No messages yet'}
          description={
            filter === 'unread'
              ? 'You have read every message.'
              : "Messages sent from the website's contact form appear here."
          }
        />
      );
    }
    return shown.map((m, i) => {
      const isOpen = expanded === m.id;
      const tone = theme.custom.tones[m.read ? 'default' : 'info'];
      return (
        <View key={m.id}>
          {i > 0 && <Divider inset={72} />}
          <TouchableRipple onPress={() => open(m)}>
            <View style={styles.item}>
              <Avatar.Text
                size={42}
                label={initials(m.name)}
                style={{ backgroundColor: tone.bg }}
                labelStyle={{ color: tone.fg, fontSize: 15, fontFamily: theme.fonts.titleSmall.fontFamily }}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.top}>
                  <Text
                    variant="titleSmall"
                    numberOfLines={1}
                    style={{ flexShrink: 1, fontFamily: m.read ? theme.fonts.bodyLarge.fontFamily : theme.fonts.titleSmall.fontFamily }}
                  >
                    {m.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {fDateTime(m.createdAt)}
                  </Text>
                </View>
                <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                  {m.email}
                </Text>
                <Text
                  variant="bodyMedium"
                  numberOfLines={isOpen ? undefined : 2}
                  style={{ marginTop: 6, color: m.read ? theme.colors.onSurfaceVariant : theme.colors.onSurface }}
                >
                  {m.message}
                </Text>

                {isOpen && (
                  <View style={styles.actions}>
                    <IconButton
                      tonal
                      icon="reply-outline"
                      label="Reply by email"
                      onPress={() => Linking.openURL(`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`)}
                    />
                    <IconButton
                      tonal
                      icon={m.read ? 'email-mark-as-unread' : 'email-open-outline'}
                      label={m.read ? 'Mark as unread' : 'Mark as read'}
                      onPress={() => setRead(m, !m.read)}
                    />
                    <IconButton tonal icon="trash-can-outline" label="Delete" color={theme.colors.error} onPress={() => setDeleting(m)} />
                  </View>
                )}
              </View>
              {!m.read && <View style={[styles.dot, { backgroundColor: theme.custom.tones.info.main }]} />}
            </View>
          </TouchableRipple>
        </View>
      );
    });
  };

  return (
    <Screen anchor="contact" onRefresh={refresh}>
      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as 'all' | 'unread')}
        buttons={[
          { value: 'all', label: `All (${messages.length})`, icon: 'inbox-outline' },
          { value: 'unread', label: `Unread (${unread})`, icon: 'email-alert-outline' },
        ]}
      />
      <Card
        title="Inbox"
        subheader="Tap a message to read it and see actions."
        icon="inbox-outline"
        padded={false}
        action={unread > 0 ? <Label tone="info">{`${unread} new`}</Label> : null}
      >
        {renderBody()}
      </Card>

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
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 6 },
});
