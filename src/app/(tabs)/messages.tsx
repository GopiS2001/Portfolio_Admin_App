import type { Message } from '@/lib/types';

import { useState } from 'react';
import { View, Text, Alert, Linking, Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme';
import { endpoints as api } from '@/lib/api';
import { deleteItem, updateItem, useResource } from '@/lib/store';
import { Card, toast, Label, Screen, Divider, Loading, EmptyState, IconButton } from '@/components/ui';

// ----------------------------------------------------------------------

const fDateTime = (d: string) =>
  new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Inbox for the website's contact form. */
export default function MessagesScreen() {
  const { data, isLoading, refresh } = useResource<Message[]>(api.messages);
  const [expanded, setExpanded] = useState<number | null>(null);
  const messages = data ?? [];
  const unread = messages.filter((m) => !m.read).length;

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

  const confirmDelete = (m: Message) =>
    Alert.alert('Delete message?', `From ${m.name} <${m.email}>`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(api.messages, m.id);
            toast.success('Message deleted');
          } catch (e) {
            toast.error((e as Error).message);
          }
        },
      },
    ]);

  const renderBody = () => {
    if (isLoading) return <Loading />;
    if (!messages.length) {
      return (
        <EmptyState
          icon="mail-open-outline"
          title="No messages yet"
          description="Messages sent from the website's contact form appear here."
        />
      );
    }
    return messages.map((m, i) => {
      const isOpen = expanded === m.id;
      return (
        <View key={m.id} style={{ backgroundColor: m.read ? 'transparent' : 'rgba(145,158,171,0.08)' }}>
          {i > 0 && <Divider dashed />}
          <Pressable onPress={() => open(m)} style={styles.item}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {!m.read && <Label tone="info">New</Label>}
              <Text style={styles.name} numberOfLines={1}>
                {m.name}
              </Text>
            </View>
            <Text style={styles.email} numberOfLines={1}>
              {m.email}
            </Text>
            <Text style={styles.body} numberOfLines={isOpen ? undefined : 2}>
              {m.message}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.date}>{fDateTime(m.createdAt)}</Text>
              <View style={{ flexDirection: 'row' }}>
                <IconButton
                  icon="arrow-undo-outline"
                  label="Reply by email"
                  onPress={() => Linking.openURL(`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`)}
                />
                <IconButton
                  icon={m.read ? 'mail-unread-outline' : 'mail-open-outline'}
                  label={m.read ? 'Mark as unread' : 'Mark as read'}
                  onPress={() => setRead(m, !m.read)}
                />
                <IconButton icon="trash-outline" label="Delete" color={colors.error} onPress={() => confirmDelete(m)} />
              </View>
            </View>
          </Pressable>
        </View>
      );
    });
  };

  return (
    <Screen anchor="contact" onRefresh={refresh}>
      <Card title="Inbox" padded={false} action={unread > 0 ? <Label tone="info">{unread} unread</Label> : null}>
        {renderBody()}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  body: { fontSize: 14, color: colors.text, marginTop: 8, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  date: { fontSize: 12, color: colors.textDisabled },
});
