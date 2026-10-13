import type { Ordered } from '@/lib/types';
import type { FieldDef } from './fields';

import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Modal, Platform, StyleSheet, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Text, Portal, Switch, Appbar, Button as PaperButton } from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { createItem, deleteItem, updateItem, useResource, reorderItems } from '@/lib/store';

import { FormFields, useFieldForm } from './fields';
import {
  Card,
  toast,
  Button,
  Divider,
  Loading,
  ToastHost,
  EmptyState,
  IconButton,
  ConfirmDialog,
} from './ui';

// ----------------------------------------------------------------------

type CrudListProps<T extends Ordered> = {
  /** API collection URL, e.g. /api/projects */
  url: string;
  title: string;
  subheader?: string;
  /** Singular noun for buttons and dialogs ("project"). */
  itemName: string;
  fields: FieldDef[];
  icon?: string;
  renderPrimary: (item: T) => React.ReactNode;
  renderSecondary?: (item: T) => React.ReactNode;
  renderLeading?: (item: T) => React.ReactNode;
};

/**
 * Full CRUD for one list resource: add / edit (full-screen form), delete (confirm),
 * show-hide switch and up/down ordering. Every change is live on the website.
 */
export function CrudList<T extends Ordered>({
  url,
  title,
  subheader,
  itemName,
  fields,
  icon,
  renderPrimary,
  renderSecondary,
  renderLeading,
}: CrudListProps<T>) {
  const theme = useAppTheme();
  const { data, isLoading, error } = useResource<T[]>(url);
  const items = data ?? [];
  const [editing, setEditing] = useState<T | null | 'new'>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const toggleVisible = async (item: T) => {
    try {
      await updateItem<T>(url, item.id, { visible: !item.visible } as Partial<T>);
      toast.success(item.visible ? 'Hidden from the website' : 'Shown on the website');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const move = async (index: number, delta: number) => {
    const ids = items.map((i) => i.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await reorderItems<T>(url, ids);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteItem(url, deleting.id);
      toast.success(`Deleted ${itemName}`);
      setDeleting(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const renderList = () => {
    if (isLoading) return <Loading />;
    if (error && !data) {
      return <EmptyState icon="cloud-off-outline" title="Could not load" description={error.message} />;
    }
    if (!items.length) {
      return <EmptyState title={`No ${itemName}s yet`} description={`Tap "Add" to create the first one.`} />;
    }
    return items.map((item, index) => (
      <View key={item.id}>
        {index > 0 && <Divider />}
        <View style={styles.row}>
          {/* Content gets the full width; the toolbar below holds order / visibility / edit / delete */}
          <View style={[styles.content, { opacity: item.visible ? 1 : 0.5 }]}>
            {renderLeading?.(item)}
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Text variant="titleSmall" numberOfLines={2}>
                {renderPrimary(item)}
              </Text>
              {renderSecondary && <View>{renderSecondary(item)}</View>}
            </View>
          </View>

          <View style={[styles.toolbar, { backgroundColor: theme.custom.neutral }]}>
            <IconButton icon="chevron-up" label="Move up" size={18} disabled={index === 0} onPress={() => move(index, -1)} />
            <IconButton
              icon="chevron-down"
              label="Move down"
              size={18}
              disabled={index === items.length - 1}
              onPress={() => move(index, 1)}
            />
            <View style={{ flex: 1 }} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.visible ? 'Visible' : 'Hidden'}
            </Text>
            <Switch value={item.visible} onValueChange={() => toggleVisible(item)} accessibilityLabel="Visible on website" />
            <IconButton icon="pencil-outline" label="Edit" onPress={() => setEditing(item)} />
            <IconButton icon="trash-can-outline" label="Delete" color={theme.colors.error} onPress={() => setDeleting(item)} />
          </View>
        </View>
      </View>
    ));
  };

  return (
    <Card
      title={title}
      subheader={subheader}
      icon={icon}
      padded={false}
      action={<Button size="small" variant="soft" icon="plus" label="Add" onPress={() => setEditing('new')} />}
    >
      {renderList()}

      <ItemEditor
        open={editing !== null}
        item={editing === 'new' ? null : editing}
        url={url}
        itemName={itemName}
        fields={fields}
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog
        visible={!!deleting}
        title={`Delete ${itemName}?`}
        content="This removes it from the website and cannot be undone."
        onConfirm={confirmDelete}
        onDismiss={() => setDeleting(null)}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function ItemEditor<T extends Ordered>({
  open,
  item,
  url,
  itemName,
  fields,
  onClose,
}: {
  open: boolean;
  item: T | null;
  url: string;
  itemName: string;
  fields: FieldDef[];
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const allFields = useMemo<FieldDef[]>(
    () => [...fields, { name: 'visible', label: 'Show on website', type: 'switch' }],
    [fields]
  );
  const form = useFieldForm(allFields, item);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.validate()) {
      toast.error('Please fill in the required fields');
      return;
    }
    setSaving(true);
    try {
      const body = form.body() as Partial<T>;
      if (item) {
        await updateItem<T>(url, item.id, body);
      } else {
        await createItem<T>(url, body);
      }
      onClose();
      toast.success(item ? `Saved ${itemName}` : `Added ${itemName}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const title = `${item ? 'Edit' : 'New'} ${itemName}`;

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {/* Dialogs (select pickers) and toasts must render inside the modal to appear above it */}
      <Portal.Host>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <Appbar.Header
            statusBarHeight={Platform.OS === 'ios' ? 0 : insets.top}
            style={{ backgroundColor: theme.colors.surface }}
            elevated
          >
            <Appbar.Action icon="close" onPress={onClose} accessibilityLabel="Cancel" />
            <Appbar.Content title={title.charAt(0).toUpperCase() + title.slice(1)} titleStyle={theme.fonts.titleLarge} />
            <PaperButton mode="contained" onPress={save} loading={saving} disabled={saving} style={{ marginRight: 8, borderRadius: 12 }}>
              Save
            </PaperButton>
          </Appbar.Header>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 48 }}
              keyboardShouldPersistTaps="handled"
            >
              <Card>
                <FormFields fields={allFields} form={form} />
              </Card>
              <Button
                label={item ? 'Save changes' : `Add ${itemName}`}
                icon="check"
                loading={saving}
                onPress={save}
                style={{ marginTop: 16 }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
          <ToastHost />
        </View>
      </Portal.Host>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: { padding: 16, gap: 12 },
  content: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 14, paddingHorizontal: 4, paddingVertical: 2 },
});
